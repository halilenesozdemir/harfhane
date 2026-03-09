import type { Context, Next } from 'hono';
import type { Env } from '../types/env';
import { verifyJwt } from '../utils/auth';
import { UNAUTHORIZED } from '../errors/api-error';

export async function requireAuth(
  c: Context<{ Bindings: Env; Variables: { userId: number } }>,
  next: Next
): Promise<Response | void> {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  if (!token) throw UNAUTHORIZED();

  const payload = await verifyJwt(token, c.env.JWT_SECRET);
  if (!payload) throw UNAUTHORIZED();

  c.set('userId', payload.sub);
  return next();
}
