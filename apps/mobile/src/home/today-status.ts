import type { GameState } from '../game/game-state';
import type { DailyStats } from '../stats/stats';

export type TodayState =
  | { readonly kind: 'not-started' }
  | { readonly kind: 'in-progress'; readonly guesses: number }
  | { readonly kind: 'won'; readonly guesses: number }
  | { readonly kind: 'lost' };

export interface TodayStatus {
  readonly displayedStreak: number;
  readonly state: TodayState;
}

function yesterdayOf(today: string): string {
  const date = new Date(`${today}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().split('T')[0]!;
}

// mobile-redesign-spec.md section B: currentStreak is not reset until the
// next result, so a lastPlayedDate older than yesterday means the streak is
// broken even though the stored number has not caught up yet.
function isWithinStreakWindow(lastPlayedDate: string | null, today: string): boolean {
  if (lastPlayedDate === null) return false;
  return lastPlayedDate === today || lastPlayedDate === yesterdayOf(today);
}

export function getDisplayedStreak(stats: DailyStats, today: string): number {
  return isWithinStreakWindow(stats.lastPlayedDate, today) ? stats.currentStreak : 0;
}

function todayState(dailyState: GameState): TodayState {
  const guesses = dailyState.guesses.length;
  if (dailyState.gameStatus === 'won') return { kind: 'won', guesses };
  if (dailyState.gameStatus === 'lost') return { kind: 'lost' };
  return guesses === 0 ? { kind: 'not-started' } : { kind: 'in-progress', guesses };
}

/**
 * Pure home/stats helper (mobile-redesign-spec.md section B): `dailyState`
 * must already be loaded for `today`'s storage key (`dailyGameKey`); this
 * function makes no assumption about dates beyond the `today` string given.
 */
export function getTodayStatus(stats: DailyStats, dailyState: GameState, today: string): TodayStatus {
  return { displayedStreak: getDisplayedStreak(stats, today), state: todayState(dailyState) };
}
