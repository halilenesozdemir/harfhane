import { describe, it, expect } from 'vitest';
import { getTodayStatus } from './today-status';
import type { GameState } from '../../types';

function gameState(overrides: Partial<GameState> = {}): GameState {
  return {
    guesses: [],
    evaluations: [],
    currentGuess: '',
    gameStatus: 'playing',
    keyboardStatus: {},
    ...overrides,
  };
}

describe('getTodayStatus', () => {
  it('should return not-started when no guesses were made', () => {
    expect(getTodayStatus(gameState()).kind).toBe('not-started');
  });

  it('should return in-progress when guesses exist but the game is still playing', () => {
    const status = getTodayStatus(gameState({ guesses: ['KALEM'] }));
    expect(status).toEqual({ kind: 'in-progress', guesses: 1 });
  });

  it('should return won when the game status is won', () => {
    const status = getTodayStatus(gameState({ guesses: ['KALEM', 'SİMİT'], gameStatus: 'won' }));
    expect(status).toEqual({ kind: 'won', guesses: 2 });
  });

  it('should return lost when the game status is lost', () => {
    const status = getTodayStatus(gameState({ gameStatus: 'lost' }));
    expect(status.kind).toBe('lost');
  });
});
