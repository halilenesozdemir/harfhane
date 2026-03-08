import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from './types/env';
import { ApiError } from './errors/api-error';
import { words } from './routes/words';
import { admin } from './routes/admin';
import { lists } from './routes/lists';

const app = new Hono<{ Bindings: Env }>();

app.use(
  '/api/*',
  cors({
    origin: ['http://localhost:5173', 'https://nurdle.app', 'https://nurdle.pages.dev'],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowHeaders: ['Content-Type', 'X-Admin-Secret'],
  })
);

app.route('/api/words', words);
app.route('/api/lists', lists);
app.route('/api/admin', admin);

app.onError((err, c) => {
  if (err instanceof ApiError) {
    return c.json({ error: { code: err.code, message: err.message } }, err.statusCode as 400 | 404 | 500);
  }
  return c.json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, 500);
});

app.notFound((c) => {
  return c.json({ error: { code: 'NOT_FOUND', message: 'Route not found' } }, 404);
});

export default app;

