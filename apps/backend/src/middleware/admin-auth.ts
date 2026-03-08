import { createMiddleware } from 'hono/factory';
import type { Env } from '../types/env';

export const adminAuth = createMiddleware<{ Bindings: Env }>(async (c, next) => {
  const secret = c.req.header('X-Admin-Secret');
  if (!secret || secret !== c.env.ADMIN_SECRET) {
    return c.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, 401);
  }
  await next();
  return;
});
