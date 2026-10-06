import type { WordEntry } from '@harfhane/shared';
import { getGameNumber } from '@harfhane/shared';
import type { Env } from '../types/env';
import { normalizeWord } from '../utils/normalize';

// Midday UTC always falls inside the same Turkey calendar day as `date` (fixed UTC+3
// offset, see packages/shared/src/game/time.ts), so this is a safe anchor for turning a
// `YYYY-MM-DD` daily-word date back into a Date for getGameNumber.
function gameNumberForDate(date: string): number {
  return getGameNumber(new Date(`${date}T12:00:00Z`));
}

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
       WHERE dw.date = ? AND length(w.word) = ? AND w.source != 'user'
       LIMIT 1`
    )
    .bind(date, length)
    .first<DailyWordRow>();

  if (!row) return null;

  return {
    word: row.word,
    meaning: row.meaning,
    context: row.context,
    category: row.category,
    gameNumber: gameNumberForDate(date),
  };
}

export async function findRandomWord(
  db: Env['DB'],
  length = 5
): Promise<{ entry: WordEntry; id: number } | null> {
  const row = await db
    .prepare(
      `SELECT id, word, meaning, context, category
       FROM words
       WHERE is_active = 1 AND source != 'user' AND length(word) = ?
       ORDER BY RANDOM()
       LIMIT 1`
    )
    .bind(length)
    .first<WordRow>();

  return row ? { entry: toWordEntry(row), id: row.id } : null;
}

export async function findWordById(
  db: Env['DB'],
  wordId: number
): Promise<{ entry: WordEntry; id: number } | null> {
  const row = await db
    .prepare(
      `SELECT id, word, meaning, context, category
       FROM words
       WHERE id = ? AND is_active = 1 AND source != 'user'
       LIMIT 1`
    )
    .bind(wordId)
    .first<WordRow>();

  return row ? { entry: toWordEntry(row), id: row.id } : null;
}

export async function wordExists(db: Env['DB'], word: string): Promise<boolean> {
  const normalized = normalizeWord(word);
  const row = await db
    .prepare(`SELECT 1 FROM valid_words WHERE word = ? LIMIT 1`)
    .bind(normalized)
    .first();
  return row !== null;
}
