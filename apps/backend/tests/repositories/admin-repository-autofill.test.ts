import { describe, it, expect, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';
import { applySchema } from '../helpers/db';
import { adminAutoFillSchedule } from '../../src/repositories/admin-repository';
import { ACTIVE_WORD_LENGTHS } from '../../src/constants/schedule';

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

describe('adminAutoFillSchedule with full stock', () => {
  beforeEach(async () => {
    await applySchema(env.DB);
    for (const length of ACTIVE_WORD_LENGTHS) {
      await insertWords(length, EXPECTED_DAYS);
    }
  });

  it.each(ACTIVE_WORD_LENGTHS)('schedules %i days for length %i when stock covers every day', async (length) => {
    await adminAutoFillSchedule(env.DB, FROM, TO);

    const row = await env.DB
      .prepare('SELECT COUNT(*) as count FROM daily_words WHERE date >= ? AND date <= ? AND length = ?')
      .bind(FROM, TO, length)
      .first<{ count: number }>();
    expect(row?.count).toBe(EXPECTED_DAYS);
  });

  it('should never schedule a user-submitted word when filling the schedule', async () => {
    await env.DB
      .prepare(
        `INSERT INTO words (word, length, source, license, status, family_safe, is_active)
         VALUES ('KULLA', 5, 'user', 'user-submitted', 'draft', 0, 1)`
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

  it('never repeats a word inside one fill, leaving dates empty once stock runs out', async () => {
    await insertWords(5, 2);

    await adminAutoFillSchedule(env.DB, FROM, TO);

    const row = await env.DB
      .prepare('SELECT COUNT(DISTINCT word_id) as words, COUNT(*) as days FROM daily_words WHERE length = 5')
      .first<{ words: number; days: number }>();
    expect(row?.days).toBe(2);
    expect(row?.words).toBe(2);
  });
});

describe('adminAutoFillSchedule repeat cooldown (R3, AE4)', () => {
  beforeEach(async () => {
    await applySchema(env.DB);
  });

  it('never schedules a word that answered this length within the cooldown window', async () => {
    await insertWords(5, 1);
    const recentWord = await env.DB.prepare('SELECT id FROM words WHERE length = 5').first<{ id: number }>();
    await env.DB
      .prepare('INSERT INTO daily_words (word_id, date, length) VALUES (?, ?, 5)')
      .bind(recentWord!.id, '2024-06-01')
      .run();

    await adminAutoFillSchedule(env.DB, FROM, TO);

    const row = await env.DB
      .prepare('SELECT COUNT(*) as count FROM daily_words WHERE length = 5 AND date >= ? AND date <= ?')
      .bind(FROM, TO)
      .first<{ count: number }>();
    expect(row?.count).toBe(0);
  });

  it('schedules a word that answered this length more than the cooldown window ago', async () => {
    await insertWords(5, 1);
    const oldWord = await env.DB.prepare('SELECT id FROM words WHERE length = 5').first<{ id: number }>();
    await env.DB
      .prepare('INSERT INTO daily_words (word_id, date, length) VALUES (?, ?, 5)')
      .bind(oldWord!.id, '2020-01-01')
      .run();

    await adminAutoFillSchedule(env.DB, FROM, TO);

    const row = await env.DB
      .prepare('SELECT COUNT(*) as count FROM daily_words WHERE length = 5 AND date >= ? AND date <= ?')
      .bind(FROM, TO)
      .first<{ count: number }>();
    expect(row?.count).toBe(1);
  });
});
