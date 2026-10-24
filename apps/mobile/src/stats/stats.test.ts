import { afterEach, describe, expect, it } from 'vitest';
import type { KeyValueStore } from '../game/game-storage';
import {
  createInitialDailyStats,
  createInitialUnlimitedStats,
  dailyStatsKey,
  loadDailyStats,
  loadUnlimitedStats,
  recordDailyResult,
  recordUnlimitedResult,
  saveDailyStats,
  saveUnlimitedStats,
  unlimitedStatsKey,
} from './stats';

function createMemoryStore(initial: Record<string, string> = {}): KeyValueStore {
  const entries = new Map(Object.entries(initial));
  return {
    getItem: async (key) => entries.get(key) ?? null,
    setItem: async (key, value) => {
      entries.set(key, value);
    },
  };
}

describe('createInitialDailyStats', () => {
  it('should start with an empty distribution and no streak', () => {
    expect(createInitialDailyStats()).toEqual({
      gamesPlayed: 0,
      gamesWon: 0,
      currentStreak: 0,
      maxStreak: 0,
      guessDistribution: [0, 0, 0, 0, 0, 0],
      lastPlayedDate: null,
    });
  });
});

describe('recordDailyResult', () => {
  it('should continue the streak when the player played yesterday and wins', () => {
    const stats = { ...createInitialDailyStats(), currentStreak: 3, maxStreak: 3, lastPlayedDate: '2026-10-04' };
    const next = recordDailyResult(stats, true, 3, '2026-10-05');
    expect(next.currentStreak).toBe(4);
    expect(next.maxStreak).toBe(4);
  });

  it('should reset the streak to zero when the player loses', () => {
    const stats = { ...createInitialDailyStats(), currentStreak: 5, maxStreak: 5, lastPlayedDate: '2026-10-04' };
    const next = recordDailyResult(stats, false, 0, '2026-10-05');
    expect(next.currentStreak).toBe(0);
    expect(next.maxStreak).toBe(5);
  });

  it('should restart the streak at one when the last played day was not yesterday', () => {
    const stats = { ...createInitialDailyStats(), currentStreak: 5, maxStreak: 5, lastPlayedDate: '2026-09-01' };
    const next = recordDailyResult(stats, true, 2, '2026-10-05');
    expect(next.currentStreak).toBe(1);
    expect(next.maxStreak).toBe(5);
  });

  describe('across a device-timezone DST transition', () => {
    const originalTz = process.env['TZ'];

    afterEach(() => {
      process.env['TZ'] = originalTz;
    });

    // Turkey day is UTC+3 and fixed (no DST since 2016), so the player's "today"/"yesterday"
    // strings never move — but a device in a DST-observing timezone changes its UTC offset on
    // the transition day. A `yesterdayOf` built on local-time Date methods ('new Date(str)' +
    // 'getDate'/'setDate') double-shifts across that boundary and skips a day, breaking the
    // streak for players outside Turkey even though they played on consecutive Turkey days.
    it('should continue the streak when the device timezone crosses a DST transition between two consecutive Turkey days', () => {
      process.env['TZ'] = 'Australia/Sydney'; // DST ends 2026-04-05
      const stats = { ...createInitialDailyStats(), currentStreak: 3, maxStreak: 3, lastPlayedDate: '2026-04-04' };
      const next = recordDailyResult(stats, true, 3, '2026-04-05');
      expect(next.currentStreak).toBe(4);
    });
  });

  it('should record the winning guess count in the distribution', () => {
    const next = recordDailyResult(createInitialDailyStats(), true, 3, '2026-10-05');
    expect(next.guessDistribution).toEqual([0, 0, 1, 0, 0, 0]);
  });

  it('should not touch the distribution when the player loses', () => {
    const next = recordDailyResult(createInitialDailyStats(), false, 0, '2026-10-05');
    expect(next.guessDistribution).toEqual([0, 0, 0, 0, 0, 0]);
  });

  it('should increment gamesPlayed and gamesWon and store the played date', () => {
    const next = recordDailyResult(createInitialDailyStats(), true, 1, '2026-10-05');
    expect(next.gamesPlayed).toBe(1);
    expect(next.gamesWon).toBe(1);
    expect(next.lastPlayedDate).toBe('2026-10-05');
  });
});

