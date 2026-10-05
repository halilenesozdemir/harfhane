import { createMiddleware } from 'hono/factory';
import type { Env } from '../types/env';
import { timingSafeEqual } from '../utils/timing-safe';

export const adminAuth = createMiddleware<{ Bindings: Env }>(async (c, next) => {
  const secret = c.req.header('X-Admin-Secret');
  if (!secret || !c.env.ADMIN_SECRET || !timingSafeEqual(secret, c.env.ADMIN_SECRET)) {
    return c.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, 401);
  }
  await next();
  return;
});
