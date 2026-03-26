import { describe, it, expect, beforeAll } from 'vitest';
import { env, SELF } from 'cloudflare:test';
import { applySchema, seedTestData, createTestUser } from '../helpers/db';
import { createTestToken } from '../helpers/auth';

let token: string;
let wordId: number;

beforeAll(async () => {
  await applySchema(env.DB);
  await seedTestData(env.DB);
  const user = await createTestUser(env.DB, 'tourneyuser', 'tourney@test.com');
  token = await createTestToken(user.id, env.JWT_SECRET);
  const word = await env.DB
    .prepare('SELECT id FROM words WHERE word = ?')
    .bind('KİTAP')
    .first<{ id: number }>();
  wordId = word!.id;
});

describe('GET /api/tournament/word', () => {
  it('should return 401 without auth', async () => {
    const res = await SELF.fetch('http://example.com/api/tournament/word');
    expect(res.status).toBe(401);
  });

  it('should return 200 or 404 depending on random length selection', async () => {
    const res = await SELF.fetch('http://example.com/api/tournament/word', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([200, 404]).toContain(res.status);
    if (res.status === 200) {
      const body = await res.json() as { data: { word: { id: number; word: string }; stats: { total_score: number } } };
      expect(body.data.word.id).toBeGreaterThan(0);
      expect(body.data.stats).toBeDefined();
    }
  });
});

describe('POST /api/tournament/result', () => {
  it('should return 401 without auth', async () => {
    const res = await SELF.fetch('http://example.com/api/tournament/result', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word_id: wordId, word_length: 5, guesses: 3, won: true }),
    });
    expect(res.status).toBe(401);
  });

  it('should return 201 when saving a valid result', async () => {
    const res = await SELF.fetch('http://example.com/api/tournament/result', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ word_id: wordId, word_length: 5, guesses: 3, won: true }),
    });
    expect(res.status).toBe(201);
    const body = await res.json() as { data: { score: number; total_score: number } };
    expect(body.data.score).toBeGreaterThan(0);
    expect(body.data.total_score).toBeGreaterThan(0);
  });

  it('should return 422 for invalid body', async () => {
    const res = await SELF.fetch('http://example.com/api/tournament/result', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ word_id: -1, word_length: 99, guesses: 0, won: 'yes' }),
    });
    expect(res.status).toBe(422);
  });
});

describe('GET /api/tournament/leaderboard', () => {
  it('should return 200 with leaderboard data', async () => {
    const res = await SELF.fetch('http://example.com/api/tournament/leaderboard');
    expect(res.status).toBe(200);
    const body = await res.json() as { data: { leaderboard: unknown[] } };
    expect(Array.isArray(body.data.leaderboard)).toBe(true);
  });

  it('should accept period query parameter', async () => {
    const res = await SELF.fetch('http://example.com/api/tournament/leaderboard?period=week');
    expect(res.status).toBe(200);
  });
});
