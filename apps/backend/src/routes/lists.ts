import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import type { Env } from '../types/env';
import { dailyWordQuerySchema, validateWordBodySchema } from '../schemas/word-schemas';
import { getList, getPublicLists, getRandomWordFromList, getDailyWordFromList, validateWordInList } from '../services/list-service';

const lists = new Hono<{ Bindings: Env }>();

lists.get('/', async (c) => {
  const result = await getPublicLists(c.env.DB);
  return c.json({ data: result });
});

lists.get('/:slug', async (c) => {
  const slug = c.req.param('slug');
  const result = await getList(c.env.DB, slug);
  return c.json({ data: result });
});

lists.get('/:slug/random', async (c) => {
  const slug = c.req.param('slug');
  const result = await getRandomWordFromList(c.env.DB, slug);
  return c.json({ data: result });
});

lists.get(
  '/:slug/daily',
  zValidator('query', dailyWordQuerySchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: { code: 'BAD_REQUEST', message: result.error.issues[0]?.message ?? 'Invalid query' } }, 400);
    }
    return;
  }),
  async (c) => {
    const slug = c.req.param('slug');
    const { date } = c.req.valid('query');
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' });
    const resolvedDate = date ?? today;
    const result = await getDailyWordFromList(c.env.DB, slug, resolvedDate);
    return c.json({ data: result });
  }
);

lists.post(
  '/:slug/validate',
  zValidator('json', validateWordBodySchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: { code: 'VALIDATION_ERROR', message: result.error.issues[0]?.message ?? 'Invalid body' } }, 422);
    }
    return;
  }),
  async (c) => {
    const slug = c.req.param('slug');
    const { word } = c.req.valid('json');
    const result = await validateWordInList(c.env.DB, slug, word);
    return c.json({ data: result });
  }
);

export { lists };
