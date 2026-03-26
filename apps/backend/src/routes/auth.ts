import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import type { Env } from '../types/env';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../schemas/auth-schemas';
import {
  findUserByEmail,
  findUserByUsername,
  createUser,
  findUserById,
  upsertGoogleUser,
  createPasswordResetToken,
  findValidPasswordResetToken,
  consumePasswordResetToken,
  deleteUser,
} from '../repositories/user-repository';
import { hashPassword, verifyPassword, signJwt, verifyJwt } from '../utils/auth';
import { CONFLICT, UNAUTHORIZED } from '../errors/api-error';
import { sendPasswordResetEmail } from '../utils/email';
import { rateLimiter } from '../middleware/rate-limiter';
import { requireAuth } from '../middleware/auth-middleware';

const RESET_TOKEN_EXPIRES_MS = 60 * 60 * 1000;

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

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

auth.use('/register', rateLimiter);
auth.use('/login', rateLimiter);
auth.use('/forgot-password', rateLimiter);

auth.post('/register', zValidator('json', registerSchema), async (c) => {
  const { email, username, password } = c.req.valid('json');

  const [existingEmail, existingUsername] = await Promise.all([
    findUserByEmail(c.env.DB, email),
    findUserByUsername(c.env.DB, username),
  ]);

  if (existingEmail) throw CONFLICT('Bu e-posta adresi zaten kayıtlı');
  if (existingUsername) throw CONFLICT('Bu kullanıcı adı zaten alınmış');

  const passwordHash = await hashPassword(password);
  const user = await createUser(c.env.DB, email, username, passwordHash);

  const token = await signJwt(
    { sub: user.id, exp: Math.floor(Date.now() / 1000) + JWT_EXPIRES_IN },
    c.env.JWT_SECRET
  );

  return c.json({
    data: {
      token,
      user: { id: user.id, email: user.email, username: user.username },
    },
  }, 201);
});

auth.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json');

  const user = await findUserByEmail(c.env.DB, email);
  if (!user) throw UNAUTHORIZED();

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) throw UNAUTHORIZED();

  const token = await signJwt(
    { sub: user.id, exp: Math.floor(Date.now() / 1000) + JWT_EXPIRES_IN },
    c.env.JWT_SECRET
  );

  return c.json({
    data: {
      token,
      user: { id: user.id, email: user.email, username: user.username },
    },
  });
});

auth.get('/google', (c) => {
  const params = new URLSearchParams({
    client_id: c.env.GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
  });
  return c.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
});

auth.get('/google/callback', async (c) => {
  const code = c.req.query('code');
  const errorRedirect = `${c.env.APP_URL}?auth_error=true`;

  if (!code) return c.redirect(errorRedirect);

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

auth.post('/forgot-password', zValidator('json', forgotPasswordSchema), async (c) => {
  const { email } = c.req.valid('json');

  const user = await findUserByEmail(c.env.DB, email);
  if (!user || user.password_hash === 'GOOGLE_AUTH') {
    return c.json({ data: { sent: true } });
  }

  const token = generateToken();
  const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRES_MS).toISOString();
  await createPasswordResetToken(c.env.DB, user.id, token, expiresAt);

  const resetUrl = `${c.env.APP_URL}/sifre-sifirla?token=${token}`;
  await sendPasswordResetEmail(c.env.RESEND_API_KEY, email, resetUrl);

  return c.json({ data: { sent: true } });
});

auth.post('/reset-password', zValidator('json', resetPasswordSchema), async (c) => {
  const { token, password } = c.req.valid('json');
  const now = new Date().toISOString();

  const resetToken = await findValidPasswordResetToken(c.env.DB, token, now);
  if (!resetToken) {
    return c.json({ error: { code: 'INVALID_TOKEN', message: 'Geçersiz veya süresi dolmuş bağlantı' } }, 400);
  }

  const passwordHash = await hashPassword(password);
  await consumePasswordResetToken(c.env.DB, resetToken.id, resetToken.user_id, passwordHash);

  return c.json({ data: { success: true } });
});

auth.delete('/account', requireAuth, async (c) => {
  const userId = c.get('userId');
  await deleteUser(c.env.DB, userId);
  return c.json({ data: { success: true } });
});