describe('recordUnlimitedResult', () => {
  it('should record wins and the guess distribution without a streak', () => {
    const next = recordUnlimitedResult(createInitialUnlimitedStats(), true, 5);
    expect(next).toEqual({ gamesPlayed: 1, gamesWon: 1, guessDistribution: [0, 0, 0, 0, 1, 0] });
  });

  it('should count a loss without changing the distribution', () => {
    const next = recordUnlimitedResult(createInitialUnlimitedStats(), false, 0);
    expect(next).toEqual({ gamesPlayed: 1, gamesWon: 0, guessDistribution: [0, 0, 0, 0, 0, 0] });
  });
});

describe('storage keys', () => {
  it('should match the web key format', () => {
    expect(dailyStatsKey(5)).toBe('harfhane:stats:5');
    expect(unlimitedStatsKey(4)).toBe('harfhane:unlimited:stats:4');
  });
});

describe('daily stats storage', () => {
  it('should round-trip a saved value', async () => {
    const store = createMemoryStore();
    const stats = recordDailyResult(createInitialDailyStats(), true, 2, '2026-10-05');
    await saveDailyStats(store, 5, stats);
    expect(await loadDailyStats(store, 5)).toEqual(stats);
  });

  it('should save under the schemaVersion envelope', async () => {
    const store = createMemoryStore();
    const stats = recordDailyResult(createInitialDailyStats(), true, 2, '2026-10-05');
    await saveDailyStats(store, 5, stats);
    expect(JSON.parse(await store.getItem(dailyStatsKey(5)) as string)).toEqual({ schemaVersion: 1, data: stats });
  });

  it('should return a fresh value when nothing is stored', async () => {
    expect(await loadDailyStats(createMemoryStore(), 6)).toEqual(createInitialDailyStats());
  });

  it('should return a fresh value when the stored value does not match the shape', async () => {
    const store = createMemoryStore({ [dailyStatsKey(5)]: JSON.stringify({ gamesPlayed: 'oops' }) });
    expect(await loadDailyStats(store, 5)).toEqual(createInitialDailyStats());
  });

  it('should return a fresh value when the stored value is not JSON', async () => {
    const store = createMemoryStore({ [dailyStatsKey(5)]: '{' });
    expect(await loadDailyStats(store, 5)).toEqual(createInitialDailyStats());
  });

  it('should load legacy unversioned stats (written before schemaVersion existed) instead of resetting them', async () => {
    const legacyStats = recordDailyResult(createInitialDailyStats(), true, 3, '2026-10-05');
    const store = createMemoryStore({ [dailyStatsKey(5)]: JSON.stringify(legacyStats) });
    expect(await loadDailyStats(store, 5)).toEqual(legacyStats);
  });

  it('should keep the data when the stored schemaVersion is unrecognised but its shape still matches', async () => {
    const stats = recordDailyResult(createInitialDailyStats(), true, 4, '2026-10-05');
    const store = createMemoryStore({ [dailyStatsKey(5)]: JSON.stringify({ schemaVersion: 99, data: stats }) });
    expect(await loadDailyStats(store, 5)).toEqual(stats);
  });
});

describe('unlimited stats storage', () => {
  it('should round-trip a saved value', async () => {
    const store = createMemoryStore();
    const stats = recordUnlimitedResult(createInitialUnlimitedStats(), true, 4);
    await saveUnlimitedStats(store, 4, stats);
    expect(await loadUnlimitedStats(store, 4)).toEqual(stats);
  });

  it('should return a fresh value when the stored value does not match the shape', async () => {
    const store = createMemoryStore({ [unlimitedStatsKey(4)]: JSON.stringify({ foo: 'bar' }) });
    expect(await loadUnlimitedStats(store, 4)).toEqual(createInitialUnlimitedStats());
  });

  it('should load legacy unversioned stats (written before schemaVersion existed) instead of resetting them', async () => {
    const legacyStats = recordUnlimitedResult(createInitialUnlimitedStats(), true, 5);
    const store = createMemoryStore({ [unlimitedStatsKey(4)]: JSON.stringify(legacyStats) });
    expect(await loadUnlimitedStats(store, 4)).toEqual(legacyStats);
  });

  it('should keep the data when the stored schemaVersion is unrecognised but its shape still matches', async () => {
    const stats = recordUnlimitedResult(createInitialUnlimitedStats(), true, 6);
    const store = createMemoryStore({ [unlimitedStatsKey(4)]: JSON.stringify({ schemaVersion: 99, data: stats }) });
    expect(await loadUnlimitedStats(store, 4)).toEqual(stats);
  });
});
