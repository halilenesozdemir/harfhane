import { Hono } from 'hono';
import type { Env } from '../types/env';
import { getList, getPublicLists, getRandomWordFromList } from '../services/list-service';

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

export { lists };
