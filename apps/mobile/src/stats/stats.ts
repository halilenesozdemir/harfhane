import { getTodayString } from '@harfhane/shared';
import type { KeyValueStore } from '../game/game-storage';

export type WordLength = 4 | 5 | 6;

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

// `today` is already a Turkey-day string (UTC+3, fixed — Turkey has not observed DST since
// 2016), so this must stay pure UTC-calendar arithmetic. `new Date(today)` followed by the
// local-time `getDate`/`setDate` would instead walk the device's own calendar day, which can
// double-shift across a device-timezone DST transition (losing or repeating a Turkey day) for
// players outside Turkey — see stats.test.ts's DST regression test.
function yesterdayOf(today: string): string {
  const date = new Date(`${today}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
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

// Added before the first public release so a later field addition to DailyStats/UnlimitedStats
// never looks like corrupt data to isDailyStats/isUnlimitedStats and gets silently reset.
export const STATS_SCHEMA_VERSION = 1;

interface StatsEnvelope {
  readonly schemaVersion: number;
  readonly data: unknown;
}

function isStatsEnvelope(value: unknown): value is StatsEnvelope {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate['schemaVersion'] === 'number' && 'data' in candidate;
}

// Decides what a stored stats blob means, for both the pre-versioning shape and any future
// schemaVersion. An install from before this envelope existed wrote the stats object directly
// (no envelope) — that shape is treated as schema v1 so those installs keep their stats/streak
// instead of being wiped by the new guard. schemaVersion itself is not checked against
// STATS_SCHEMA_VERSION: an unrecognised version (older or newer than this build knows about) is
// still accepted as long as its `data` structurally matches the current shape, so a version
// bump alone never wipes data. Only a `data` shape this guard cannot recognise — e.g. a future
// release that changes the fields, or genuinely corrupt storage — falls back to initial stats;
// that loss is accepted as the cost of a guard that can only validate shapes it knows about.
function decodeStats<T>(parsed: unknown, isData: (value: unknown) => value is T, createInitial: () => T): T {
  if (isData(parsed)) return parsed;
  if (isStatsEnvelope(parsed) && isData(parsed.data)) return parsed.data;
  return createInitial();
}

function encodeStats<T>(data: T): string {
  return JSON.stringify({ schemaVersion: STATS_SCHEMA_VERSION, data });
}

export async function loadDailyStats(store: KeyValueStore, length: WordLength): Promise<DailyStats> {
  const raw = await store.getItem(dailyStatsKey(length));
  const parsed = raw === null ? null : parseJson(raw);
  return decodeStats(parsed, isDailyStats, createInitialDailyStats);
}

export async function saveDailyStats(store: KeyValueStore, length: WordLength, stats: DailyStats): Promise<void> {
  await store.setItem(dailyStatsKey(length), encodeStats(stats));
}

export async function loadUnlimitedStats(store: KeyValueStore, length: WordLength): Promise<UnlimitedStats> {
  const raw = await store.getItem(unlimitedStatsKey(length));
  const parsed = raw === null ? null : parseJson(raw);
  return decodeStats(parsed, isUnlimitedStats, createInitialUnlimitedStats);
}

export async function saveUnlimitedStats(store: KeyValueStore, length: WordLength, stats: UnlimitedStats): Promise<void> {
  await store.setItem(unlimitedStatsKey(length), encodeStats(stats));
}
