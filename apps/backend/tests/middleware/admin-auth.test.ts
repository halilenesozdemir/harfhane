import { describe, it, expect } from 'vitest';
import { env } from 'cloudflare:test';
import { Hono } from 'hono';
import type { Env } from '../../src/types/env';
import { adminAuth } from '../../src/middleware/admin-auth';

const ADMIN_SECRET = 'local-test-admin-secret';

async function requestWith(headerSecret: string, adminSecret: string | undefined): Promise<Response> {
  const app = new Hono<{ Bindings: Env }>();
  app.get('/protected', adminAuth, (c) => c.json({ data: { ok: true } }));
  const bindings = { ...env, ADMIN_SECRET: adminSecret } as Env;
  return app.request('/protected', { headers: { 'X-Admin-Secret': headerSecret } }, bindings);
}

describe('adminAuth', () => {
  it('should allow the request when the secret matches', async () => {
    const res = await requestWith(ADMIN_SECRET, ADMIN_SECRET);
    expect(res.status).toBe(200);
  });

  it('should reject the request when the secret differs only in its last character', async () => {
    const res = await requestWith(`${ADMIN_SECRET.slice(0, -1)}X`, ADMIN_SECRET);
    expect(res.status).toBe(401);
  });

  it('should reject any header value when ADMIN_SECRET is not configured', async () => {
    const res = await requestWith('anything', undefined);
    expect(res.status).toBe(401);
  });

  it('should reject any header value when ADMIN_SECRET is empty', async () => {
    const res = await requestWith('anything', '');
    expect(res.status).toBe(401);
  });
});
