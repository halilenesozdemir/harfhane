import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { Env } from '../types/env';
import { requireAuth } from '../middleware/auth-middleware';
import {
  setEmailNotifications,
  getEmailNotificationsStatus,
} from '../repositories/notification-repository';

type NotificationsEnv = { Bindings: Env; Variables: { userId: number } };

export const notifications = new Hono<NotificationsEnv>();

notifications.get('/email', requireAuth, async (c) => {
  const userId = c.get('userId');
  const enabled = await getEmailNotificationsStatus(c.env.DB, userId);
  return c.json({ data: { enabled } });
});

notifications.patch(
  '/email',
  requireAuth,
  zValidator('json', z.object({ enabled: z.boolean() })),
  async (c) => {
    const userId = c.get('userId');
    const { enabled } = c.req.valid('json');
    await setEmailNotifications(c.env.DB, userId, enabled);
    return c.json({ data: { enabled } });
  }
);
