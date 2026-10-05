import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import type { Env } from '../types/env';
import { adminAuth } from '../middleware/admin-auth';
import {
  createWordSchema,
  updateWordSchema,
  toggleWordSchema,
  scheduleDailyWordSchema,
  importWordsSchema,
  listWordsQuerySchema,
  listDailyQuerySchema,
  autoFillSchema,
} from '../schemas/admin-schemas';
import {
  listWords,
  getWord,
  createWord,
  updateWord,
  toggleWordActive,
  getDailySchedule,
  scheduleDailyWord,
  removeDailyWord,
  importWords,
  getStats,
  autoFillDailySchedule,
  getWordStats,
  getUsers,
} from '../services/admin-service';
import { getScheduleHealth } from '../services/schedule-health-service';

const admin = new Hono<{ Bindings: Env }>();

admin.use('/*', adminAuth);

// ── Stats ─────────────────────────────────────────────────────────────────────

admin.get('/stats', async (c) => {
  const stats = await getStats(c.env.DB);
  return c.json({ data: stats });
});

admin.get('/users', async (c) => {
  const users = await getUsers(c.env.DB);
  return c.json({ data: users });
});

admin.get('/word-stats', async (c) => {
  const sort = c.req.query('sort') === 'win_rate' ? 'win_rate' : 'played';
  const rows = await getWordStats(c.env.DB, sort);
  return c.json({ data: rows });
});

admin.get('/schedule-health', async (c) => {
  const health = await getScheduleHealth(c.env.DB);
  return c.json({ data: health });
});

// ── Words ────────────────────────────────────────────────────────────────────

admin.get(
  '/words',
  zValidator('query', listWordsQuerySchema, (r, c) => {
    if (!r.success) return c.json({ error: { code: 'BAD_REQUEST', message: r.error.issues[0]?.message ?? 'Invalid query' } }, 400);
    return;
  }),
  async (c) => {
    const opts = c.req.valid('query');
    const result = await listWords(c.env.DB, opts);
    return c.json({ data: result });
  }
);

admin.get('/words/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const word = await getWord(c.env.DB, id);
  return c.json({ data: word });
});

admin.post(
  '/words',
  zValidator('json', createWordSchema, (r, c) => {
    if (!r.success) return c.json({ error: { code: 'VALIDATION_ERROR', message: r.error.issues[0]?.message ?? 'Invalid body' } }, 422);
    return;
  }),
  async (c) => {
    const data = c.req.valid('json');
    const word = await createWord(c.env.DB, data);
    return c.json({ data: word }, 201);
  }
);

admin.put(
  '/words/:id',
  zValidator('json', updateWordSchema, (r, c) => {
    if (!r.success) return c.json({ error: { code: 'VALIDATION_ERROR', message: r.error.issues[0]?.message ?? 'Invalid body' } }, 422);
    return;
  }),
  async (c) => {
    const id = Number(c.req.param('id'));
    const data = c.req.valid('json');
    const word = await updateWord(c.env.DB, id, data);
    return c.json({ data: word });
  }
);

admin.patch(
  '/words/:id',
  zValidator('json', toggleWordSchema, (r, c) => {
    if (!r.success) return c.json({ error: { code: 'VALIDATION_ERROR', message: r.error.issues[0]?.message ?? 'Invalid body' } }, 422);
    return;
  }),
  async (c) => {
    const id = Number(c.req.param('id'));
    const { is_active } = c.req.valid('json');
    const word = await toggleWordActive(c.env.DB, id, is_active);
    return c.json({ data: word });
  }
);

// ── Daily schedule ────────────────────────────────────────────────────────────

admin.get(
  '/daily',
  zValidator('query', listDailyQuerySchema, (r, c) => {
    if (!r.success) return c.json({ error: { code: 'BAD_REQUEST', message: r.error.issues[0]?.message ?? 'Invalid query' } }, 400);
    return;
  }),
  async (c) => {
    const { from, to } = c.req.valid('query');
    const schedule = await getDailySchedule(c.env.DB, from, to);
    return c.json({ data: schedule });
  }
);

admin.post(
  '/daily',
  zValidator('json', scheduleDailyWordSchema, (r, c) => {
    if (!r.success) return c.json({ error: { code: 'VALIDATION_ERROR', message: r.error.issues[0]?.message ?? 'Invalid body' } }, 422);
    return;
  }),
  async (c) => {
    const { word_id, date } = c.req.valid('json');
    const entry = await scheduleDailyWord(c.env.DB, word_id, date);
    return c.json({ data: entry }, 201);
  }
);

admin.delete('/daily/:id', async (c) => {
  const id = Number(c.req.param('id'));
  await removeDailyWord(c.env.DB, id);
  return c.json({ data: { success: true } });
});

admin.post(
  '/daily/auto-fill',
  zValidator('json', autoFillSchema, (r, c) => {
    if (!r.success) return c.json({ error: { code: 'VALIDATION_ERROR', message: r.error.issues[0]?.message ?? 'Invalid body' } }, 422);
    return;
  }),
  async (c) => {
    const { days } = c.req.valid('json');
    const result = await autoFillDailySchedule(c.env.DB, days);
    return c.json({ data: result });
  }
);

// ── Import ────────────────────────────────────────────────────────────────────

admin.post(
  '/import',
  zValidator('json', importWordsSchema, (r, c) => {
    if (!r.success) return c.json({ error: { code: 'VALIDATION_ERROR', message: r.error.issues[0]?.message ?? 'Invalid body' } }, 422);
    return;
  }),
  async (c) => {
    const { words } = c.req.valid('json');
    const result = await importWords(c.env.DB, words);
    return c.json({ data: result });
  }
);

export { admin };
