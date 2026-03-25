import type { Env } from '../types/env';
import { normalizeWord } from '../utils/normalize';

export interface WordRow {
  id: number;
  word: string;
  meaning: string;
  context: string;
  category: 'isim' | 'sıfat' | 'fiil';
  is_active: number;
  created_at: string;
}

export interface DailyWordRow {
  id: number;
  date: string;
  word_id: number;
  word: string;
  meaning: string;
  category: 'isim' | 'sıfat' | 'fiil';
  length: number;
}

export interface ListWordsOptions {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  active?: '0' | '1';
  length?: number;
  sort?: 'az' | 'id_desc';
}

export async function adminFindWords(
  db: Env['DB'],
  opts: ListWordsOptions
): Promise<{ words: WordRow[]; total: number }> {
  const { page, limit, search, category, active, length, sort } = opts;
  const offset = (page - 1) * limit;
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (search) {
    conditions.push('(UPPER(word) LIKE ? OR UPPER(meaning) LIKE ?)');
    const pattern = `%${normalizeWord(search)}%`;
    params.push(pattern, pattern);
  }
  if (category) {
    conditions.push('category = ?');
    params.push(category);
  }
  if (active !== undefined) {
    conditions.push('is_active = ?');
    params.push(Number(active));
  }
  if (length !== undefined) {
    conditions.push('length = ?');
    params.push(length);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const orderBy = sort === 'az' ? 'ORDER BY word ASC' : 'ORDER BY id DESC';

  const batchResults = await db.batch([
    db.prepare(
      `SELECT id, word, meaning, context, category, is_active, created_at
       FROM words ${where}
       ${orderBy}
       LIMIT ? OFFSET ?`
    ).bind(...params, limit, offset),
    db.prepare(
      `SELECT COUNT(*) as total FROM words ${where}`
    ).bind(...params),
  ]);

  const dataResult = batchResults[0];
  const countResult = batchResults[1];
  const words = (dataResult?.results as WordRow[] | undefined) ?? [];
  const total = (countResult?.results[0] as { total: number } | undefined)?.total ?? 0;
  return { words, total };
}

export async function adminFindWordById(
  db: Env['DB'],
  id: number
): Promise<WordRow | null> {
  return db
    .prepare('SELECT id, word, meaning, context, category, is_active, created_at FROM words WHERE id = ?')
    .bind(id)
    .first<WordRow>();
}

export async function adminCreateWord(
  db: Env['DB'],
  data: { word: string; meaning: string; context: string; category: string }
): Promise<number> {
  const result = await db
    .prepare(
      'INSERT INTO words (word, meaning, context, category, length) VALUES (?, ?, ?, ?, ?)'
    )
    .bind(data.word, data.meaning, data.context, data.category, data.word.length)
    .run();
  return result.meta.last_row_id as number;
}

export async function adminUpdateWord(
  db: Env['DB'],
  id: number,
  data: { word?: string; meaning?: string; context?: string; category?: string }
): Promise<boolean> {
  const fields: string[] = [];
  const params: (string | number)[] = [];

  if (data.word !== undefined) {
    fields.push('word = ?', 'length = ?');
    params.push(data.word, data.word.length);
  }
  if (data.meaning !== undefined) { fields.push('meaning = ?'); params.push(data.meaning); }
  if (data.context !== undefined) { fields.push('context = ?'); params.push(data.context); }
  if (data.category !== undefined) { fields.push('category = ?'); params.push(data.category); }

  if (fields.length === 0) return false;
  params.push(id);

  const result = await db
    .prepare(`UPDATE words SET ${fields.join(', ')} WHERE id = ?`)
    .bind(...params)
    .run();

  return (result.meta.changes ?? 0) > 0;
}

export async function adminSetWordActive(
  db: Env['DB'],
  id: number,
  isActive: boolean
): Promise<boolean> {
  const result = await db
    .prepare('UPDATE words SET is_active = ? WHERE id = ?')
    .bind(isActive ? 1 : 0, id)
    .run();
  return (result.meta.changes ?? 0) > 0;
}

export async function adminFindDailySchedule(
  db: Env['DB'],
  from: string,
  to: string
): Promise<DailyWordRow[]> {
  const rows = await db
    .prepare(
      `SELECT dw.id, dw.date, dw.word_id, dw.length, w.word, w.meaning, w.category
       FROM daily_words dw
       JOIN words w ON w.id = dw.word_id
       WHERE dw.date >= ? AND dw.date <= ?
       ORDER BY dw.date ASC, dw.length ASC`
    )
    .bind(from, to)
    .all<DailyWordRow>();
  return rows.results ?? [];
}

export async function adminScheduleDailyWord(
  db: Env['DB'],
  wordId: number,
  date: string,
  length: number
): Promise<number> {
  const result = await db
    .prepare(
      `INSERT INTO daily_words (word_id, date, length) VALUES (?, ?, ?)
       ON CONFLICT(date, length) DO UPDATE SET word_id = excluded.word_id`
    )
    .bind(wordId, date, length)
    .run();
  return result.meta.last_row_id as number;
}

export async function adminRemoveDailyWord(
  db: Env['DB'],
  id: number
): Promise<boolean> {
  const result = await db
    .prepare('DELETE FROM daily_words WHERE id = ?')
    .bind(id)
    .run();
  return (result.meta.changes ?? 0) > 0;
}

export interface AdminStats {
  words: { total: number; active: number; inactive: number };
  daily: { today: string | null; scheduledNext30: number; unscheduledNext30: number };
  users: { total: number };
  games: { totalPlayed: number; playedToday: number };
}

export async function adminGetStats(db: Env['DB'], todayDate: string): Promise<AdminStats> {
  const end = new Date(todayDate);
  end.setDate(end.getDate() + 29);
  const endDate = end.toISOString().slice(0, 10);

  const results = await db.batch([
    db.prepare('SELECT COUNT(*) as total, SUM(is_active) as active FROM words'),
    db.prepare('SELECT w.word FROM daily_words dw JOIN words w ON w.id = dw.word_id WHERE dw.date = ? LIMIT 1').bind(todayDate),
    db.prepare('SELECT COUNT(DISTINCT date) as count FROM daily_words WHERE date >= ? AND date <= ?').bind(todayDate, endDate),
    db.prepare('SELECT COUNT(*) as total FROM users'),
    db.prepare('SELECT COUNT(*) as total FROM game_results'),
    db.prepare('SELECT COUNT(*) as total FROM game_results WHERE date = ?').bind(todayDate),
  ]);

  const wordRow = results[0]?.results[0] as { total: number; active: number } | undefined;
  const todayWordRow = results[1]?.results[0] as { word: string } | undefined;
  const scheduledRow = results[2]?.results[0] as { count: number } | undefined;
  const userRow = results[3]?.results[0] as { total: number } | undefined;
  const gamesRow = results[4]?.results[0] as { total: number } | undefined;
  const todayGamesRow = results[5]?.results[0] as { total: number } | undefined;

  const total = wordRow?.total ?? 0;
  const active = wordRow?.active ?? 0;
  const scheduled = scheduledRow?.count ?? 0;

  return {
    words: { total, active, inactive: total - active },
    daily: { today: todayWordRow?.word ?? null, scheduledNext30: scheduled, unscheduledNext30: 30 - scheduled },
    users: { total: userRow?.total ?? 0 },
    games: { totalPlayed: gamesRow?.total ?? 0, playedToday: todayGamesRow?.total ?? 0 },
  };
}

export async function adminBulkInsertWords(
  db: Env['DB'],
  words: { word: string; meaning: string; context: string; category: string }[]
): Promise<{ inserted: number; skipped: number }> {
  const statements = words.map((w) =>
    db
      .prepare('INSERT OR IGNORE INTO words (word, meaning, context, category) VALUES (?, ?, ?, ?)')
      .bind(w.word, w.meaning, w.context, w.category)
  );

  const results = await db.batch(statements);
  let inserted = 0;
  let skipped = 0;
  for (const r of results) {
    if ((r.meta.changes ?? 0) > 0) inserted++;
    else skipped++;
  }
  return { inserted, skipped };
}
