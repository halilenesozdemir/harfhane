import { Hono } from 'hono';
import type { Env } from '../types/env';
import { requireAuth } from '../middleware/auth-middleware';
import { getUserXPProfile } from '../repositories/gamification-repository';

type GamificationEnv = { Bindings: Env; Variables: { userId: number } };

export const gamification = new Hono<GamificationEnv>();

gamification.get('/me', requireAuth, async (c) => {
  const userId = c.get('userId');
  const profile = await getUserXPProfile(c.env.DB, userId);
  return c.json({ data: profile });
});
