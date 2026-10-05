import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { env, SELF } from 'cloudflare:test';
import { applySchema, seedTestData, createTestUser } from '../helpers/db';
import { createTestToken } from '../helpers/auth';

type ProfileResponse = {
  data: {
    stats: { totalPlayed: number; totalWon: number };
    freezeTokens: number;
    playedToday: boolean;
  };
};

type FreezeResponse = {
  data?: { success: boolean };
  error?: { code: string; message: string };
};

let token: string;
let userId: number;
let freezeToken: string;
let freezeUserId: number;
let alreadyPlayedToken: string;
let alreadyPlayedUserId: number;

beforeAll(async () => {
  await applySchema(env.DB);
  await seedTestData(env.DB);

  const user = await createTestUser(env.DB, 'profileroute', 'profileroute@test.com');
  userId = user.id;
  token = await createTestToken(userId, env.JWT_SECRET);

  const freezeUser = await createTestUser(env.DB, 'freezeuser', 'freezeuser@test.com');
  freezeUserId = freezeUser.id;
  freezeToken = await createTestToken(freezeUserId, env.JWT_SECRET);
  await env.DB
    .prepare('UPDATE users SET freeze_tokens = 3 WHERE id = ?')
    .bind(freezeUserId)
    .run();

  const alreadyPlayedUser = await createTestUser(env.DB, 'alreadyplayed', 'alreadyplayed@test.com');
  alreadyPlayedUserId = alreadyPlayedUser.id;
  alreadyPlayedToken = await createTestToken(alreadyPlayedUserId, env.JWT_SECRET);
  const today = new Date().toISOString().split('T')[0]!;
  await env.DB
    .prepare(
      'INSERT INTO game_results (user_id, date, word_length, guesses, won, mode) VALUES (?, ?, 5, 3, 1, ?)'
    )
    .bind(alreadyPlayedUserId, today, 'daily')
    .run();
});

describe('GET /api/profile/me', () => {
  it('should return 401 without token', async () => {
    const response = await SELF.fetch('http://example.com/api/profile/me');

    expect(response.status).toBe(401);
  });

  it('should return profile with stats, freezeTokens, playedToday=false when no results', async () => {
    const response = await SELF.fetch('http://example.com/api/profile/me', {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.status).toBe(200);
    const body = await response.json() as ProfileResponse;
    expect(body.data.stats.totalPlayed).toBeGreaterThanOrEqual(0);
    expect(body.data.stats.totalWon).toBeGreaterThanOrEqual(0);
    expect(typeof body.data.freezeTokens).toBe('number');
    expect(body.data.playedToday).toBe(false);
  });
});

describe('POST /api/profile/freeze', () => {
  it('should return 401 without token', async () => {
    const response = await SELF.fetch('http://example.com/api/profile/freeze', {
      method: 'POST',
    });

    expect(response.status).toBe(401);
  });

  it('should return 400 when user has no freeze tokens', async () => {
    await env.DB
      .prepare('UPDATE users SET freeze_tokens = 0 WHERE id = ?')
      .bind(userId)
      .run();

    const response = await SELF.fetch('http://example.com/api/profile/freeze', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.status).toBe(400);
    const body = await response.json() as FreezeResponse;
    expect(body.error?.code).toBe('NO_TOKENS');
  });

  it('should return 200 and apply freeze when user has tokens', async () => {
    const response = await SELF.fetch('http://example.com/api/profile/freeze', {
      method: 'POST',
      headers: { Authorization: `Bearer ${freezeToken}` },
    });

    expect(response.status).toBe(200);
    const body = await response.json() as FreezeResponse;
    expect(body.data?.success).toBe(true);
  });

  it('should return 400 when already played today', async () => {
    const response = await SELF.fetch('http://example.com/api/profile/freeze', {
      method: 'POST',
      headers: { Authorization: `Bearer ${alreadyPlayedToken}` },
    });

    expect(response.status).toBe(400);
    const body = await response.json() as FreezeResponse;
    expect(body.error?.code).toBe('ALREADY_PLAYED');
  });
});

describe('Turkey day boundary', () => {
  let boundaryToken: string;
  let boundaryUserId: number;

  beforeAll(async () => {
    const user = await createTestUser(env.DB, 'boundaryuser', 'boundaryuser@test.com');
    boundaryUserId = user.id;
    boundaryToken = await createTestToken(boundaryUserId, env.JWT_SECRET);
    await env.DB
      .prepare('UPDATE users SET freeze_tokens = 3 WHERE id = ?')
      .bind(boundaryUserId)
      .run();
    await env.DB
      .prepare(
        'INSERT INTO game_results (user_id, date, word_length, guesses, won, mode) VALUES (?, ?, 5, 3, 1, ?)'
      )
      .bind(boundaryUserId, '2026-06-15', 'daily')
      .run();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('GET /me reports playedToday=false just before the Turkey midnight crossover', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-14T20:59:00Z'));

    const response = await SELF.fetch('http://example.com/api/profile/me', {
      headers: { Authorization: `Bearer ${boundaryToken}` },
    });

    const body = await response.json() as ProfileResponse;
    expect(body.data.playedToday).toBe(false);
  });

  it('GET /me reports playedToday=true right at the 21:00 UTC Turkey midnight crossover', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-14T21:00:00Z'));

    const response = await SELF.fetch('http://example.com/api/profile/me', {
      headers: { Authorization: `Bearer ${boundaryToken}` },
    });

    const body = await response.json() as ProfileResponse;
    expect(body.data.playedToday).toBe(true);
  });

  it('POST /freeze rejects as ALREADY_PLAYED right at the 21:00 UTC Turkey midnight crossover', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-14T21:00:00Z'));

    const response = await SELF.fetch('http://example.com/api/profile/freeze', {
      method: 'POST',
      headers: { Authorization: `Bearer ${boundaryToken}` },
    });

    expect(response.status).toBe(400);
    const body = await response.json() as FreezeResponse;
    expect(body.error?.code).toBe('ALREADY_PLAYED');
  });
});
