import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import type { Env } from '../types/env';
import { requireAuth } from '../middleware/auth-middleware';
import { dailyWordQuerySchema, validateWordBodySchema } from '../schemas/word-schemas';
import { createUserListSchema, updateUserListSchema, addWordsToListSchema, addCommentSchema } from '../schemas/list-schemas';
import { getList, getPublicLists, getRandomWordFromList, getDailyWordFromList, validateWordInList } from '../services/list-service';
import { createUserList, getUserLists, updateUserList, deleteUserList, addWordsToUserList } from '../services/user-list-service';
import { toggleListLike, getListLikes, getListComments, addListComment, deleteListComment } from '../services/social-service';
import { verifyJwt } from '../utils/auth';

type ListsEnv = { Bindings: Env; Variables: { userId: number } };

const lists = new Hono<ListsEnv>();

// --- Public list browsing ---

lists.get('/', async (c) => {
  const result = await getPublicLists(c.env.DB);
  return c.json({ data: result });
});

// --- Authenticated: user's own lists (must be before /:slug) ---

lists.get('/mine', requireAuth, async (c) => {
  const userId = c.get('userId');
  const result = await getUserLists(c.env.DB, userId);
  return c.json({ data: result });
});

lists.post(
  '/',
  requireAuth,
  zValidator('json', createUserListSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: { code: 'VALIDATION_ERROR', message: result.error.issues[0]?.message ?? 'Invalid body' } }, 422);
    }
    return;
  }),
  async (c) => {
    const userId = c.get('userId');
    const body = c.req.valid('json');
    const result = await createUserList(c.env.DB, userId, body);
    return c.json({ data: result }, 201);
  }
);

// --- Slug-based routes ---

lists.get('/:slug', async (c) => {
  const slug = c.req.param('slug')!;
  const result = await getList(c.env.DB, slug);
  return c.json({ data: result });
});

lists.patch(
  '/:slug',
  requireAuth,
  zValidator('json', updateUserListSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: { code: 'VALIDATION_ERROR', message: result.error.issues[0]?.message ?? 'Invalid body' } }, 422);
    }
    return;
  }),
  async (c) => {
    const userId = c.get('userId');
    const slug = c.req.param('slug')!;
    const body = c.req.valid('json');
    const result = await updateUserList(c.env.DB, userId, slug, body);
    return c.json({ data: result });
  }
);

lists.delete('/:slug', requireAuth, async (c) => {
  const userId = c.get('userId');
  const slug = c.req.param('slug')!;
  await deleteUserList(c.env.DB, userId, slug);
  return c.json({ data: { success: true } });
});

lists.get('/:slug/random', async (c) => {
  const slug = c.req.param('slug')!;
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
    const slug = c.req.param('slug')!;
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
    const slug = c.req.param('slug')!;
    const { word } = c.req.valid('json');
    const result = await validateWordInList(c.env.DB, slug, word);
    return c.json({ data: result });
  }
);

lists.post(
  '/:slug/words',
  requireAuth,
  zValidator('json', addWordsToListSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: { code: 'VALIDATION_ERROR', message: result.error.issues[0]?.message ?? 'Invalid body' } }, 422);
    }
    return;
  }),
  async (c) => {
    const userId = c.get('userId');
    const slug = c.req.param('slug')!;
    const { words } = c.req.valid('json');
    const result = await addWordsToUserList(c.env.DB, userId, slug, words);
    return c.json({ data: result });
  }
);

// --- Social: likes ---

lists.get('/:slug/likes', async (c) => {
  const slug = c.req.param('slug')!;
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  let userId: number | undefined;
  if (token) {
    const payload = await verifyJwt(token, c.env.JWT_SECRET);
    if (payload) userId = payload.sub;
  }
  const result = await getListLikes(c.env.DB, slug, userId);
  return c.json({ data: result });
});

lists.post('/:slug/like', requireAuth, async (c) => {
  const userId = c.get('userId');
  const slug = c.req.param('slug')!;
  const result = await toggleListLike(c.env.DB, userId, slug);
  return c.json({ data: result });
});

// --- Social: comments ---

lists.get('/:slug/comments', async (c) => {
  const slug = c.req.param('slug')!;
  const result = await getListComments(c.env.DB, slug);
  return c.json({ data: result });
});

lists.post(
  '/:slug/comments',
  requireAuth,
  zValidator('json', addCommentSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: { code: 'VALIDATION_ERROR', message: result.error.issues[0]?.message ?? 'Invalid body' } }, 422);
    }
    return;
  }),
  async (c) => {
    const userId = c.get('userId');
    const slug = c.req.param('slug')!;
    const { content } = c.req.valid('json');
    const result = await addListComment(c.env.DB, userId, slug, content);
    return c.json({ data: result }, 201);
  }
);

lists.delete('/:slug/comments/:id', requireAuth, async (c) => {
  const userId = c.get('userId');
  const commentId = parseInt(c.req.param('id')!, 10);
  if (isNaN(commentId)) {
    return c.json({ error: { code: 'BAD_REQUEST', message: 'Invalid comment id' } }, 400);
  }
  await deleteListComment(c.env.DB, userId, commentId);
  return c.json({ data: { success: true } });
});

export { lists };
