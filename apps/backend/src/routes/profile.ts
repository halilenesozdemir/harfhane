import { Hono } from 'hono';
import { getTodayString } from '@harfhane/shared';
import type { Env } from '../types/env';
import { requireAuth } from '../middleware/auth-middleware';
import { getUserStats } from '../repositories/result-repository';
import { getFreezeTokens, applyFreeze } from '../repositories/freeze-repository';

type ProfileEnv = { Bindings: Env; Variables: { userId: number } };

export const profile = new Hono<ProfileEnv>();

profile.get('/me', requireAuth, async (c) => {
  const userId = c.get('userId');
  const today = getTodayString();

  const [stats, freezeTokens] = await Promise.all([
    getUserStats(c.env.DB, userId),
    getFreezeTokens(c.env.DB, userId),
  ]);

  const playedToday = await c.env.DB
    .prepare('SELECT 1 FROM game_results WHERE user_id = ? AND date = ? LIMIT 1')
    .bind(userId, today)
    .first();

  return c.json({
    data: {
      stats,
      freezeTokens,
      playedToday: !!playedToday,
    },
  });
});

profile.post('/freeze', requireAuth, async (c) => {
  const userId = c.get('userId');
  const today = getTodayString();

  const playedToday = await c.env.DB
    .prepare('SELECT 1 FROM game_results WHERE user_id = ? AND date = ? LIMIT 1')
    .bind(userId, today)
    .first();

  if (playedToday) {
    return c.json({ error: { code: 'ALREADY_PLAYED', message: 'Bugün zaten oynadın' } }, 400);
  }

  const applied = await applyFreeze(c.env.DB, userId, today);
  if (!applied) {
    return c.json({ error: { code: 'NO_TOKENS', message: 'Dondurma jetonun kalmadı' } }, 400);
  }

  return c.json({ data: { success: true } });
});
