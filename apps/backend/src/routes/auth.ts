import { Hono } from 'hono';
import type { Env } from '../types/env';
import { findUserById, upsertGoogleUser, deleteUser } from '../repositories/user-repository';
import { signJwt, verifyJwt } from '../utils/auth';
import { UNAUTHORIZED } from '../errors/api-error';
import { requireAuth } from '../middleware/auth-middleware';
import { issueOAuthState, consumeOAuthState } from '../utils/oauth-state';

const JWT_EXPIRES_IN = 60 * 60 * 24 * 30;
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';
const GOOGLE_REDIRECT_URI = 'https://api.harfhane.app/api/auth/google/callback';

type AuthEnv = { Bindings: Env; Variables: { userId: number } };

interface GoogleTokenResponse {
  access_token: string;
  id_token: string;
}

interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
}

async function exchangeGoogleCode(code: string, env: Env): Promise<GoogleTokenResponse | null> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: GOOGLE_REDIRECT_URI,
    client_id: env.GOOGLE_CLIENT_ID,
    client_secret: env.GOOGLE_CLIENT_SECRET,
  });

  try {
    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    if (!response.ok) return null;
    return response.json() as Promise<GoogleTokenResponse>;
  } catch {
    return null;
  }
}

async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo | null> {
  try {
    const response = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) return null;
    return response.json() as Promise<GoogleUserInfo>;
  } catch {
    return null;
  }
}

export const auth = new Hono<AuthEnv>();

auth.get('/google', (c) => {
  const params = new URLSearchParams({
    client_id: c.env.GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    state: issueOAuthState(c),
  });
  return c.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
});

auth.get('/google/callback', async (c) => {
  const code = c.req.query('code');
  const errorRedirect = `${c.env.APP_URL}?auth_error=true`;

  if (!consumeOAuthState(c) || !code) return c.redirect(errorRedirect);

  const tokenData = await exchangeGoogleCode(code, c.env);
  if (!tokenData) return c.redirect(errorRedirect);

  const userInfo = await fetchGoogleUserInfo(tokenData.access_token);
  if (!userInfo) return c.redirect(errorRedirect);

  try {
    const user = await upsertGoogleUser(c.env.DB, userInfo.id, userInfo.email, userInfo.name);
    const token = await signJwt(
      { sub: user.id, exp: Math.floor(Date.now() / 1000) + JWT_EXPIRES_IN },
      c.env.JWT_SECRET
    );
    return c.redirect(`${c.env.APP_URL}?token=${token}`);
  } catch {
    return c.redirect(errorRedirect);
  }
});

auth.get('/me', async (c) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  if (!token) throw UNAUTHORIZED();

  const payload = await verifyJwt(token, c.env.JWT_SECRET);
  if (!payload) throw UNAUTHORIZED();

  const user = await findUserById(c.env.DB, payload.sub);
  if (!user) throw UNAUTHORIZED();

  return c.json({
    data: { id: user.id, email: user.email, username: user.username },
  });
});

auth.post('/refresh', requireAuth, async (c) => {
  const userId = c.get('userId');
  const user = await findUserById(c.env.DB, userId);
  if (!user) throw UNAUTHORIZED();

  const token = await signJwt(
    { sub: user.id, exp: Math.floor(Date.now() / 1000) + JWT_EXPIRES_IN },
    c.env.JWT_SECRET
  );

  return c.json({
    data: { token, user: { id: user.id, email: user.email, username: user.username } },
  });
});

auth.delete('/account', requireAuth, async (c) => {
  const userId = c.get('userId');
  await deleteUser(c.env.DB, userId);
  return c.json({ data: { success: true } });
});
