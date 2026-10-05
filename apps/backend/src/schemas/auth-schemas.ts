import { z } from 'zod';

export const saveResultSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  word_length: z.number().int().min(4).max(7),
  guesses: z.number().int().min(0).max(6),
  won: z.boolean(),
  mode: z.enum(['daily', 'unlimited']).optional(),
  word_id: z.number().int().positive().optional(),
});
