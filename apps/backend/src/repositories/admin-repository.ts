import type { Env } from '../types/env';
import { normalizeWord } from '../utils/normalize';
import { ACTIVE_WORD_LENGTHS, type ActiveWordLength } from '../constants/schedule';

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
      `INSERT INTO words
        (word, meaning, context, category, length, source, license, status, family_safe, approved_at, is_active)
       VALUES (?, ?, ?, ?, ?, 'admin', 'original', 'approved', 1, datetime('now'), 1)`
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
    .prepare(
      `UPDATE words SET
         is_active = ?1,
         status = CASE WHEN ?1 = 1 THEN 'approved' ELSE status END,
         family_safe = CASE WHEN ?1 = 1 THEN 1 ELSE family_safe END,
         approved_at = CASE WHEN ?1 = 1 THEN COALESCE(approved_at, datetime('now')) ELSE approved_at END
       WHERE id = ?2`
    )
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

export interface WordStatRow {
  word: string;
  meaning: string;
  total_played: number;
  total_won: number;
  win_rate: number;
  avg_guesses: number | null;
}

export async function adminGetWordStats(
  db: Env['DB'],
  sort: 'played' | 'win_rate',
  limit = 20
): Promise<WordStatRow[]> {
  const orderBy = sort === 'win_rate'
    ? 'win_rate DESC, total_played DESC'
    : 'total_played DESC';

  const rows = await db
    .prepare(
      `SELECT
         w.word,
         w.meaning,
         COUNT(*) AS total_played,
         SUM(gr.won) AS total_won,
         ROUND(SUM(gr.won) * 100.0 / COUNT(*), 1) AS win_rate,
         ROUND(AVG(CASE WHEN gr.won = 1 THEN gr.guesses END), 1) AS avg_guesses
       FROM game_results gr
       JOIN daily_words dw ON dw.date = gr.date AND dw.length = gr.word_length
       JOIN words w ON w.id = dw.word_id
       GROUP BY w.id, w.word, w.meaning
       HAVING total_played >= 1
       ORDER BY ${orderBy}
       LIMIT ?`
    )
    .bind(limit)
    .all<WordStatRow>();

  return rows.results ?? [];
}

const DEFAULT_IMPORT_SOURCE = 'admin';
const DEFAULT_IMPORT_LICENSE = 'owner-curated';

export interface BulkImportWord {
  word: string;
  meaning: string;
  context: string;
  category: string;
  source?: string;
  license?: string;
}

export async function adminBulkInsertWords(
  db: Env['DB'],
  words: BulkImportWord[]
): Promise<{ inserted: number; skipped: number }> {
  const statements = words.map((w) =>
    db
      .prepare(
        `INSERT OR IGNORE INTO words
          (word, meaning, context, category, length, source, license, status, family_safe, approved_at, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'approved', 1, datetime('now'), 1)`
      )
      .bind(
        w.word,
        w.meaning,
        w.context,
        w.category,
        w.word.length,
        w.source ?? DEFAULT_IMPORT_SOURCE,
        w.license ?? DEFAULT_IMPORT_LICENSE
      )
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

export interface AdminUserRow {
  id: number;
  username: string;
  email: string;
  created_at: string;
  total_played: number;
  total_won: number;
  last_played: string | null;
}

export async function adminGetUsers(db: Env['DB']): Promise<AdminUserRow[]> {
  const rows = await db
    .prepare(
      `SELECT
         u.id, u.username, u.email, u.created_at,
         COUNT(gr.id) as total_played,
         SUM(COALESCE(gr.won, 0)) as total_won,
         MAX(gr.date) as last_played
       FROM users u
       LEFT JOIN game_results gr ON gr.user_id = u.id
       GROUP BY u.id
       ORDER BY u.created_at DESC
       LIMIT 100`
    )
    .all<AdminUserRow>();
  return rows.results ?? [];
}

function generateDatesInRange(from: string, to: string): string[] {
  const dates: string[] = [];
  const cursor = new Date(from);
  const end = new Date(to);
  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j] as T, copy[i] as T];
  }
  return copy;
}

async function autoFillLength(
  db: Env['DB'],
  from: string,
  to: string,
  length: ActiveWordLength
): Promise<{ scheduled: number; skipped: number }> {
  const [existingResult, activeResult] = await db.batch([
    db.prepare('SELECT date FROM daily_words WHERE date >= ? AND date <= ? AND length = ?').bind(from, to, length),
    db.prepare('SELECT id FROM words WHERE is_active = 1 AND length = ?').bind(length),
  ]);

  const scheduledDates = new Set(
    ((existingResult?.results ?? []) as { date: string }[]).map((r) => r.date)
  );
  const activeIds = ((activeResult?.results ?? []) as { id: number }[]).map((r) => r.id);

  const unscheduledDates = generateDatesInRange(from, to).filter((d) => !scheduledDates.has(d));
  if (unscheduledDates.length === 0 || activeIds.length === 0) {
    return { scheduled: 0, skipped: scheduledDates.size };
  }

  const pool = shuffleArray(activeIds);
  const statements = unscheduledDates.map((date, i) => {
    const wordId = pool[i % pool.length] as number;
    return db
      .prepare('INSERT OR IGNORE INTO daily_words (word_id, date, length) VALUES (?, ?, ?)')
      .bind(wordId, date, length);
  });

  const insertResults = await db.batch(statements);
  const scheduled = insertResults.filter((r) => (r.meta.changes ?? 0) > 0).length;

  return { scheduled, skipped: scheduledDates.size };
}

export async function adminAutoFillSchedule(
  db: Env['DB'],
  from: string,
  to: string
): Promise<{ scheduled: number; skipped: number }> {
  let scheduled = 0;
  let skipped = 0;
  for (const length of ACTIVE_WORD_LENGTHS) {
    const result = await autoFillLength(db, from, to, length);
    scheduled += result.scheduled;
    skipped += result.skipped;
  }
  return { scheduled, skipped };
}
