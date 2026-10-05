import type { Context } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { timingSafeEqual } from './timing-safe';

const OAUTH_STATE_COOKIE = 'oauth_state';
const OAUTH_STATE_COOKIE_PATH = '/api/auth/google';
const OAUTH_STATE_MAX_AGE_SECONDS = 10 * 60;
const OAUTH_STATE_BYTES = 32;

function randomHex(byteLength: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function issueOAuthState(c: Context): string {
  const state = randomHex(OAUTH_STATE_BYTES);
  setCookie(c, OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    path: OAUTH_STATE_COOKIE_PATH,
    maxAge: OAUTH_STATE_MAX_AGE_SECONDS,
  });
  return state;
}

export function consumeOAuthState(c: Context): boolean {
  const expected = getCookie(c, OAUTH_STATE_COOKIE);
  const received = c.req.query('state');
  deleteCookie(c, OAUTH_STATE_COOKIE, { path: OAUTH_STATE_COOKIE_PATH, secure: true });
  if (!expected || !received) return false;
  return timingSafeEqual(expected, received);
}
