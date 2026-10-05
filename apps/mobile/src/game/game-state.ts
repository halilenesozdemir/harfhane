import { checkGameStatus, evaluateGuess, normalizeWord, updateKeyboardStatus } from '@harfhane/shared';
import type { TileStatus } from '@harfhane/shared';

export type GameStatus = 'playing' | 'won' | 'lost';

export interface GameState {
  readonly guesses: readonly string[];
  readonly evaluations: readonly (readonly TileStatus[])[];
  readonly currentGuess: string;
  readonly gameStatus: GameStatus;
  readonly keyboardStatus: Readonly<Record<string, TileStatus>>;
}

const ANONYMOUS_USER_KEY = 'anon';

export function createInitialState(): GameState {
  return { guesses: [], evaluations: [], currentGuess: '', gameStatus: 'playing', keyboardStatus: {} };
}

export function addLetter(state: GameState, letter: string, wordLength: number): GameState {
  if (state.gameStatus !== 'playing' || state.currentGuess.length >= wordLength) return state;
  return { ...state, currentGuess: state.currentGuess + normalizeWord(letter) };
}

export function removeLetter(state: GameState): GameState {
  if (state.gameStatus !== 'playing' || state.currentGuess.length === 0) return state;
  return { ...state, currentGuess: state.currentGuess.slice(0, -1) };
}

export function applyGuess(state: GameState, solution: string): GameState {
  const guess = state.currentGuess;
  const evaluation = evaluateGuess(guess, solution);
  const guesses = [...state.guesses, guess];
  return {
    guesses,
    evaluations: [...state.evaluations, evaluation],
    currentGuess: '',
    gameStatus: checkGameStatus(guesses, solution),
    keyboardStatus: updateKeyboardStatus({ ...state.keyboardStatus }, guess, evaluation),
  };
}

export function dailyGameKey(date: string, wordLength: number): string {
  return `harfhane:game:${ANONYMOUS_USER_KEY}:${date}:${wordLength}`;
}
