import { z } from 'zod';
import { parseTurkeyDate, parseWordLength } from '@harfhane/shared';
import { normalizeWord } from '../utils/normalize';

const MAX_MESSAGE_LENGTH = 1000;
const MAX_CONTACT_LENGTH = 200;

const kindSchema = z.enum(['general', 'word_report']);
const statusSchema = z.enum(['new', 'seen', 'done']);

const puzzleDateField = z
  .string()
  .transform((value, ctx) => {
    const parsed = parseTurkeyDate(value);
    if (parsed === null) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'puzzle_date must be in YYYY-MM-DD format' });
      return z.NEVER;
    }
    return parsed;
  })
  .optional();

const wordLengthField = z
  .number()
  .int()
  .transform((value, ctx) => {
    const parsed = parseWordLength(value);
    if (parsed === null) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'word_length must be 4, 5, or 6' });
      return z.NEVER;
    }
    return parsed;
  })
  .optional();

// Judgment call (see PR body "Ambiguities"): kind = 'word_report' requires
// mode, word_length, puzzle_date and reported_word together, since a report
// is only triageable when it names which puzzle it's about. unlimited-mode
// reports skip daily-word verification in feedback-service.ts but still
// require all four fields.
export const createFeedbackSchema = z
  .object({
    kind: kindSchema,
    message: z.string().trim().min(1, 'message must not be empty').max(MAX_MESSAGE_LENGTH),
    contact: z.string().trim().max(MAX_CONTACT_LENGTH).optional(),
    app_platform: z.enum(['android', 'web']),
    app_version: z.string().max(50).optional(),
    mode: z.enum(['daily', 'unlimited']).optional(),
    word_length: wordLengthField,
    puzzle_date: puzzleDateField,
    reported_word: z.string().min(1).max(10).transform(normalizeWord).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.kind !== 'word_report') return;
    const missing = (['mode', 'word_length', 'puzzle_date', 'reported_word'] as const).filter(
      (field) => data[field] === undefined
    );
    if (missing.length > 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `word_report requires: ${missing.join(', ')}` });
    }
  });

export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;

export const listFeedbackQuerySchema = z.object({ status: statusSchema.optional() });
export const updateFeedbackStatusSchema = z.object({ status: statusSchema });
