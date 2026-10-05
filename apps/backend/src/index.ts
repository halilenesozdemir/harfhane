import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from './types/env';
import { ApiError } from './errors/api-error';
import { words } from './routes/words';
import { health } from './routes/health';
import { admin } from './routes/admin';
import { auth } from './routes/auth';
import { results } from './routes/results';
import { gamification } from './routes/gamification';
import { push } from './routes/push';
import { notifications } from './routes/notifications';
import { profile } from './routes/profile';
import { duels } from './routes/duels';
import { rateLimiter, gameRateLimiter } from './middleware/rate-limiter';
import { securityHeaders } from './middleware/security-headers';
import { getSubscriptionsForUsersWithoutTodayPlay } from './repositories/push-repository';
import { sendPushNotification } from './utils/web-push';
import { getUsersForEmailReminder } from './repositories/notification-repository';
import { sendReminderEmail } from './utils/resend';
import { findDailyWord } from './repositories/word-repository';
import { checkScheduleHealthAndAlert } from './services/schedule-health-service';

const CATEGORY_LABELS: Record<string, string> = {
  isim: 'isim',
  sıfat: 'sıfat',
  fiil: 'fiil',
};

function buildHint(meaning: string | null, category: string): string {
  const text = meaning ?? '';
  const wordParts = text.split(' ');
  const snippet = wordParts.slice(0, 4).join(' ');
  const suffix = wordParts.length > 4 ? '..."' : '"';
  const label = CATEGORY_LABELS[category] ?? category;
  return `${label} — "${snippet}${suffix}`;
}

const app = new Hono<{ Bindings: Env }>();

app.use(
  '/api/*',
  cors({
    origin: (origin) => {
      if (!origin) return '*';
      const allowed = [
        'http://localhost:5173',
        'http://localhost:4173',
        'https://harfhane.app',
        'https://www.harfhane.app',
        'https://harfhane.pages.dev',
      ];
      if (allowed.includes(origin)) return origin;
      if (origin.endsWith('.harfhane.pages.dev')) return origin;
      return null;
    },
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowHeaders: ['Content-Type', 'X-Admin-Secret', 'Authorization'],
    credentials: true,
  })
);
app.use('/api/*', securityHeaders);
app.use('/api/auth/*', rateLimiter);
app.use('/api/words/*', gameRateLimiter);

app.route('/api/health', health);
app.route('/api/words', words);
app.route('/api/admin', admin);
app.route('/api/auth', auth);
app.route('/api/results', results);
app.route('/api/xp', gamification);
app.route('/api/push', push);
app.route('/api/notifications', notifications);
app.route('/api/profile', profile);
app.route('/api/duels', duels);

app.onError((err, c) => {
  if (err instanceof ApiError) {
    return c.json({ error: { code: err.code, message: err.message } }, err.statusCode as 400 | 401 | 403 | 404 | 409 | 422 | 500);
  }
  return c.json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, 500);
});

app.notFound((c) => {
  return c.json({ error: { code: 'NOT_FOUND', message: 'Route not found' } }, 404);
});

export default {
  fetch: app.fetch,

  async scheduled(_event: ScheduledEvent, env: Env): Promise<void> {
    const today = new Date().toISOString().split('T')[0]!;

    const [subscriptions, emailTargets, dailyWord] = await Promise.all([
      getSubscriptionsForUsersWithoutTodayPlay(env.DB, today),
      getUsersForEmailReminder(env.DB, today),
      findDailyWord(env.DB, today, 5),
    ]);

    const hint = dailyWord
      ? buildHint(dailyWord.meaning, dailyWord.category)
      : 'Bugünün kelimesi seni bekliyor';

    const pushPayload = {
      title: 'Harfhane — Günlük Kelime',
      body: `Seriyi koru! İpucu: ${hint}`,
      url: '/daily/5',
    };

    await Promise.allSettled([
      ...subscriptions.map((sub) =>
        sendPushNotification(sub, env.VAPID_PRIVATE_KEY, env.VAPID_PUBLIC_KEY, env.VAPID_SUBJECT, pushPayload)
      ),
      ...emailTargets.map((target) =>
        sendReminderEmail(env.RESEND_API_KEY, target.email, target.username)
      ),
      checkScheduleHealthAndAlert(env.DB, env.RESEND_API_KEY, env.ADMIN_ALERT_EMAIL),
    ]);
  },
};

