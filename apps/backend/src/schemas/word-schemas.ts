import { z } from 'zod';
import { normalizeWord } from '../utils/normalize';

export const dailyWordQuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),
  length: z
    .string()
    .regex(/^[4-7]$/, 'Length must be 4, 5, 6, or 7')
    .transform(Number)
    .optional(),
});

export const randomWordQuerySchema = z.object({
  length: z
    .string()
    .regex(/^[4-7]$/, 'Length must be 4, 5, 6, or 7')
    .transform(Number)
    .optional(),
});

export const validateWordBodySchema = z.object({
  word: z
    .string()
    .min(1)
    .max(10)
    .transform((w) => normalizeWord(w)),
});
