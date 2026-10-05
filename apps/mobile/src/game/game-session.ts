import { addLetter, applyGuess, createInitialState, removeLetter } from './game-state';
import type { GameState } from './game-state';

export type GameMode = 'daily' | 'unlimited';

export interface GameSession {
  readonly phase: 'loading' | 'error' | 'ready';
  readonly solution: string;
  readonly wordId: number | null;
  readonly game: GameState;
  readonly message: string | null;
  readonly isSubmitting: boolean;
  readonly storageKey: string | null;
}

export type SessionAction =
  | { readonly type: 'loading' }
  | { readonly type: 'loaded'; readonly solution: string; readonly wordId: number | null; readonly game: GameState; readonly storageKey: string | null }
  | { readonly type: 'failed' }
  | { readonly type: 'letter'; readonly letter: string }
  | { readonly type: 'delete' }
  | { readonly type: 'submitted' }
  | { readonly type: 'guess'; readonly word: string }
  | { readonly type: 'rejected'; readonly message: string }
  | { readonly type: 'message'; readonly message: string | null };

const WIN_MESSAGES = ['Muhteşem!', 'Harika!', 'Güzel!', 'İyi!', 'Fena değil!', 'Kıl payı!'] as const;
const FALLBACK_WIN_MESSAGE = 'Tebrikler!';

export const INVALID_WORD_MESSAGE = 'Kelime listede yok';
export const CONNECTION_ERROR_MESSAGE = 'Bağlantı hatası, tekrar dene';

export function createSession(): GameSession {
  return { phase: 'loading', solution: '', wordId: null, game: createInitialState(), message: null, isSubmitting: false, storageKey: null };
}

export function shortGuessMessage(wordLength: number): string {
  return `Kelime ${wordLength} harf olmalı`;
}

export function finishedMessage(game: GameState, solution: string): string | null {
  if (game.gameStatus === 'won') return WIN_MESSAGES[game.guesses.length - 1] ?? FALLBACK_WIN_MESSAGE;
  if (game.gameStatus === 'lost') return `Kelime: ${solution}`;
  return null;
}

function reducePending(session: GameSession, action: SessionAction): GameSession {
  if (action.type === 'rejected') return { ...session, isSubmitting: false, message: action.message };
  if (action.type !== 'guess') return session;
  const game = applyGuess({ ...session.game, currentGuess: action.word }, session.solution);
  return { ...session, game, isSubmitting: false, message: finishedMessage(game, session.solution) };
}

function reduceReady(session: GameSession, action: SessionAction): GameSession {
  if (session.isSubmitting) return reducePending(session, action);
  if (action.type === 'letter') return { ...session, game: addLetter(session.game, action.letter, session.solution.length) };
  if (action.type === 'delete') return { ...session, game: removeLetter(session.game) };
  if (action.type === 'submitted') return { ...session, isSubmitting: true };
  return session;
}

export function reduceSession(session: GameSession, action: SessionAction): GameSession {
  if (action.type === 'loading') return createSession();
  if (action.type === 'failed') return { ...session, phase: 'error' };
  if (action.type === 'loaded') {
    const { solution, wordId, game, storageKey } = action;
    return { ...createSession(), phase: 'ready', solution, wordId, game, storageKey };
  }
  if (action.type === 'message') return { ...session, message: action.message };
  return session.phase === 'ready' ? reduceReady(session, action) : session;
}

export function submitBlocker(session: GameSession): string | null {
  if (session.phase !== 'ready' || session.isSubmitting || session.game.gameStatus !== 'playing') return '';
  if (session.game.currentGuess.length !== session.solution.length) return shortGuessMessage(session.solution.length);
  return null;
}
