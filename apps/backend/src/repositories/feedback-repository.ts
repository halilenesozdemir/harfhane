import type { TurkeyDate, WordLength } from '@harfhane/shared';
import { findDailyWord } from './word-repository';
import type { Env } from '../types/env';
import type { CreateFeedbackInput } from '../schemas/feedback-schemas';

const LIST_LIMIT = 100;

export interface FeedbackRow {
  id: number;
  created_at: string;
  kind: 'general' | 'word_report';
  message: string;
  contact: string | null;
  app_platform: 'android' | 'web';
  app_version: string | null;
  mode: 'daily' | 'unlimited' | null;
  word_length: number | null;
  puzzle_date: string | null;
  reported_word: string | null;
  status: 'new' | 'seen' | 'done';
}

export async function getFeedbackById(db: Env['DB'], id: number): Promise<FeedbackRow | null> {
  const row = await db.prepare(`SELECT * FROM feedback WHERE id = ?`).bind(id).first<FeedbackRow>();
  return row ?? null;
}

export async function insertFeedback(db: Env['DB'], input: CreateFeedbackInput): Promise<FeedbackRow> {
  const result = await db
    .prepare(
      `INSERT INTO feedback
        (kind, message, contact, app_platform, app_version, mode, word_length, puzzle_date, reported_word)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      input.kind,
      input.message,
      input.contact ?? null,
      input.app_platform,
      input.app_version ?? null,
      input.mode ?? null,
      input.word_length ?? null,
      input.puzzle_date ?? null,
      input.reported_word ?? null
    )
    .run();

  const row = await getFeedbackById(db, result.meta.last_row_id as number);
  if (!row) throw new Error('insertFeedback could not read back the inserted row');
  return row;
}

export async function listFeedback(db: Env['DB'], status?: FeedbackRow['status']): Promise<FeedbackRow[]> {
  const query = status
    ? db.prepare(`SELECT * FROM feedback WHERE status = ? ORDER BY created_at DESC, id DESC LIMIT ?`).bind(status, LIST_LIMIT)
    : db.prepare(`SELECT * FROM feedback ORDER BY created_at DESC, id DESC LIMIT ?`).bind(LIST_LIMIT);
  const result = await query.all<FeedbackRow>();
  return result.results;
}

export async function updateFeedbackStatus(
  db: Env['DB'],
  id: number,
  status: FeedbackRow['status']
): Promise<FeedbackRow | null> {
  const result = await db.prepare(`UPDATE feedback SET status = ? WHERE id = ?`).bind(status, id).run();
  if ((result.meta.changes ?? 0) === 0) return null;
  return getFeedbackById(db, id);
}

// Read-only reuse of word-repository.ts's findDailyWord (no edits to that
// file; it is owned by the concurrent fix/backend-mvp-review branch).
export async function findScheduledWord(db: Env['DB'], date: TurkeyDate, length: WordLength): Promise<string | null> {
  const result = await findDailyWord(db, date, length);
  return result ? result.word : null;
}
