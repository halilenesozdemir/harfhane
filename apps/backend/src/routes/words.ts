import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import type { Env } from '../types/env';
import { dailyWordQuerySchema, randomWordQuerySchema, validateWordBodySchema } from '../schemas/word-schemas';
import { getDailyWord, getRandomWord, getWordById, validateWord } from '../services/word-service';

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

words.get('/challenge/:wordId', async (c) => {
  const wordId = Number(c.req.param('wordId'));
  if (!Number.isInteger(wordId) || wordId <= 0) {
    return c.json({ error: { code: 'BAD_REQUEST', message: 'Geçersiz kelime ID' } }, 400);
  }
  const result = await getWordById(c.env.DB, wordId);
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
