import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { env, SELF, fetchMock } from 'cloudflare:test';
import { applySchema } from '../helpers/db';

const STATE_COOKIE = 'oauth_state';
const STATE = 'd'.repeat(64);
const ERROR_REDIRECT = 'https://harfhane.app?auth_error=true';
const SUCCESS_REDIRECT_PREFIX = 'https://harfhane.app?token=';

beforeAll(async () => {
  await applySchema(env.DB);
  fetchMock.activate();
  fetchMock.disableNetConnect();
  fetchMock
    .get('https://oauth2.googleapis.com')
    .intercept({ path: '/token', method: 'POST' })
    .reply(200, { access_token: 'access', id_token: 'id' })
    .persist();
  fetchMock
    .get('https://www.googleapis.com')
    .intercept({ path: '/oauth2/v2/userinfo', method: 'GET' })
    .reply(200, { id: 'google-123', email: 'google@test.com', name: 'Google User' })
    .persist();
});

afterAll(() => {
  fetchMock.deactivate();
});

function callback(query: string, cookie?: string): Promise<Response> {
  const headers: Record<string, string> = cookie ? { Cookie: cookie } : {};
  return SELF.fetch(`http://example.com/api/auth/google/callback?${query}`, {
    headers,
    redirect: 'manual',
  });
}

describe('GET /api/auth/google', () => {
  it('should set a state cookie and pass the same state to Google', async () => {
    const res = await SELF.fetch('http://example.com/api/auth/google', { redirect: 'manual' });
    expect(res.status).toBe(302);

    const location = new URL(res.headers.get('Location')!);
    const state = location.searchParams.get('state');
    expect(state).toMatch(/^[0-9a-f]{64}$/);

    const setCookie = res.headers.get('Set-Cookie')!;
    expect(setCookie).toContain(`${STATE_COOKIE}=${state}`);
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('Secure');
    expect(setCookie).toContain('SameSite=Lax');
  });
});

describe('GET /api/auth/google/callback', () => {
  it('should reject when the state cookie is missing', async () => {
    const res = await callback(`code=abc&state=${STATE}`);
    expect(res.headers.get('Location')).toBe(ERROR_REDIRECT);
  });

  it('should reject when the state query param is missing', async () => {
    const res = await callback('code=abc', `${STATE_COOKIE}=${STATE}`);
    expect(res.headers.get('Location')).toBe(ERROR_REDIRECT);
  });

  it('should reject when the state query param does not match the cookie', async () => {
    const res = await callback(`code=abc&state=${'e'.repeat(64)}`, `${STATE_COOKIE}=${STATE}`);
    expect(res.headers.get('Location')).toBe(ERROR_REDIRECT);
    expect(res.headers.get('Set-Cookie')).toContain(`${STATE_COOKIE}=;`);
  });

  it('should complete login and clear the state cookie when the state matches', async () => {
    const res = await callback(`code=abc&state=${STATE}`, `${STATE_COOKIE}=${STATE}`);
    expect(res.status).toBe(302);
    expect(res.headers.get('Location')!.startsWith(SUCCESS_REDIRECT_PREFIX)).toBe(true);
    expect(res.headers.get('Set-Cookie')).toContain(`${STATE_COOKIE}=;`);
    expect(res.headers.get('Set-Cookie')).toContain('Max-Age=0');
  });

  it('should issue a session token that authenticates the Google user on /me', async () => {
    const res = await callback(`code=abc&state=${STATE}`, `${STATE_COOKIE}=${STATE}`);
    const token = res.headers.get('Location')!.slice(SUCCESS_REDIRECT_PREFIX.length);

    const me = await SELF.fetch('http://example.com/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(me.status).toBe(200);
    const body = await me.json() as { data: { email: string; username: string } };
    expect(body.data).toMatchObject({ email: 'google@test.com', username: 'Google User' });

    const row = await env.DB
      .prepare('SELECT google_id FROM users WHERE email = ?')
      .bind('google@test.com')
      .first<{ google_id: string }>();
    expect(row?.google_id).toBe('google-123');
  });
});
