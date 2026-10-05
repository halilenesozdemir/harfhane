import { useCallback, useEffect, useReducer, useState } from 'react';
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
    return { type: 'loaded', solution: normalizeWord(random.word.word), wordId: random.wordId, game: createInitialState() };
  }
  const daily = await api.fetchDailyWord(wordLength);
  const game = await loadGameState(store, dailyGameKey(today(), wordLength));
  return { type: 'loaded', solution: normalizeWord(daily.word.word), wordId: null, game };
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

function useDailyPersistence(options: UseGameOptions, session: GameSession) {
  const { mode, wordLength, store, today = getTodayString } = options;
  useEffect(() => {
    if (mode !== 'daily' || session.phase !== 'ready') return;
    void saveGameState(store, dailyGameKey(today(), wordLength), session.game);
  }, [mode, wordLength, store, today, session.phase, session.game]);
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
  return useCallback(() => {
    const blocker = submitBlocker(session);
    if (blocker !== null) return void (blocker && dispatch({ type: 'message', message: blocker }));
    api
      .validateWord(session.game.currentGuess)
      .then(({ isValid }) => dispatch(isValid ? { type: 'guess' } : { type: 'message', message: INVALID_WORD_MESSAGE }))
      .catch(() => dispatch({ type: 'message', message: CONNECTION_ERROR_MESSAGE }));
  }, [api, session, dispatch]);
}

export function useGame(options: UseGameOptions): UseGameResult {
  const [session, dispatch] = useReducer(reduceSession, undefined, createSession);
  const [round, setRound] = useState(0);
  useSessionLoader(options, dispatch, round);
  useDailyPersistence(options, session);
  useMessageTimeout(session, dispatch);
  const onSubmit = useSubmit(options, session, dispatch);
  const onLetter = useCallback((letter: string) => dispatch({ type: 'letter', letter }), []);
  const onDelete = useCallback(() => dispatch({ type: 'delete' }), []);
  const startNewGame = useCallback(() => setRound((current) => current + 1), []);
  return { session, onLetter, onDelete, onSubmit, startNewGame };
}
