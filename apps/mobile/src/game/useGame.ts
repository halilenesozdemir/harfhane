import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { getTodayString, normalizeWord } from '@harfhane/shared';
import type { ApiClient } from '../lib/api';
import { createInitialState, dailyGameKey } from './game-state';
import { loadGameState, saveGameState } from './game-storage';
import type { KeyValueStore } from './game-storage';
import { CONNECTION_ERROR_MESSAGE, INVALID_WORD_MESSAGE, createSession, reduceSession, submitBlocker } from './game-session';
import type { GameMode, GameSession, SessionAction } from './game-session';

export interface GameDependencies {
  readonly api: ApiClient;
  readonly store: KeyValueStore;
  readonly today?: () => string;
}

export interface UseGameOptions extends GameDependencies {
  readonly mode: GameMode;
  readonly wordLength: number;
}

export interface UseGameResult {
  readonly session: GameSession;
  onLetter(letter: string): void;
  onDelete(): void;
  onSubmit(): void;
  startNewGame(): void;
}

const MESSAGE_DURATION_MS = 2000;

async function loadSession({ mode, wordLength, api, store, today = getTodayString }: UseGameOptions): Promise<SessionAction> {
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
  const date = today();
  const storageKey = dailyGameKey(date, wordLength);
  const daily = await api.fetchDailyWord(wordLength);
  const game = await loadGameState(store, storageKey);
  return { type: 'loaded', solution: normalizeWord(daily.word.word), wordId: null, game, storageKey, dailyDate: date };
}

function useSessionLoader(options: UseGameOptions, dispatch: (action: SessionAction) => void, round: number) {
  const { mode, wordLength, api, store, today } = options;
  useEffect(() => {
    let isCurrent = true;
    dispatch({ type: 'loading' });
    loadSession({ mode, wordLength, api, store, today })
      .then((action) => isCurrent && dispatch(action))
      .catch(() => isCurrent && dispatch({ type: 'failed' }));
    return () => {
      isCurrent = false;
    };
  }, [mode, wordLength, api, store, today, dispatch, round]);
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

function useSubmit(options: UseGameOptions, session: GameSession, dispatch: (action: SessionAction) => void) {
  const { api } = options;
  const isInFlight = useRef(false);
  return useCallback(() => {
    const blocker = isInFlight.current ? '' : submitBlocker(session);
    if (blocker !== null) return void (blocker && dispatch({ type: 'message', message: blocker }));
    const word = session.game.currentGuess;
    isInFlight.current = true;
    dispatch({ type: 'submitted' });
    api
      .validateWord(word)
      .then(({ isValid }) => dispatch(isValid ? { type: 'guess', word } : { type: 'rejected', message: INVALID_WORD_MESSAGE }))
      .catch(() => dispatch({ type: 'rejected', message: CONNECTION_ERROR_MESSAGE }))
      .finally(() => {
        isInFlight.current = false;
      });
  }, [api, session, dispatch]);
}

export function useGame(options: UseGameOptions): UseGameResult {
  const [session, dispatch] = useReducer(reduceSession, undefined, createSession);
  const [round, setRound] = useState(0);
  useSessionLoader(options, dispatch, round);
  useDailyPersistence(options.store, session);
  useMessageTimeout(session, dispatch);
  const onSubmit = useSubmit(options, session, dispatch);
  const onLetter = useCallback((letter: string) => dispatch({ type: 'letter', letter }), []);
  const onDelete = useCallback(() => dispatch({ type: 'delete' }), []);
  const startNewGame = useCallback(() => setRound((current) => current + 1), []);
  return { session, onLetter, onDelete, onSubmit, startNewGame };
}
