import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { normalizeWord } from '@harfhane/shared';
import type { ApiClient } from '../lib/api';
import { reject as rejectHaptic, win as winHaptic } from '../lib/haptics';
import { useHapticsSettings } from '../lib/useHapticsSettings';
import { createInitialState, dailyGameKey } from './game-state';
import type { GameStatus } from './game-state';
import { loadGameState, saveGameState } from './game-storage';
import type { KeyValueStore } from './game-storage';
import { CONNECTION_ERROR_MESSAGE, INVALID_WORD_MESSAGE, createSession, reduceSession, submitBlocker } from './game-session';
import type { GameMode, GameSession, SessionAction } from './game-session';

export interface GameDependencies {
  readonly api: ApiClient;
  readonly store: KeyValueStore;
}

export interface UseGameOptions extends GameDependencies {
  readonly mode: GameMode;
  readonly wordLength: number;
}

export interface UseGameResult {
  readonly session: GameSession;
  readonly isHapticsEnabled: boolean;
  onLetter(letter: string): void;
  onDelete(): void;
  onSubmit(): void;
  startNewGame(): void;
}

const MESSAGE_DURATION_MS = 2000;

async function loadSession({ mode, wordLength, api, store }: UseGameOptions): Promise<SessionAction> {
  if (mode === 'unlimited') {
    const random = await api.fetchRandomWord(wordLength);
    return {
      type: 'loaded',
      solution: normalizeWord(random.word.word),
      wordId: random.wordId,
      game: createInitialState(),
      storageKey: null,
      dailyDate: null,
    };
  }
  // The daily word is fetched before any storage read, and the server's own `date` — never the
  // device's today() — keys that read/write (storageKey), `session.dailyDate`, and (through it)
  // the hint storage key and the stats entry a finished game is recorded under. A device clock
  // that runs ahead of the real Turkey day would otherwise key the same still-unchanged server
  // word under a fresh "tomorrow" entry: an empty board the player would then legitimately
  // replay and have counted as a second game, double-counting stats until the real day turns
  // over (docs/backlog.md's now-resolved "Daily storage/hint/stats keys still use the device
  // date" note from #141's review). Keying by the server's date means a reload during that skew
  // window (e.g. pressing the midnight CTA) just restores the same already-finished entry.
  const daily = await api.fetchDailyWord(wordLength);
  const storageKey = dailyGameKey(daily.date, wordLength);
  const stored = await loadGameState(store, storageKey);
  // The server's own gameNumber/date always wins over whatever a previous load stored, so a
  // wrong device clock never makes the card show a locally-recomputed number.
  const game = { ...stored, gameNumber: daily.gameNumber, date: daily.date };
  return { type: 'loaded', solution: normalizeWord(daily.word.word), wordId: null, game, storageKey, dailyDate: daily.date };
}

function useSessionLoader(options: UseGameOptions, dispatch: (action: SessionAction) => void, round: number) {
  const { mode, wordLength, api, store } = options;
  useEffect(() => {
    let isCurrent = true;
    dispatch({ type: 'loading' });
    loadSession({ mode, wordLength, api, store })
      .then((action) => isCurrent && dispatch(action))
      .catch(() => isCurrent && dispatch({ type: 'failed' }));
    return () => {
      isCurrent = false;
    };
  }, [mode, wordLength, api, store, dispatch, round]);
}

function useDailyPersistence(store: KeyValueStore, session: GameSession) {
  const { storageKey, game } = session;
  useEffect(() => {
    if (storageKey === null) return;
    void saveGameState(store, storageKey, game);
  }, [store, storageKey, game]);
}

function useMessageTimeout(session: GameSession, dispatch: (action: SessionAction) => void) {
  const isPlaying = session.game.gameStatus === 'playing';
  useEffect(() => {
    if (!session.message || !isPlaying) return undefined;
    const timer = setTimeout(() => dispatch({ type: 'message', message: null }), MESSAGE_DURATION_MS);
    return () => clearTimeout(timer);
  }, [session.message, isPlaying, dispatch]);
}

function useWinHaptics(session: GameSession, isHapticsEnabled: boolean) {
  const previousStatusRef = useRef<GameStatus | null>(null);
  useEffect(() => {
    if (session.phase !== 'ready') {
      previousStatusRef.current = null;
      return;
    }
    const previousStatus = previousStatusRef.current;
    const hasJustWon = session.game.gameStatus === 'won' && previousStatus !== null && previousStatus !== 'won';
    if (hasJustWon) void winHaptic(isHapticsEnabled);
    previousStatusRef.current = session.game.gameStatus;
  }, [session.phase, session.game.gameStatus, isHapticsEnabled]);
}

function useSubmit(
  options: UseGameOptions,
  session: GameSession,
  dispatch: (action: SessionAction) => void,
  isHapticsEnabled: boolean,
) {
  const { api } = options;
  const isInFlight = useRef(false);
  return useCallback(() => {
    const blocker = isInFlight.current ? '' : submitBlocker(session);
    if (blocker !== null) {
      if (blocker) {
        void rejectHaptic(isHapticsEnabled);
        dispatch({ type: 'message', message: blocker });
      }
      return;
    }
    const word = session.game.currentGuess;
    isInFlight.current = true;
    dispatch({ type: 'submitted' });
    api
      .validateWord(word)
      .then(({ isValid }) => {
        if (!isValid) void rejectHaptic(isHapticsEnabled);
        dispatch(isValid ? { type: 'guess', word } : { type: 'rejected', message: INVALID_WORD_MESSAGE });
      })
      .catch(() => dispatch({ type: 'rejected', message: CONNECTION_ERROR_MESSAGE }))
      .finally(() => {
        isInFlight.current = false;
      });
  }, [api, session, dispatch, isHapticsEnabled]);
}

export function useGame(options: UseGameOptions): UseGameResult {
  const [session, dispatch] = useReducer(reduceSession, undefined, createSession);
  const [round, setRound] = useState(0);
  const { isEnabled: isHapticsEnabled } = useHapticsSettings(options.store);
  useSessionLoader(options, dispatch, round);
  useDailyPersistence(options.store, session);
  useMessageTimeout(session, dispatch);
  useWinHaptics(session, isHapticsEnabled);
  const onSubmit = useSubmit(options, session, dispatch, isHapticsEnabled);
  const onLetter = useCallback((letter: string) => dispatch({ type: 'letter', letter }), []);
  const onDelete = useCallback(() => dispatch({ type: 'delete' }), []);
  const startNewGame = useCallback(() => setRound((current) => current + 1), []);
  return { session, isHapticsEnabled, onLetter, onDelete, onSubmit, startNewGame };
}
