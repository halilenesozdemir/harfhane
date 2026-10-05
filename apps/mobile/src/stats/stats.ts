import { getTodayString } from '@harfhane/shared';
import type { KeyValueStore } from '../game/game-storage';

export type WordLength = 4 | 5 | 6;

const VALID_WORD_LENGTHS: ReadonlySet<number> = new Set<WordLength>([4, 5, 6]);

export function isWordLength(value: number): value is WordLength {
  return VALID_WORD_LENGTHS.has(value);
}

export interface DailyStats {
  readonly gamesPlayed: number;
  readonly gamesWon: number;
  readonly currentStreak: number;
  readonly maxStreak: number;
  readonly guessDistribution: readonly number[];
  readonly lastPlayedDate: string | null;
}

export interface UnlimitedStats {
  readonly gamesPlayed: number;
  readonly gamesWon: number;
  readonly guessDistribution: readonly number[];
}

const DISTRIBUTION_SIZE = 6;
const MAX_WINNING_GUESSES = 6;

export function createInitialDailyStats(): DailyStats {
  return {
    gamesPlayed: 0,
    gamesWon: 0,
    currentStreak: 0,
    maxStreak: 0,
    guessDistribution: new Array(DISTRIBUTION_SIZE).fill(0),
    lastPlayedDate: null,
  };
}

export function createInitialUnlimitedStats(): UnlimitedStats {
  return { gamesPlayed: 0, gamesWon: 0, guessDistribution: new Array(DISTRIBUTION_SIZE).fill(0) };
}

function withGuessRecorded(distribution: readonly number[], won: boolean, guessCount: number): number[] {
  const next = [...distribution];
  if (won && guessCount > 0 && guessCount <= MAX_WINNING_GUESSES) {
    const index = guessCount - 1;
    next[index] = (next[index] ?? 0) + 1;
  }
  return next;
}

function yesterdayOf(today: string): string {
  const date = new Date(today);
  date.setDate(date.getDate() - 1);
  return date.toISOString().split('T')[0]!;
}

export function recordDailyResult(
  stats: DailyStats,
  won: boolean,
  guessCount: number,
  today: string = getTodayString(),
): DailyStats {
  const isConsecutive = stats.lastPlayedDate === yesterdayOf(today);
  const currentStreak = won ? (isConsecutive ? stats.currentStreak + 1 : 1) : 0;
  return {
    gamesPlayed: stats.gamesPlayed + 1,
    gamesWon: stats.gamesWon + (won ? 1 : 0),
    currentStreak,
    maxStreak: Math.max(stats.maxStreak, currentStreak),
    guessDistribution: withGuessRecorded(stats.guessDistribution, won, guessCount),
    lastPlayedDate: today,
  };
}

export function recordUnlimitedResult(stats: UnlimitedStats, won: boolean, guessCount: number): UnlimitedStats {
  return {
    gamesPlayed: stats.gamesPlayed + 1,
    gamesWon: stats.gamesWon + (won ? 1 : 0),
    guessDistribution: withGuessRecorded(stats.guessDistribution, won, guessCount),
  };
}

export function dailyStatsKey(length: WordLength): string {
  return `harfhane:stats:${length}`;
}

export function unlimitedStatsKey(length: WordLength): string {
  return `harfhane:unlimited:stats:${length}`;
}

function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'number');
}

function isDailyStats(value: unknown): value is DailyStats {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate['gamesPlayed'] === 'number' &&
    typeof candidate['gamesWon'] === 'number' &&
    typeof candidate['currentStreak'] === 'number' &&
    typeof candidate['maxStreak'] === 'number' &&
    isNumberArray(candidate['guessDistribution']) &&
    (candidate['lastPlayedDate'] === null || typeof candidate['lastPlayedDate'] === 'string')
  );
}

function isUnlimitedStats(value: unknown): value is UnlimitedStats {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate['gamesPlayed'] === 'number' &&
    typeof candidate['gamesWon'] === 'number' &&
    isNumberArray(candidate['guessDistribution'])
  );
}

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function loadDailyStats(store: KeyValueStore, length: WordLength): Promise<DailyStats> {
  const raw = await store.getItem(dailyStatsKey(length));
  const parsed = raw === null ? null : parseJson(raw);
  return isDailyStats(parsed) ? parsed : createInitialDailyStats();
}

export async function saveDailyStats(store: KeyValueStore, length: WordLength, stats: DailyStats): Promise<void> {
  await store.setItem(dailyStatsKey(length), JSON.stringify(stats));
}

export async function loadUnlimitedStats(store: KeyValueStore, length: WordLength): Promise<UnlimitedStats> {
  const raw = await store.getItem(unlimitedStatsKey(length));
  const parsed = raw === null ? null : parseJson(raw);
  return isUnlimitedStats(parsed) ? parsed : createInitialUnlimitedStats();
}

export async function saveUnlimitedStats(store: KeyValueStore, length: WordLength, stats: UnlimitedStats): Promise<void> {
  await store.setItem(unlimitedStatsKey(length), JSON.stringify(stats));
}
