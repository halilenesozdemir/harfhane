import { getTodayString } from '@harfhane/shared';
import type { Env } from '../types/env';
import { ApiError } from '../errors/api-error';
import { normalizeWord } from '../utils/normalize';
import {
  insertFeedback,
  listFeedback as listFeedbackRows,
  updateFeedbackStatus as updateFeedbackStatusRow,
  findScheduledWord,
  type FeedbackRow,
} from '../repositories/feedback-repository';
import { sendFeedbackEmail } from '../utils/feedback-email';
import type { CreateFeedbackInput } from '../schemas/feedback-schemas';

export interface SubmitFeedbackResult {
  feedback: FeedbackRow;
  emailSent: boolean;
}

// AE4: a future puzzle_date is rejected before any scheduled-word lookup, so
// the endpoint never confirms (or denies) a future answer.
async function verifyWordReport(db: Env['DB'], input: CreateFeedbackInput): Promise<void> {
  if (input.kind !== 'word_report' || input.puzzle_date === undefined) return;

  const today = getTodayString();
  if (input.puzzle_date > today) {
    throw new ApiError(422, 'FUTURE_DATE', 'puzzle_date cannot be in the future');
  }

  // AE3: today's answer is never confirmed or denied either — comparing
  // against today's scheduled word would let a caller probe it via trial and
  // error (201 for the right word, 422 for a wrong one). Verification only
  // runs for a strictly past date; today's report is stored as-is.
  if (input.puzzle_date === today) return;

  // Only daily mode has a single "correct" word to verify against; unlimited
  // reports (see feedback-schemas.ts) are stored as-is.
  if (input.mode !== 'daily' || input.word_length === undefined || input.reported_word === undefined) return;

  const scheduledWord = await findScheduledWord(db, input.puzzle_date, input.word_length);
  if (!scheduledWord || normalizeWord(scheduledWord) !== normalizeWord(input.reported_word)) {
    throw new ApiError(422, 'WORD_MISMATCH', 'Reported word does not match the scheduled daily word');
  }
}

export async function submitFeedback(
  db: Env['DB'],
  env: Env,
  input: CreateFeedbackInput
): Promise<SubmitFeedbackResult> {
  await verifyWordReport(db, input);

  const feedback = await insertFeedback(db, input);

  const to = env.FEEDBACK_EMAIL ?? env.ADMIN_ALERT_EMAIL;
  if (!to) return { feedback, emailSent: false };

  // KTD1: storage-first, email-best-effort — a rejected email never throws
  // past this point (AE2); the row above is already committed.
  try {
    await sendFeedbackEmail(env.RESEND_API_KEY, to, feedback);
    return { feedback, emailSent: true };
  } catch {
    return { feedback, emailSent: false };
  }
}

export async function listFeedback(db: Env['DB'], status?: FeedbackRow['status']): Promise<FeedbackRow[]> {
  return listFeedbackRows(db, status);
}

export async function updateFeedbackStatus(db: Env['DB'], id: number, status: FeedbackRow['status']): Promise<FeedbackRow> {
  const row = await updateFeedbackStatusRow(db, id, status);
  if (!row) throw new ApiError(404, 'NOT_FOUND', 'Feedback not found');
  return row;
}
