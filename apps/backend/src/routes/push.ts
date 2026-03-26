import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { Env } from '../types/env';
import { requireAuth } from '../middleware/auth-middleware';
import { upsertSubscription, deleteSubscription } from '../repositories/push-repository';

type PushEnv = { Bindings: Env; Variables: { userId: number } };

export const push = new Hono<PushEnv>();

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  p256dh: z.string().min(1),
  auth: z.string().min(1),
});

push.post('/subscribe', requireAuth, zValidator('json', subscribeSchema), async (c) => {
  const userId = c.get('userId');
  const body = c.req.valid('json');
  await upsertSubscription(c.env.DB, userId, body);
  return c.json({ data: { success: true } }, 201);
});

push.delete('/unsubscribe', requireAuth, zValidator('json', z.object({ endpoint: z.string().url() })), async (c) => {
  const userId = c.get('userId');
  const { endpoint } = c.req.valid('json');
  await deleteSubscription(c.env.DB, userId, endpoint);
  return c.json({ data: { success: true } });
});

push.get('/vapid-public-key', (c) => {
  return c.json({ data: { key: c.env.VAPID_PUBLIC_KEY } });
});
