import { z } from 'zod';
import { parseTurkeyDate, parseWordLength } from '@harfhane/shared';
import { normalizeWord } from '../utils/normalize';

const turkeyDateQueryParam = z
  .string()
  .transform((value, ctx) => {
    const parsed = parseTurkeyDate(value);
    if (parsed === null) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Date must be in YYYY-MM-DD format' });
      return z.NEVER;
    }
    return parsed;
  })
  .optional();

const wordLengthQueryParam = z
  .string()
  // Exactly one of the allowed digits: no leading zero ("05"), decimal
  // ("5.0"), sign or surrounding whitespace survives this regex.
  .regex(/^[4-6]$/, 'Length must be 4, 5, or 6')
  .transform((value, ctx) => {
    const parsed = parseWordLength(Number(value));
    if (parsed === null) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Length must be 4, 5, or 6' });
      return z.NEVER;
    }
    return parsed;
  })
  .optional();

export const dailyWordQuerySchema = z.object({
  date: turkeyDateQueryParam,
  length: wordLengthQueryParam,
});

export const randomWordQuerySchema = z.object({
  length: wordLengthQueryParam,
});

export const validateWordBodySchema = z.object({
  word: z
    .string()
    .min(1)
    .max(10)
    .transform((w) => normalizeWord(w)),
});
