import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import type { Env } from '../types/env';
import { registerSchema, loginSchema } from '../schemas/auth-schemas';
import { findUserByEmail, findUserByUsername, createUser, findUserById } from '../repositories/user-repository';
import { hashPassword, verifyPassword, signJwt, verifyJwt } from '../utils/auth';
import { CONFLICT, UNAUTHORIZED } from '../errors/api-error';

const JWT_EXPIRES_IN = 60 * 60 * 24 * 30; // 30 gün

type AuthEnv = { Bindings: Env; Variables: { userId: number } };

export const auth = new Hono<AuthEnv>();

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
