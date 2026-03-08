import { z } from 'zod';
import { normalizeWord } from '../utils/normalize';

export const dailyWordQuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),
});

export const validateWordBodySchema = z.object({
  word: z
    .string()
    .min(1)
    .max(10)
    .transform((w) => normalizeWord(w)),
});
