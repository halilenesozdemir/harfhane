import type { GameState } from '../../types';

export type TodayStatusKind = 'not-started' | 'in-progress' | 'won' | 'lost';

export interface TodayStatus {
  readonly kind: TodayStatusKind;
  readonly guesses: number;
}

/**
 * Pure helper mirroring apps/mobile/src/home/today-status.ts: derives the
 * daily mode card's status from today's stored GameState. Never touches
 * storage itself — the caller reads the same key useGameState.ts writes to
 * (`harfhane:game:anon:${today}:${wordLength}`) and passes the result in.
 */
export function getTodayStatus(dailyState: GameState): TodayStatus {
  const guesses = dailyState.guesses.length;
  if (dailyState.gameStatus === 'won') return { kind: 'won', guesses };
  if (dailyState.gameStatus === 'lost') return { kind: 'lost', guesses };
  return { kind: guesses === 0 ? 'not-started' : 'in-progress', guesses };
}
