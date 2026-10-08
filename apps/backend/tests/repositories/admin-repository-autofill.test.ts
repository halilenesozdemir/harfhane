import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { env } from 'cloudflare:test';
import { applySchema } from '../helpers/db';
import { adminAutoFillSchedule } from '../../src/repositories/admin-repository';
import { SCHEDULED_WORD_LENGTHS, ANSWER_REPEAT_COOLDOWN_DAYS } from '../../src/constants/schedule';

const FROM = '2026-02-01';
const TO = '2026-02-05';
const EXPECTED_DAYS = 5;

const LETTERS = 'BCDFGHJKLMN';

async function insertWords(length: number, count: number): Promise<void> {
  for (let i = 0; i < count; i++) {
    const word = LETTERS[i] + 'A'.repeat(length - 1);
    await env.DB
      .prepare(
        `INSERT INTO words (word, length, source, license, status, family_safe, is_active)
         VALUES (?, ?, 'test', 'test', 'approved', 1, 1)`
      )
      .bind(word, length)
      .run();
  }
}

async function wordIdFor(word: string): Promise<number> {
  const row = await env.DB.prepare('SELECT id FROM words WHERE word = ?').bind(word).first<{ id: number }>();
  if (!row) throw new Error(`word not found: ${word}`);
  return row.id;
}

async function scheduleDay(wordId: number, date: string, length: number): Promise<void> {
  await env.DB.prepare('INSERT INTO daily_words (word_id, date, length) VALUES (?, ?, ?)')
    .bind(wordId, date, length)
    .run();
}

function isoDateMinusDays(date: string, days: number): string {
  const cursor = new Date(`${date}T00:00:00Z`);
  cursor.setUTCDate(cursor.getUTCDate() - days);
  return cursor.toISOString().slice(0, 10);
}

function isoDateMinusYears(date: string, years: number): string {
  const cursor = new Date(`${date}T00:00:00Z`);
  cursor.setUTCFullYear(cursor.getUTCFullYear() - years);
  return cursor.toISOString().slice(0, 10);
}

describe('adminAutoFillSchedule with full stock', () => {
  beforeEach(async () => {
    await applySchema(env.DB);
    for (const length of SCHEDULED_WORD_LENGTHS) {
      await insertWords(length, EXPECTED_DAYS);
    }
  });

  it.each(SCHEDULED_WORD_LENGTHS)(`should schedule ${EXPECTED_DAYS} days for length %i when stock covers every day (006-AE2)`, async (length) => {
    await adminAutoFillSchedule(env.DB, FROM, TO);

    const row = await env.DB
      .prepare('SELECT COUNT(*) as count FROM daily_words WHERE date >= ? AND date <= ? AND length = ?')
      .bind(FROM, TO, length)
      .first<{ count: number }>();
    expect(row?.count).toBe(EXPECTED_DAYS);
  });

  it('should not schedule a user-submitted word when filling the schedule', async () => {
    // status/family_safe are 'approved'/1 (not 'draft'/0): the words CHECK no longer has
    // a source = 'user' escape (0003_drop_removed_features.sql), so an active row must be
    // approved and family-safe regardless of source. autoFillLength must still exclude
    // source = 'user' on its own merits.
    await env.DB
      .prepare(
        `INSERT INTO words (word, length, source, license, status, family_safe, is_active)
         VALUES ('KULLA', 5, 'user', 'user-submitted', 'approved', 1, 1)`
      )
      .run();

    await adminAutoFillSchedule(env.DB, FROM, TO);

    const row = await env.DB
      .prepare(
        `SELECT COUNT(*) as count FROM daily_words dw JOIN words w ON w.id = dw.word_id
         WHERE w.source = 'user'`
      )
      .first<{ count: number }>();
    expect(row?.count).toBe(0);
  });

  it('should not schedule an unlimited-pool word when filling the schedule', async () => {
    await env.DB
      .prepare(
        `INSERT INTO words (word, length, source, license, status, family_safe, is_active, pool)
         VALUES ('UNLTD', 5, 'test', 'test', 'approved', 1, 1, 'unlimited')`
      )
      .run();

    await adminAutoFillSchedule(env.DB, FROM, TO);

    const row = await env.DB
      .prepare(
        `SELECT COUNT(*) as count FROM daily_words dw JOIN words w ON w.id = dw.word_id
         WHERE w.pool = 'unlimited'`
      )
      .first<{ count: number }>();
    expect(row?.count).toBe(0);
  });
});

