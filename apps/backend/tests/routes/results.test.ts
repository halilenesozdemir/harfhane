import { describe, it, expect, beforeAll } from 'vitest';
import { env, SELF } from 'cloudflare:test';
import { applySchema, seedTestData, createTestUser } from '../helpers/db';
import { createTestToken } from '../helpers/auth';

let token: string;

beforeAll(async () => {
  await applySchema(env.DB);
  await seedTestData(env.DB);
  const user = await createTestUser(env.DB, 'resultsroute', 'resultsroute@test.com');
  token = await createTestToken(user.id, env.JWT_SECRET);
});

describe('POST /api/results', () => {
  it('should return 401 without auth', async () => {
    const res = await SELF.fetch('http://example.com/api/results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: '2026-03-01', word_length: 5, guesses: 3, won: true }),
    });
    expect(res.status).toBe(401);
  });

  it('should return 201 when saving a valid result', async () => {
    const res = await SELF.fetch('http://example.com/api/results', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ date: '2026-03-01', word_length: 5, guesses: 3, won: true }),
    });
    expect(res.status).toBe(201);
    const body = await res.json() as { data: { success: boolean } };
    expect(body.data.success).toBe(true);
  });

  it('should return 400 for invalid body', async () => {
    const res = await SELF.fetch('http://example.com/api/results', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ date: 'bad', word_length: 99 }),
    });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/results/me', () => {
  it('should return 401 without auth', async () => {
    const res = await SELF.fetch('http://example.com/api/results/me');
    expect(res.status).toBe(401);
  });

  it('should return 200 with user stats when authenticated', async () => {
    const res = await SELF.fetch('http://example.com/api/results/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json() as { data: { totalPlayed: number; totalWon: number } };
    expect(body.data.totalPlayed).toBeGreaterThanOrEqual(0);
  });
});

describe('GET /api/results/leaderboard', () => {
  it('should return 200 with leaderboard', async () => {
    const res = await SELF.fetch('http://example.com/api/results/leaderboard');
    expect(res.status).toBe(200);
    const body = await res.json() as { data: { leaderboard: unknown[] } };
    expect(Array.isArray(body.data.leaderboard)).toBe(true);
  });

  it('should accept period query parameter', async () => {
    const res = await SELF.fetch('http://example.com/api/results/leaderboard?period=month');
    expect(res.status).toBe(200);
  });
});
