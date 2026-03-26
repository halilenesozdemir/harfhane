import { describe, it, expect, beforeAll } from 'vitest';
import { env, SELF } from 'cloudflare:test';
import { applySchema, seedTestData, createTestUser } from '../helpers/db';
import { createTestToken } from '../helpers/auth';

let token: string;

beforeAll(async () => {
  await applySchema(env.DB);
  await seedTestData(env.DB);
  const user = await createTestUser(env.DB, 'xproute', 'xproute@test.com');
  token = await createTestToken(user.id, env.JWT_SECRET);
});

describe('GET /api/xp/me', () => {
  it('should return 401 without auth', async () => {
    const res = await SELF.fetch('http://example.com/api/xp/me');
    expect(res.status).toBe(401);
  });

  it('should return XP profile when authenticated', async () => {
    const res = await SELF.fetch('http://example.com/api/xp/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json() as { data: { totalXP: number; level: number; badges: unknown[] } };
    expect(typeof body.data.totalXP).toBe('number');
    expect(body.data.level).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(body.data.badges)).toBe(true);
  });

  it('should return nextLevelXP in response', async () => {
    const res = await SELF.fetch('http://example.com/api/xp/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json() as { data: { nextLevelXP: number } };
    expect(typeof body.data.nextLevelXP).toBe('number');
  });
});
