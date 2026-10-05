import { describe, it, expect, beforeAll } from 'vitest';
import { env, SELF } from 'cloudflare:test';
import { applySchema, seedTestData, createTestUser } from '../helpers/db';
import { hashPassword } from '../../src/utils/auth';
import { createTestToken } from '../helpers/auth';

let loginUserId: number;
let loginToken: string;

beforeAll(async () => {
  await applySchema(env.DB);
  await seedTestData(env.DB);

  await createTestUser(env.DB, 'existing', 'existing@test.com');

  const passwordHash = await hashPassword('logintest123');
  const loginRow = await env.DB
    .prepare('INSERT INTO users (email, username, password_hash) VALUES (?, ?, ?) RETURNING id')
    .bind('login@test.com', 'loginuser', passwordHash)
    .first<{ id: number }>();
  loginUserId = loginRow!.id;
  loginToken = await createTestToken(loginUserId, env.JWT_SECRET);
});

describe('POST /api/auth/register', () => {
  it('should return 201 with token for valid registration', async () => {
    const res = await SELF.fetch('http://example.com/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'fresh@test.com', username: 'freshuser', password: 'password123' }),
    });
    expect(res.status).toBe(201);
    const body = await res.json() as { data: { token: string; user: { username: string } } };
    expect(body.data.token).toBeDefined();
    expect(body.data.user.username).toBe('freshuser');
  });

  it('should return 409 when email already exists', async () => {
    const res = await SELF.fetch('http://example.com/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'existing@test.com', username: 'unique123', password: 'password123' }),
    });
    expect(res.status).toBe(409);
  });

  it('should return 409 when username already exists', async () => {
    const res = await SELF.fetch('http://example.com/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'unique@test.com', username: 'existing', password: 'password123' }),
    });
    expect(res.status).toBe(409);
  });
});

describe('POST /api/auth/login', () => {
  it('should return 200 with token for valid credentials', async () => {
    const res = await SELF.fetch('http://example.com/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'login@test.com', password: 'logintest123' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json() as { data: { token: string; user: { email: string } } };
    expect(body.data.token).toBeDefined();
    expect(body.data.user.email).toBe('login@test.com');
  });

  it('should return 401 for wrong password', async () => {
    const res = await SELF.fetch('http://example.com/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'login@test.com', password: 'wrongpassword' }),
    });
    expect(res.status).toBe(401);
  });

  it('should return 401 for non-existent email', async () => {
    const res = await SELF.fetch('http://example.com/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nobody@test.com', password: 'password123' }),
    });
    expect(res.status).toBe(401);
  });
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
    const passwordHash = await hashPassword('deletetest123');
    const created = await env.DB
      .prepare('INSERT INTO users (email, username, password_hash) VALUES (?, ?, ?) RETURNING id')
      .bind('delete@test.com', 'deleteuser', passwordHash)
      .first<{ id: number }>();
    const authToken = await createTestToken(created!.id, env.JWT_SECRET);

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
    const passwordHash = await hashPassword('deletetest456');
    const created = await env.DB
      .prepare('INSERT INTO users (email, username, password_hash) VALUES (?, ?, ?) RETURNING id')
      .bind('delete2@test.com', 'deleteuser2', passwordHash)
      .first<{ id: number }>();
    const userId = created!.id;
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

describe('POST /api/auth/forgot-password', () => {
  it('should create reset token in DB for valid email', async () => {
    await env.DB.prepare('DELETE FROM password_reset_tokens WHERE user_id = ?').bind(loginUserId).run();

    await SELF.fetch('http://example.com/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'login@test.com' }),
    });

    const token = await env.DB
      .prepare('SELECT id FROM password_reset_tokens WHERE user_id = ?')
      .bind(loginUserId)
      .first();
    expect(token).toBeTruthy();
  });

  it('should return 200 with sent:true for non-existent email', async () => {
    const res = await SELF.fetch('http://example.com/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nobody@test.com' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json() as { data: { sent: boolean } };
    expect(body.data.sent).toBe(true);
  });

  it('should return 400 for invalid email format', async () => {
    const res = await SELF.fetch('http://example.com/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email' }),
    });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/reset-password', () => {
  it('should return 400 for invalid token', async () => {
    const res = await SELF.fetch('http://example.com/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'invalidtoken', password: 'newpassword123' }),
    });
    expect(res.status).toBe(400);
    const body = await res.json() as { error: { code: string } };
    expect(body.error.code).toBe('INVALID_TOKEN');
  });

  it('should return 200 and update password for valid token', async () => {
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const validToken = 'a'.repeat(64);
    await env.DB
      .prepare('INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)')
      .bind(loginUserId, validToken, expiresAt)
      .run();

    const res = await SELF.fetch('http://example.com/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: validToken, password: 'newpassword123' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json() as { data: { success: boolean } };
    expect(body.data.success).toBe(true);

    const tokenCheck = await env.DB
      .prepare('SELECT id FROM password_reset_tokens WHERE token = ?')
      .bind(validToken)
      .first();
    expect(tokenCheck).toBeNull();
  });

  it('should return 400 for expired token', async () => {
    const expiredAt = new Date(Date.now() - 1000).toISOString();
    const expiredToken = 'b'.repeat(64);
    await env.DB
      .prepare('INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)')
      .bind(loginUserId, expiredToken, expiredAt)
      .run();

    const res = await SELF.fetch('http://example.com/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: expiredToken, password: 'newpassword123' }),
    });
    expect(res.status).toBe(400);
  });
});
