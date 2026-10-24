import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import type { Env } from '../types/env';
import { createFeedbackSchema } from '../schemas/feedback-schemas';
import { submitFeedback } from '../services/feedback-service';
import { feedbackRateLimiter } from '../middleware/rate-limiter';

const feedback = new Hono<{ Bindings: Env }>();

feedback.use('/', feedbackRateLimiter);

feedback.post(
  '/',
  zValidator('json', createFeedbackSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: { code: 'VALIDATION_ERROR', message: result.error.issues[0]?.message ?? 'Invalid body' } }, 422);
    }
    return;
  }),
  async (c) => {
    const input = c.req.valid('json');
    const result = await submitFeedback(c.env.DB, c.env, input);
    return c.json({ data: result }, 201);
  }
);

export { feedback };
