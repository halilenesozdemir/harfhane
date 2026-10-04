import { describe, it, expect, beforeAll } from 'vitest';
import { env } from 'cloudflare:test';
import { applySchema } from '../helpers/db';
import { findScheduleRunway } from '../../src/repositories/schedule-health-repository';

const TODAY = '2026-03-01';

async function insertWord(word: string, length: number, status = 'approved', isActive = 1): Promise<number> {
  const row = await env.DB.prepare(
    `INSERT INTO words (word, meaning, context, category, length, source, license, status, family_safe, is_active)
     VALUES (?, ?, ?, 'isim', ?, 'test', 'test', ?, 1, ?)
     RETURNING id`
  )
    .bind(word, 'test anlamı', 'test bağlamı', length, status, isActive)
    .first<{ id: number }>();
  if (!row) throw new Error('word insert failed');
  return row.id;
}

async function scheduleDay(wordId: number, date: string, length: number): Promise<void> {
  await env.DB.prepare('INSERT INTO daily_words (word_id, date, length) VALUES (?, ?, ?)')
    .bind(wordId, date, length)
    .run();
}

beforeAll(async () => {
  await applySchema(env.DB);

  const gapWordA = await insertWord('GAPAA', 5);
  const gapWordB = await insertWord('GAPAB', 5);
  await scheduleDay(gapWordA, '2026-03-01', 5);
  await scheduleDay(gapWordA, '2026-03-02', 5);
  await scheduleDay(gapWordB, '2026-03-04', 5);

  const pastWord = await insertWord('ESKIAZ', 6);
  await scheduleDay(pastWord, '2026-02-01', 6);

  await insertWord('BOSA', 4);
  await insertWord('BOSB', 4);
  await insertWord('BOSC', 4);
});

describe('findScheduleRunway', () => {
  it('stops the runway at the first gap but keeps the furthest scheduled date', async () => {
    const result = await findScheduleRunway(env.DB, TODAY);
    const entry = result.find((r) => r.length === 5);
    expect(entry?.runwayDays).toBe(2);
    expect(entry?.lastScheduledDate).toBe('2026-03-04');
  });

  it('reports zero runway and no last date for a calendar with only past entries', async () => {
    const result = await findScheduleRunway(env.DB, TODAY);
    const entry = result.find((r) => r.length === 6);
    expect(entry?.runwayDays).toBe(0);
    expect(entry?.lastScheduledDate).toBeNull();
  });

  it('reports zero runway, no last date, and full unscheduled stock when nothing is scheduled', async () => {
    const result = await findScheduleRunway(env.DB, TODAY);
    const entry = result.find((r) => r.length === 4);
    expect(entry?.runwayDays).toBe(0);
    expect(entry?.lastScheduledDate).toBeNull();
    expect(entry?.unscheduledStock).toBe(3);
  });

  it('excludes already-scheduled words from the unscheduled stock count', async () => {
    const result = await findScheduleRunway(env.DB, TODAY);
    const entry = result.find((r) => r.length === 5);
    expect(entry?.unscheduledStock).toBe(0);
  });
});
