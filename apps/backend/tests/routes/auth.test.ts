import { describe, it, expect, beforeAll } from 'vitest';
import { env, SELF } from 'cloudflare:test';
import { applySchema, seedTestData, createTestUser } from '../helpers/db';
import { hashPassword } from '../../src/utils/auth';
import { createTestToken } from '../helpers/auth';

let existingUserId: number;
let loginUserId: number;
let loginToken: string;

beforeAll(async () => {
  await applySchema(env.DB);
  await seedTestData(env.DB);

  const existing = await createTestUser(env.DB, 'existing', 'existing@test.com');
  existingUserId = existing.id;

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
});
