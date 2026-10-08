import { describe, it, expect, beforeAll } from 'vitest';
import { env } from 'cloudflare:test';
import { getGameNumber } from '@harfhane/shared';
import {
  findDailyWord,
  findRandomWord,
  wordExists,
} from '../../src/repositories/word-repository';
import { applySchema, seedTestData } from '../helpers/db';

beforeAll(async () => {
  await applySchema(env.DB);
  await seedTestData(env.DB);

  await env.DB.prepare(
    `INSERT INTO words
      (word, meaning, context, category, length, source, license, status, family_safe, is_active)
     VALUES
      ('KUZGUN', 'Kuzgun kuşu', 'Kuzgun uçtu.', 'isim', 6, 'user', 'user-submitted', 'draft', 0, 1)`
  ).run();
});

describe('findDailyWord', () => {
  it('returns word and gameNumber for a valid date', async () => {
    const result = await findDailyWord(env.DB, '2026-01-01');
    expect(result).not.toBeNull();
    expect(result!.word).toBe('KİTAP');
    expect(result!.meaning).toBe('Yazılı eser');
    expect(result!.gameNumber).toBe(1);
  });

  it('returns second word with correct gameNumber', async () => {
    const result = await findDailyWord(env.DB, '2026-01-02');
    expect(result).not.toBeNull();
    expect(result!.word).toBe('KALEM');
    expect(result!.gameNumber).toBe(2);
  });

  it('returns null for a date with no daily word', async () => {
    const result = await findDailyWord(env.DB, '2025-01-01');
    expect(result).toBeNull();
  });

  it('should compute gameNumber from the Turkey calendar date, not from counting scheduled rows', async () => {
    // Only 3 rows ever exist in daily_words in this test DB, but a word scheduled
    // ~100 days after the game epoch must still report a gameNumber in the hundreds —
    // proof that gameNumber comes from the shared date-based clock (Plan 001 cutover:
    // a fresh database must not reset gameNumber to a small row count).
    const futureDate = '2026-04-10';
    await env.DB.prepare(
      `INSERT INTO words (word, meaning, context, category, length, source, license, status, family_safe, is_active)
       VALUES ('TAVUK', 'Kümes hayvanı', 'Tavuk yumurtladı.', 'isim', 5, 'test', 'test', 'approved', 1, 1)`
    ).run();
    await env.DB.prepare(
      `INSERT INTO daily_words (word_id, date, length)
       SELECT id, ?, 5 FROM words WHERE word = 'TAVUK'`
    )
      .bind(futureDate)
      .run();

    const result = await findDailyWord(env.DB, futureDate);
    expect(result).not.toBeNull();
    expect(result!.gameNumber).toBe(getGameNumber(new Date(`${futureDate}T12:00:00Z`)));
    expect(result!.gameNumber).toBeGreaterThan(3);
  });
});

describe('findRandomWord', () => {
  it('returns an active word', async () => {
    const result = await findRandomWord(env.DB);
    expect(result).not.toBeNull();
    expect(result!.entry.word).toBeDefined();
    expect(['isim', 'sıfat', 'fiil']).toContain(result!.entry.category);
  });

  it('never returns an unmoderated user-submitted word', async () => {
    const result = await findRandomWord(env.DB, 6);
    expect(result).toBeNull();
  });

  it('should draw from the unlimited pool when no daily-pool word exists for that length', async () => {
    await env.DB.prepare(
      `INSERT INTO words
        (word, meaning, context, category, length, source, license, status, family_safe, is_active, pool)
       VALUES
        ('TABANCA', '', '', 'isim', 7, 'test', 'test', 'approved', 1, 1, 'unlimited')`
    ).run();

    const result = await findRandomWord(env.DB, 7);
    expect(result).not.toBeNull();
    expect(result!.entry.word).toBe('TABANCA');
  });
});

describe('wordExists', () => {
  it('returns true for an existing active word', async () => {
    const result = await wordExists(env.DB, 'KİTAP');
    expect(result).toBe(true);
  });

  it('returns true for lowercase input (normalised to uppercase)', async () => {
    const result = await wordExists(env.DB, 'kitap');
    expect(result).toBe(true);
  });

  it('returns false for a non-existent word', async () => {
    const result = await wordExists(env.DB, 'YOKTUR');
    expect(result).toBe(false);
  });
});
