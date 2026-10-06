import { Hono } from 'hono';
import type { Env } from '../types/env';

const health = new Hono<{ Bindings: Env }>();

health.get('/', (c) => {
  const version = c.env.GIT_SHA ?? 'unknown';
  return c.json({ data: { version } });
});

export { health };
