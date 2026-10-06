import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from './types/env';
import { ApiError } from './errors/api-error';
import { words } from './routes/words';
import { health } from './routes/health';
import { admin } from './routes/admin';
import { gameRateLimiter } from './middleware/rate-limiter';
import { securityHeaders } from './middleware/security-headers';
import { checkScheduleHealthAndAlert } from './services/schedule-health-service';

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
app.use('/api/words/*', gameRateLimiter);

app.route('/api/health', health);
app.route('/api/words', words);
app.route('/api/admin', admin);

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
    await Promise.allSettled([
      checkScheduleHealthAndAlert(env.DB, env.RESEND_API_KEY, env.ADMIN_ALERT_EMAIL),
    ]);
  },
};