describe('adminAutoFillSchedule stock exhaustion (R3, AE4)', () => {
  beforeEach(async () => {
    await applySchema(env.DB);
  });

  it('should never repeat a word inside one fill and leave dates empty once stock runs out', async () => {
    await insertWords(5, 2);

    await adminAutoFillSchedule(env.DB, FROM, TO);

    const row = await env.DB
      .prepare('SELECT COUNT(DISTINCT word_id) as words, COUNT(*) as days FROM daily_words WHERE length = 5')
      .first<{ words: number; days: number }>();
    expect(row?.days).toBe(2);
    expect(row?.words).toBe(2);
  });

  it('should match AE4: two eligible words across five empty dates schedules two and leaves three empty (008-AE4)', async () => {
    await insertWords(5, 3);
    const wordA = await wordIdFor('BAAAA');
    const wordB = await wordIdFor('CAAAA');
    // wordC ('DAAAA') is never used and stays eligible.

    await scheduleDay(wordA, isoDateMinusYears(FROM, 2), 5);
    await scheduleDay(wordB, isoDateMinusYears(FROM, 4), 5);

    await adminAutoFillSchedule(env.DB, FROM, TO);

    const filled = await env.DB
      .prepare('SELECT COUNT(*) as count FROM daily_words WHERE length = 5 AND date >= ? AND date <= ?')
      .bind(FROM, TO)
      .first<{ count: number }>();
    expect(filled?.count).toBe(2);

    const usedWordA = await env.DB
      .prepare('SELECT COUNT(*) as count FROM daily_words WHERE length = 5 AND word_id = ? AND date >= ? AND date <= ?')
      .bind(wordA, FROM, TO)
      .first<{ count: number }>();
    expect(usedWordA?.count).toBe(0);
  });
});

describe('adminAutoFillSchedule repeat cooldown (R3, AE4)', () => {
  beforeEach(async () => {
    await applySchema(env.DB);
  });

  it('should not schedule a word that answered this length within the cooldown window', async () => {
    await insertWords(5, 1);
    const recentWord = await wordIdFor('BAAAA');
    await scheduleDay(recentWord, '2024-06-01', 5);

    await adminAutoFillSchedule(env.DB, FROM, TO);

    const row = await env.DB
      .prepare('SELECT COUNT(*) as count FROM daily_words WHERE length = 5 AND date >= ? AND date <= ?')
      .bind(FROM, TO)
      .first<{ count: number }>();
    expect(row?.count).toBe(0);
  });

  it('should schedule a word that answered this length more than the cooldown window ago', async () => {
    await insertWords(5, 1);
    const oldWord = await wordIdFor('BAAAA');
    await scheduleDay(oldWord, '2020-01-01', 5);

    await adminAutoFillSchedule(env.DB, FROM, TO);

    const row = await env.DB
      .prepare('SELECT COUNT(*) as count FROM daily_words WHERE length = 5 AND date >= ? AND date <= ?')
      .bind(FROM, TO)
      .first<{ count: number }>();
    expect(row?.count).toBe(1);
  });

  it('should not schedule a word on the target date when it was used exactly ANSWER_REPEAT_COOLDOWN_DAYS before it', async () => {
    await insertWords(5, 1);
    const wordId = await wordIdFor('BAAAA');
    await scheduleDay(wordId, isoDateMinusDays(FROM, ANSWER_REPEAT_COOLDOWN_DAYS), 5);

    await adminAutoFillSchedule(env.DB, FROM, FROM);

    const row = await env.DB
      .prepare('SELECT COUNT(*) as count FROM daily_words WHERE length = 5 AND date = ?')
      .bind(FROM)
      .first<{ count: number }>();
    expect(row?.count).toBe(0);
  });

  it('should schedule a word on the target date when it was used ANSWER_REPEAT_COOLDOWN_DAYS + 1 days before it', async () => {
    await insertWords(5, 1);
    const wordId = await wordIdFor('BAAAA');
    await scheduleDay(wordId, isoDateMinusDays(FROM, ANSWER_REPEAT_COOLDOWN_DAYS + 1), 5);

    await adminAutoFillSchedule(env.DB, FROM, FROM);

    const row = await env.DB
      .prepare('SELECT COUNT(*) as count FROM daily_words WHERE length = 5 AND date = ?')
      .bind(FROM)
      .first<{ count: number }>();
    expect(row?.count).toBe(1);
  });

  it('should not pick a word for another date when it is already scheduled on a future date', async () => {
    await insertWords(5, 1);
    const wordId = await wordIdFor('BAAAA');
    await scheduleDay(wordId, '2030-01-01', 5);

    await adminAutoFillSchedule(env.DB, FROM, TO);

    const row = await env.DB
      .prepare('SELECT COUNT(*) as count FROM daily_words WHERE length = 5 AND date >= ? AND date <= ?')
      .bind(FROM, TO)
      .first<{ count: number }>();
    expect(row?.count).toBe(0);
  });
});

describe('adminAutoFillSchedule per-length isolation', () => {
  beforeEach(async () => {
    await applySchema(env.DB);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should still fill the other lengths when one length throws', async () => {
    await insertWords(5, EXPECTED_DAYS);
    await insertWords(6, EXPECTED_DAYS);
    // Fail only the first db.batch() call (length 4, run first) to prove it does not
    // stop lengths 5 and 6 from being filled.
    vi.spyOn(env.DB, 'batch').mockImplementationOnce(() => Promise.reject(new Error('boom')));

    await adminAutoFillSchedule(env.DB, FROM, TO);

    const fiveRow = await env.DB
      .prepare('SELECT COUNT(*) as count FROM daily_words WHERE length = 5 AND date >= ? AND date <= ?')
      .bind(FROM, TO)
      .first<{ count: number }>();
    expect(fiveRow?.count).toBe(EXPECTED_DAYS);

    const sixRow = await env.DB
      .prepare('SELECT COUNT(*) as count FROM daily_words WHERE length = 6 AND date >= ? AND date <= ?')
      .bind(FROM, TO)
      .first<{ count: number }>();
    expect(sixRow?.count).toBe(EXPECTED_DAYS);
  });
});
