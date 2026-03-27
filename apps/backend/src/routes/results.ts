import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import type { Env } from '../types/env';
import type { GameXPResult } from '@harfhane/shared';
import { requireAuth } from '../middleware/auth-middleware';
import { saveResultSchema } from '../schemas/auth-schemas';
import { saveResult, getUserStats, getUnlimitedStats, getLeaderboard, type LeaderboardPeriod } from '../repositories/result-repository';
import { processGameXP } from '../services/gamification-service';

type ResultEnv = { Bindings: Env; Variables: { userId: number } };

export const results = new Hono<ResultEnv>();

results.post('/', requireAuth, zValidator('json', saveResultSchema), async (c) => {
  const userId = c.get('userId');
  const { date, word_length, guesses, won, mode, word_id } = c.req.valid('json');

  await saveResult(c.env.DB, userId, date, word_length, guesses, won, mode ?? 'daily', word_id);

  let xp: GameXPResult | null = null;
  try {
    xp = await processGameXP(c.env.DB, userId, won, guesses);
  } catch {
    xp = null;
  }

  return c.json({ data: { success: true, xp } }, 201);
});

results.get('/me', requireAuth, async (c) => {
  const userId = c.get('userId');
  const stats = await getUserStats(c.env.DB, userId);
  return c.json({ data: stats });
});

results.get('/me/unlimited', requireAuth, async (c) => {
  const userId = c.get('userId');
  const stats = await getUnlimitedStats(c.env.DB, userId);
  return c.json({ data: { stats } });
});

const VALID_PERIODS = new Set<LeaderboardPeriod>(['all', 'week', 'month']);

results.get('/leaderboard', async (c) => {
  const raw = c.req.query('period') ?? 'all';
  const period: LeaderboardPeriod = VALID_PERIODS.has(raw as LeaderboardPeriod)
    ? (raw as LeaderboardPeriod)
    : 'all';
  const rows = await getLeaderboard(c.env.DB, period);
  return c.json({ data: { leaderboard: rows } });
});
