import type { MiddlewareHandler } from 'hono';
import type { Env } from '../types/env';

interface HitRecord {
  count: number;
  resetAt: number;
}

const WINDOW_MS = 10 * 60 * 1000;
const MAX_HITS = 10;

const hits = new Map<string, HitRecord>();

function getClientKey(request: Request): string {
  return request.headers.get('CF-Connecting-IP')
    ?? request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim()
    ?? 'unknown';
}

export const rateLimiter: MiddlewareHandler<{ Bindings: Env }> = async (c, next) => {
  const key = `${getClientKey(c.req.raw)}:${c.req.path}`;
  const now = Date.now();
  const record = hits.get(key);

  if (!record || now > record.resetAt) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return next();
  }

  record.count += 1;
  if (record.count > MAX_HITS) {
    return c.json({ error: { code: 'RATE_LIMITED', message: 'Çok fazla istek. Lütfen bekleyin.' } }, 429);
  }

  return next();
};
