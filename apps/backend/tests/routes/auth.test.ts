import { describe, it, expect, beforeAll } from 'vitest';
import { env, SELF } from 'cloudflare:test';
import { applySchema, seedTestData, createTestUser } from '../helpers/db';
import { createTestToken } from '../helpers/auth';

let loginUserId: number;
let loginToken: string;

beforeAll(async () => {
  await applySchema(env.DB);
  await seedTestData(env.DB);

  await createTestUser(env.DB, 'existing', 'existing@test.com');

  const loginUser = await createTestUser(env.DB, 'loginuser', 'login@test.com');
  loginUserId = loginUser.id;
  loginToken = await createTestToken(loginUserId, env.JWT_SECRET);
});

describe('removed email/password endpoints', () => {
  const REMOVED_PATHS = ['/register', '/login', '/forgot-password', '/reset-password'];

  for (const path of REMOVED_PATHS) {
    it(`should return 404 for POST /api/auth${path}`, async () => {
      const res = await SELF.fetch(`http://example.com/api/auth${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'login@test.com', password: 'password123' }),
      });
      expect(res.status).toBe(404);
    });
  }
});

describe('GET /api/auth/me', () => {
  it('should return 401 without token', async () => {
    const res = await SELF.fetch('http://example.com/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('should return 200 with user data when authenticated', async () => {
    const res = await SELF.fetch('http://example.com/api/auth/me', {
      headers: { Authorization: `Bearer ${loginToken}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json() as { data: { email: string; username: string } };
    expect(body.data.email).toBe('login@test.com');
  });
});

describe('POST /api/auth/refresh', () => {
  it('should return 401 without token', async () => {
    const res = await SELF.fetch('http://example.com/api/auth/refresh', { method: 'POST' });
    expect(res.status).toBe(401);
  });

  it('should return 200 with new token when authenticated', async () => {
    const res = await SELF.fetch('http://example.com/api/auth/refresh', {
      method: 'POST',
      headers: { Authorization: `Bearer ${loginToken}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json() as { data: { token: string } };
    expect(body.data.token).toBeDefined();
  });
});

describe('DELETE /api/auth/account', () => {
  it('should return 401 without token', async () => {
    const res = await SELF.fetch('http://example.com/api/auth/account', { method: 'DELETE' });
    expect(res.status).toBe(401);
  });

  it('should return 200 and delete the account when authenticated', async () => {
    const created = await createTestUser(env.DB, 'deleteuser', 'delete@test.com');
    const authToken = await createTestToken(created.id, env.JWT_SECRET);

    const res = await SELF.fetch('http://example.com/api/auth/account', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.status).toBe(200);

    const check = await env.DB
      .prepare('SELECT id FROM users WHERE email = ?')
      .bind('delete@test.com')
      .first();
    expect(check).toBeNull();
  });

  it('should delete the account own list and push subscription', async () => {
    const created = await createTestUser(env.DB, 'deleteuser2', 'delete2@test.com');
    const userId = created.id;
    const authToken = await createTestToken(userId, env.JWT_SECRET);

    const list = await env.DB
      .prepare(
        `INSERT INTO word_lists (slug, name, description, word_length, is_public, owner_user_id)
         VALUES ('delete-route-list', 'Silinecek Liste', NULL, 5, 1, ?) RETURNING id`
      )
      .bind(userId)
      .first<{ id: number }>();
    await env.DB
      .prepare('INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth) VALUES (?, ?, ?, ?)')
      .bind(userId, 'https://push.example/route-test', 'p', 'a')
      .run();

    const res = await SELF.fetch('http://example.com/api/auth/account', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.status).toBe(200);

    const remainingList = await env.DB.prepare('SELECT id FROM word_lists WHERE id = ?').bind(list!.id).first();
    expect(remainingList).toBeNull();

    const remainingSubscription = await env.DB
      .prepare('SELECT id FROM push_subscriptions WHERE user_id = ?')
      .bind(userId)
      .first();
    expect(remainingSubscription).toBeNull();
  });
});
