import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from './types/env';
import { ApiError } from './errors/api-error';
import { words } from './routes/words';
import { health } from './routes/health';
import { admin } from './routes/admin';
import { feedback } from './routes/feedback';
import { gameRateLimiter } from './middleware/rate-limiter';
import { securityHeaders } from './middleware/security-headers';
import { checkScheduleHealthAndAlert } from './services/schedule-health-service';
import { autoFillDailySchedule } from './services/admin-service';
import { SCHEDULE_TOPUP_DAYS } from './constants/schedule';

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
app.route('/api/feedback', feedback);

app.onError((err, c) => {
  if (err instanceof ApiError) {
    return c.json({ error: { code: err.code, message: err.message } }, err.statusCode as 400 | 401 | 403 | 404 | 409 | 422 | 500);
  }
  return c.json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, 500);
});

app.notFound((c) => {
  return c.json({ error: { code: 'NOT_FOUND', message: 'Route not found' } }, 404);
});

export interface CronJobResult {
  ok: boolean;
  error?: unknown;
}

export interface CronRunResult {
  autoFill: CronJobResult;
  alert: CronJobResult;
}

function toJobResult(settled: PromiseSettledResult<unknown>): CronJobResult {
  return settled.status === 'fulfilled' ? { ok: true } : { ok: false, error: settled.reason };
}

// Runs the cron's two jobs and returns a structured, per-job result instead of letting
// `allSettled` discard failures silently — so a future monitoring hook (or a test) can
// tell a failed auto-fill or alert apart from a successful run without `console.*`
// (forbidden in production code here).
export async function runScheduledJobs(env: Env): Promise<CronRunResult> {
  // Top up the schedule before checking its health, so the health check (and alert)
  // reflect what auto-fill could actually place, not stale gaps (Plan 006 U3a).
  const [autoFillSettled] = await Promise.allSettled([autoFillDailySchedule(env.DB, SCHEDULE_TOPUP_DAYS)]);
  const [alertSettled] = await Promise.allSettled([
    checkScheduleHealthAndAlert(env.DB, env.RESEND_API_KEY, env.ADMIN_ALERT_EMAIL, env.PLAYABLE_WORD_LENGTHS),
  ]);

  return {
    autoFill: toJobResult(autoFillSettled),
    alert: toJobResult(alertSettled),
  };
}

export default {
  fetch: app.fetch,

  async scheduled(_event: ScheduledEvent, env: Env): Promise<void> {
    await runScheduledJobs(env);
  },
};
