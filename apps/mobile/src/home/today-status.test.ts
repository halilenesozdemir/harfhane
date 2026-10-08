import { describe, expect, it } from 'vitest';
import { createInitialState } from '../game/game-state';
import { createInitialDailyStats } from '../stats/stats';
import { getDisplayedStreak, getTodayStatus } from './today-status';
import type { GameState } from '../game/game-state';
import type { DailyStats } from '../stats/stats';

const TODAY = '2026-10-08';
const YESTERDAY = '2026-10-07';
const TWO_DAYS_AGO = '2026-10-06';

function statsWithStreak(currentStreak: number, lastPlayedDate: string | null): DailyStats {
  return { ...createInitialDailyStats(), currentStreak, lastPlayedDate };
}

function stateWithGuesses(guesses: readonly string[], gameStatus: GameState['gameStatus']): GameState {
  return { ...createInitialState(), guesses, gameStatus };
}

describe('getDisplayedStreak', () => {
  it('should return the stored streak when last played today', () => {
    expect(getDisplayedStreak(statsWithStreak(3, TODAY), TODAY)).toBe(3);
  });

  it('should return the stored streak when last played yesterday', () => {
    expect(getDisplayedStreak(statsWithStreak(3, YESTERDAY), TODAY)).toBe(3);
  });

  it('should return zero when the last played date is two days ago (011-AE7)', () => {
    expect(getDisplayedStreak(statsWithStreak(3, TWO_DAYS_AGO), TODAY)).toBe(0);
  });

  it('should return zero when nothing has ever been played', () => {
    expect(getDisplayedStreak(statsWithStreak(0, null), TODAY)).toBe(0);
  });
});

describe('getTodayStatus', () => {
  it('should report not-started when the daily game has no guesses', () => {
    const status = getTodayStatus(createInitialDailyStats(), stateWithGuesses([], 'playing'), TODAY);
    expect(status.state).toEqual({ kind: 'not-started' });
  });

  it('should report in-progress with the guess count when the daily game is playing with guesses', () => {
    const status = getTodayStatus(createInitialDailyStats(), stateWithGuesses(['kalem', 'tahta'], 'playing'), TODAY);
    expect(status.state).toEqual({ kind: 'in-progress', guesses: 2 });
  });

  it('should report won with the guess count when the daily game is won', () => {
    const status = getTodayStatus(createInitialDailyStats(), stateWithGuesses(['kalem', 'tahta', 'test!'], 'won'), TODAY);
    expect(status.state).toEqual({ kind: 'won', guesses: 3 });
  });

  it('should report lost when the daily game is lost', () => {
    const status = getTodayStatus(createInitialDailyStats(), stateWithGuesses(new Array(6).fill('tahta'), 'lost'), TODAY);
    expect(status.state).toEqual({ kind: 'lost' });
  });

  it('should carry the displayed streak alongside the state', () => {
    const status = getTodayStatus(statsWithStreak(5, TODAY), stateWithGuesses([], 'playing'), TODAY);
    expect(status.displayedStreak).toBe(5);
  });
});
