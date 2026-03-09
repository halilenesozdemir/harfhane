import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import type { Env } from '../types/env';
import { requireAuth } from '../middleware/auth-middleware';
import { saveResultSchema } from '../schemas/auth-schemas';
import { saveResult, getUserStats, getLeaderboard } from '../repositories/result-repository';

type ResultEnv = { Bindings: Env; Variables: { userId: number } };

export const results = new Hono<ResultEnv>();

// Oyun sonucu kaydet (auth gerekli)
results.post('/', requireAuth, zValidator('json', saveResultSchema), async (c) => {
  const userId = c.get('userId');
  const { date, word_length, guesses, won } = c.req.valid('json');

  await saveResult(c.env.DB, userId, date, word_length, guesses, won);

  return c.json({ data: { success: true } }, 201);
});

// Kişisel istatistikler (auth gerekli)
results.get('/me', requireAuth, async (c) => {
  const userId = c.get('userId');
  const stats = await getUserStats(c.env.DB, userId);
  return c.json({ data: stats });
});

// Leaderboard (public)
results.get('/leaderboard', async (c) => {
  const rows = await getLeaderboard(c.env.DB);
  return c.json({ data: { leaderboard: rows } });
});
