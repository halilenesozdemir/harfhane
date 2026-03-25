import type { WordEntry } from '@nurdle/shared';
import type { Env } from '../types/env';
import { normalizeWord } from '../utils/normalize';

interface WordRow {
  id: number;
  word: string;
  meaning: string;
  context: string;
  category: 'isim' | 'sıfat' | 'fiil';
}

interface DailyWordRow {
  word_id: number;
  date: string;
  word: string;
  meaning: string;
  context: string;
  category: 'isim' | 'sıfat' | 'fiil';
}

function toWordEntry(row: WordRow): WordEntry {
  return {
    word: row.word,
    meaning: row.meaning,
    context: row.context,
    category: row.category,
  };
}

export async function findDailyWord(
  db: Env['DB'],
  date: string,
  length = 5
): Promise<(WordEntry & { gameNumber: number }) | null> {
  const row = await db
    .prepare(
      `SELECT dw.word_id, dw.date, w.word, w.meaning, w.context, w.category
       FROM daily_words dw
       JOIN words w ON w.id = dw.word_id
       WHERE dw.date = ? AND length(w.word) = ?
       LIMIT 1`
    )
    .bind(date, length)
    .first<DailyWordRow>();

  if (!row) return null;

  const countRow = await db
    .prepare(
      `SELECT COUNT(*) as count FROM daily_words dw
       JOIN words w ON w.id = dw.word_id
       WHERE dw.date <= ? AND length(w.word) = ?`
    )
    .bind(date, length)
    .first<{ count: number }>();

  return {
    word: row.word,
    meaning: row.meaning,
    context: row.context,
    category: row.category,
    gameNumber: countRow?.count ?? 1,
  };
}

export async function findRandomWord(db: Env['DB'], length = 5): Promise<WordEntry | null> {
  const row = await db
    .prepare(
      `SELECT id, word, meaning, context, category
       FROM words
       WHERE is_active = 1 AND length(word) = ?
       ORDER BY RANDOM()
       LIMIT 1`
    )
    .bind(length)
    .first<WordRow>();

  return row ? toWordEntry(row) : null;
}

export async function wordExists(db: Env['DB'], word: string): Promise<boolean> {
  const normalized = normalizeWord(word);
  const row = await db
    .prepare(`SELECT 1 FROM tdk_words WHERE word = ? LIMIT 1`)
    .bind(normalized)
    .first();
  return row !== null;
}
