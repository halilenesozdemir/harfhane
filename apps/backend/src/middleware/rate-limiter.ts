import type { MiddlewareHandler } from 'hono';
import type { Env } from '../types/env';

interface HitRecord {
  count: number;
  resetAt: number;
}

const AUTH_WINDOW_MS = 60 * 1000;
const AUTH_MAX_HITS = 10;
const GAME_WINDOW_MS = 60 * 1000;
const GAME_MAX_HITS = 30;

const hits = new Map<string, HitRecord>();

function getClientIp(request: Request): string {
  return request.headers.get('CF-Connecting-IP')
    ?? request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim()
    ?? 'unknown';
}

function checkLimit(
  key: string,
  maxHits: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const record = hits.get(key);

  if (!record || now > record.resetAt) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  record.count += 1;
  return record.count <= maxHits;
}

export function createRateLimiter(
  maxHits: number,
  windowMs: number
): MiddlewareHandler<{ Bindings: Env }> {
  return async (c, next) => {
    const key = `${getClientIp(c.req.raw)}:${c.req.path}`;
    if (!checkLimit(key, maxHits, windowMs)) {
      return c.json(
        { error: { code: 'RATE_LIMITED', message: 'Çok fazla istek.' } },
        429
      );
    }
    return next();
  };
}

export const rateLimiter = createRateLimiter(AUTH_MAX_HITS, AUTH_WINDOW_MS);
export const gameRateLimiter = createRateLimiter(GAME_MAX_HITS, GAME_WINDOW_MS);
