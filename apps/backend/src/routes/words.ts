import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import type { Env } from '../types/env';
import { dailyWordQuerySchema, randomWordQuerySchema, validateWordBodySchema } from '../schemas/word-schemas';
import {
  getDailyWord,
  getPlayableLengths,
  getRandomWord,
  validateWord,
} from '../services/word-service';

const words = new Hono<{ Bindings: Env }>();

words.get(
  '/daily',
  zValidator('query', dailyWordQuerySchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: { code: 'BAD_REQUEST', message: result.error.issues[0]?.message ?? 'Invalid query' } }, 400);
    }
    return;
  }),
  async (c) => {
    const { date, length } = c.req.valid('query');
    const result = await getDailyWord(c.env.DB, date, length);
    return c.json({ data: result });
  }
);

words.get(
  '/random',
  zValidator('query', randomWordQuerySchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: { code: 'BAD_REQUEST', message: result.error.issues[0]?.message ?? 'Invalid query' } }, 400);
    }
    return;
  }),
  async (c) => {
    const { length } = c.req.valid('query');
    const result = await getRandomWord(c.env.DB, length);
    return c.json({ data: result });
  }
);

words.get('/lengths', (c) => {
  const result = getPlayableLengths(c.env.PLAYABLE_WORD_LENGTHS);
  return c.json({ data: result });
});

// `/validate` is already rate-limited by the `/api/words/*` middleware in `index.ts`;
// a second `words.use` here used to double-count every hit against the same limiter
// key (`${ip}:${path}`), tripping GAME_MAX_HITS at half the intended request count.
words.post(
  '/validate',
  zValidator('json', validateWordBodySchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: { code: 'VALIDATION_ERROR', message: result.error.issues[0]?.message ?? 'Invalid body' } }, 422);
    }
    return;
  }),
  async (c) => {
    const { word } = c.req.valid('json');
    const result = await validateWord(c.env.DB, word);
    return c.json({ data: result });
  }
);

export { words };
