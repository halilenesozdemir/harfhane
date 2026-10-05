import { describe, it, expect, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';
import { applySchema } from '../helpers/db';
import { adminAutoFillSchedule } from '../../src/repositories/admin-repository';
import { ACTIVE_WORD_LENGTHS } from '../../src/constants/schedule';

const FROM = '2026-02-01';
const TO = '2026-02-05';
const EXPECTED_DAYS = 5;

beforeEach(async () => {
  await applySchema(env.DB);
  for (const length of ACTIVE_WORD_LENGTHS) {
    const word = 'A'.repeat(length);
    await env.DB
      .prepare(
        `INSERT INTO words (word, length, source, license, status, family_safe, is_active)
         VALUES (?, ?, 'test', 'test', 'approved', 1, 1)`
      )
      .bind(word, length)
      .run();
  }
});

describe('adminAutoFillSchedule', () => {
  it.each(ACTIVE_WORD_LENGTHS)('schedules %i days for length %i', async (length) => {
    await adminAutoFillSchedule(env.DB, FROM, TO);

    const row = await env.DB
      .prepare('SELECT COUNT(*) as count FROM daily_words WHERE date >= ? AND date <= ? AND length = ?')
      .bind(FROM, TO, length)
      .first<{ count: number }>();
    expect(row?.count).toBe(EXPECTED_DAYS);
  });
});
