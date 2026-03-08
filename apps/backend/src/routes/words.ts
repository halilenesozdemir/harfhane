import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import type { Env } from '../types/env';
import { dailyWordQuerySchema, validateWordBodySchema } from '../schemas/word-schemas';
import { getDailyWord, getRandomWord, validateWord } from '../services/word-service';

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
    const { date } = c.req.valid('query');
    const result = await getDailyWord(c.env.DB, date);
    return c.json({ data: result });
  }
);

words.get('/random', async (c) => {
  const result = await getRandomWord(c.env.DB);
  return c.json({ data: result });
});

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
