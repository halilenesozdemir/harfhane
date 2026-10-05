import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { env } from 'cloudflare:test';
import { applySchema, seedTestData, createTestUser } from '../helpers/db';
import { saveResult, getUserStats, getLeaderboard } from '../../src/repositories/result-repository';

let userId: number;
let statsUserId: number;

beforeAll(async () => {
  await applySchema(env.DB);
  await seedTestData(env.DB);
  const user = await createTestUser(env.DB, 'resultuser', 'result@test.com');
  userId = user.id;
  const statsUser = await createTestUser(env.DB, 'statsuser', 'stats@test.com');
  statsUserId = statsUser.id;
});

describe('saveResult', () => {
  it('should save a game result without error', async () => {
    await expect(
      saveResult(env.DB, userId, '2026-03-01', 5, 3, true)
    ).resolves.toBeUndefined();
  });

  it('should not duplicate on conflict', async () => {
    await saveResult(env.DB, userId, '2026-03-01', 5, 4, false);
    const stats = await getUserStats(env.DB, userId);
    expect(stats.totalPlayed).toBe(1);
  });
});

describe('getUserStats', () => {
  it('should return correct stats after saving results', async () => {
    await saveResult(env.DB, statsUserId, '2026-03-01', 5, 3, true);
    await saveResult(env.DB, statsUserId, '2026-03-02', 5, 2, true);
    await saveResult(env.DB, statsUserId, '2026-03-03', 5, 4, false);

    const stats = await getUserStats(env.DB, statsUserId);
    expect(stats.totalPlayed).toBe(3);
    expect(stats.totalWon).toBe(2);
    expect(stats.winRate).toBeGreaterThan(0);
    expect(stats.guessDistribution).toHaveLength(6);
  });

  it('should return zero stats for unknown user', async () => {
    const stats = await getUserStats(env.DB, 99999);
    expect(stats.totalPlayed).toBe(0);
    expect(stats.totalWon).toBe(0);
    expect(stats.currentStreak).toBe(0);
  });
});

describe('getLeaderboard week window Turkey day boundary', () => {
  let boundaryUserId: number;

  beforeAll(async () => {
    const user = await createTestUser(env.DB, 'leaderboarduser', 'leaderboard@test.com');
    boundaryUserId = user.id;
    await saveResult(env.DB, boundaryUserId, '2026-06-07', 5, 3, true);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should exclude a result from exactly 8 Turkey days ago at 22:00 UTC', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-14T22:00:00Z'));

    const leaderboard = await getLeaderboard(env.DB, 'week');

    expect(leaderboard.some((row) => row.user_id === boundaryUserId)).toBe(false);
  });

  it('should include a result from exactly 7 Turkey days ago at 22:00 UTC', async () => {
    await saveResult(env.DB, boundaryUserId, '2026-06-08', 5, 3, true);
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-14T22:00:00Z'));

    const leaderboard = await getLeaderboard(env.DB, 'week');

    expect(leaderboard.some((row) => row.user_id === boundaryUserId)).toBe(true);
  });
});
