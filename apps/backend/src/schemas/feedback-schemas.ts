import { z } from 'zod';
import { parseTurkeyDate, parseWordLength } from '@harfhane/shared';
import { normalizeWord } from '../utils/normalize';

const MAX_MESSAGE_LENGTH = 1000;
const MAX_CONTACT_LENGTH = 200;
// App version strings only (e.g. "1.4.2", "1.4.2+build.7"); rejects markup
// so the owner-email template (utils/feedback-email.ts) never has to trust
// this field to be HTML-safe on its own.
const APP_VERSION_PATTERN = /^[0-9A-Za-z.+-]{1,50}$/;

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

// Judgment call (see PR body "Ambiguities"): kind = 'word_report' always
// requires mode, word_length and reported_word, since a report is only
// triageable when it names which puzzle it's about. puzzle_date is required
// only for mode = 'daily' (there is a single scheduled word per date to
// verify against); unlimited mode has no such date, so it is never asked
// for one and feedback-service.ts never runs its daily-word comparison for
// an unlimited report.
export const createFeedbackSchema = z
  .object({
    kind: kindSchema,
    message: z.string().trim().min(1, 'message must not be empty').max(MAX_MESSAGE_LENGTH),
    contact: z.string().trim().max(MAX_CONTACT_LENGTH).optional(),
    app_platform: z.enum(['android', 'web']),
    app_version: z.string().regex(APP_VERSION_PATTERN, 'app_version has an invalid format').optional(),
    mode: z.enum(['daily', 'unlimited']).optional(),
    word_length: wordLengthField,
    puzzle_date: puzzleDateField,
    reported_word: z.string().min(1).max(10).transform(normalizeWord).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.kind !== 'word_report') return;
    const missing: string[] = (['mode', 'word_length', 'reported_word'] as const).filter(
      (field) => data[field] === undefined
    );
    if (data.mode === 'daily' && data.puzzle_date === undefined) missing.push('puzzle_date');
    if (missing.length > 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `word_report requires: ${missing.join(', ')}` });
    }
  });

export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;

export const listFeedbackQuerySchema = z.object({ status: statusSchema.optional() });
export const updateFeedbackStatusSchema = z.object({ status: statusSchema });
