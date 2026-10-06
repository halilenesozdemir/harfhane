import type { Env } from '../types/env';
import { ACTIVE_WORD_LENGTHS, type ActiveWordLength, ANSWER_REPEAT_COOLDOWN_DAYS } from '../constants/schedule';

export interface ScheduleHealthRow {
  length: ActiveWordLength;
  runwayDays: number;
  lastScheduledDate: string | null;
  unscheduledStock: number;
  restockRunwayDays: number;
}

interface ScheduledDateRow {
  length: number;
  date: string;
}

function countConsecutiveRunway(dates: string[], today: string): number {
  const dateSet = new Set(dates);
  const cursor = new Date(today);
  let runway = 0;
  while (dateSet.has(cursor.toISOString().slice(0, 10))) {
    runway += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  return runway;
}

async function fetchScheduledDates(db: Env['DB'], today: string): Promise<ScheduledDateRow[]> {
  const rows = await db
    .prepare('SELECT length, date FROM daily_words WHERE date >= ? ORDER BY length ASC, date ASC')
    .bind(today)
    .all<ScheduledDateRow>();
  return rows.results ?? [];
}

async function fetchUnscheduledStock(db: Env['DB'], length: number): Promise<number> {
  const row = await db
    .prepare(
      `SELECT COUNT(*) as count FROM words
       WHERE is_active = 1 AND status = 'approved' AND pool = 'daily' AND length = ?
         AND id NOT IN (SELECT word_id FROM daily_words WHERE length = ?)`
    )
    .bind(length, length)
    .first<{ count: number }>();
  return row?.count ?? 0;
}

function subtractDays(date: string, days: number): string {
  const cursor = new Date(`${date}T00:00:00Z`);
  cursor.setUTCDate(cursor.getUTCDate() - days);
  return cursor.toISOString().slice(0, 10);
}

/** Approved, active, daily-pool words of this length that R3's cooldown still allows to be
 * scheduled from `today` onward: never used, or last used more than the cooldown ago. */
async function fetchRestockRunwayDays(db: Env['DB'], length: number, today: string): Promise<number> {
  const threshold = subtractDays(today, ANSWER_REPEAT_COOLDOWN_DAYS);
  const row = await db
    .prepare(
      `SELECT COUNT(*) as count FROM words
       WHERE is_active = 1 AND status = 'approved' AND family_safe = 1 AND pool = 'daily'
         AND source != 'user' AND length = ?
         AND id NOT IN (SELECT word_id FROM daily_words WHERE length = ? AND date >= ?)`
    )
    .bind(length, length, threshold)
    .first<{ count: number }>();
  return row?.count ?? 0;
}

function groupDatesByLength(rows: ScheduledDateRow[]): Map<number, string[]> {
  const byLength = new Map<number, string[]>();
  for (const row of rows) {
    const existing = byLength.get(row.length) ?? [];
    existing.push(row.date);
    byLength.set(row.length, existing);
  }
  return byLength;
}

export async function findScheduleRunway(
  db: Env['DB'],
  today: string
): Promise<ScheduleHealthRow[]> {
  const scheduledRows = await fetchScheduledDates(db, today);
  const byLength = groupDatesByLength(scheduledRows);

  const results: ScheduleHealthRow[] = [];
  for (const length of ACTIVE_WORD_LENGTHS) {
    const dates = byLength.get(length) ?? [];
    const runwayDays = countConsecutiveRunway(dates, today);
    const lastScheduledDate = dates.length > 0 ? dates[dates.length - 1]! : null;
    const unscheduledStock = await fetchUnscheduledStock(db, length);
    const restockRunwayDays = await fetchRestockRunwayDays(db, length, today);
    results.push({ length, runwayDays, lastScheduledDate, unscheduledStock, restockRunwayDays });
  }
  return results;
}
