import { describe, it, expect, beforeAll } from 'vitest';
import { env } from 'cloudflare:test';
import { applySchema, seedTestData, createTestUser } from '../helpers/db';
import {
  getTournamentWord,
  saveTournamentResult,
  getTournamentLeaderboard,
  getUserTournamentStats,
} from '../../src/repositories/tournament-repository';

let userId: number;
let wordId: number;

beforeAll(async () => {
  await applySchema(env.DB);
  await seedTestData(env.DB);
  const user = await createTestUser(env.DB);
  userId = user.id;
  const word = await env.DB
    .prepare('SELECT id FROM words WHERE word = ?')
    .bind('KİTAP')
    .first<{ id: number }>();
  wordId = word!.id;

  await saveTournamentResult(env.DB, userId, wordId, 5, 3, true, 450);
});

describe('getTournamentWord', () => {
  it('should return null or a word with valid fields', async () => {
    const word = await getTournamentWord(env.DB);
    if (word) {
      expect(word.id).toBeGreaterThan(0);
      expect(word.word).toBeDefined();
      expect(word.meaning).toBeDefined();
      expect([4, 5, 6]).toContain(word.length);
      expect(word.word.length).toBe(word.length);
    }
  });
});

describe('saveTournamentResult', () => {
  it('should save a tournament result without error', async () => {
    const user2 = await createTestUser(env.DB, 'tourney2', 'tourney2@test.com');
    await expect(
      saveTournamentResult(env.DB, user2.id, wordId, 5, 2, true, 550)
    ).resolves.toBeUndefined();
  });
});

describe('getUserTournamentStats', () => {
  it('should return stats for a user with results', async () => {
    const stats = await getUserTournamentStats(env.DB, userId);
    expect(stats.total_score).toBe(450);
    expect(stats.games_played).toBe(1);
    expect(stats.games_won).toBe(1);
    expect(stats.best_score).toBe(450);
  });

  it('should return zero stats for unknown user', async () => {
    const stats = await getUserTournamentStats(env.DB, 99999);
    expect(stats.total_score).toBe(0);
    expect(stats.games_played).toBe(0);
  });
});

describe('getTournamentLeaderboard', () => {
  it('should return leaderboard with entries', async () => {
    const rows = await getTournamentLeaderboard(env.DB, 'all');
    expect(rows.length).toBeGreaterThanOrEqual(1);
  });

  it('should respect period filter for week', async () => {
    const rows = await getTournamentLeaderboard(env.DB, 'week');
    expect(Array.isArray(rows)).toBe(true);
  });
});
