import { describe, it, expect, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';
import { applySchema } from '../helpers/db';

async function insertWord(
  overrides: Partial<{
    word: string;
    status: string;
    familySafe: number;
    isActive: number;
    pool: string;
    source: string;
  }> = {}
): Promise<number> {
  const {
    word = 'ELMAS',
    status = 'approved',
    familySafe = 1,
    isActive = 1,
    pool = 'daily',
    source = 'test',
  } = overrides;
  const result = await env.DB.prepare(
    `INSERT INTO words (word, length, source, license, status, family_safe, is_active, pool)
     VALUES (?, ?, ?, 'test', ?, ?, ?, ?)`
  )
    .bind(word, word.length, source, status, familySafe, isActive, pool)
    .run();
  return result.meta.last_row_id as number;
}

beforeEach(async () => {
  await applySchema(env.DB);
});

describe('words.pool column', () => {
  it('should default a new word to the daily pool when pool is not given', async () => {
    await env.DB.prepare(
      `INSERT INTO words (word, length, source, license, status, family_safe, is_active)
       VALUES ('KARGA', 5, 'test', 'test', 'approved', 1, 1)`
    ).run();

    const row = await env.DB.prepare('SELECT pool FROM words WHERE word = ?').bind('KARGA').first<{ pool: string }>();
    expect(row?.pool).toBe('daily');
  });

  it('should reject the insert when pool is outside daily/unlimited', async () => {
    await expect(insertWord({ word: 'YANLI', pool: 'other' })).rejects.toThrow();
  });
});

describe('daily_words_require_active_word trigger', () => {
  it('should allow scheduling when the word is approved, family-safe, active and daily-pool', async () => {
    const wordId = await insertWord({ word: 'DOGRU', pool: 'daily' });

    await expect(
      env.DB.prepare('INSERT INTO daily_words (word_id, date, length) VALUES (?, ?, 5)')
        .bind(wordId, '2026-03-01')
        .run()
    ).resolves.toBeDefined();
  });

  it('should reject scheduling when the word is unlimited-pool', async () => {
    const wordId = await insertWord({ word: 'SINIR', pool: 'unlimited' });

    await expect(
      env.DB.prepare('INSERT INTO daily_words (word_id, date, length) VALUES (?, ?, 5)')
        .bind(wordId, '2026-03-02')
        .run()
    ).rejects.toThrow();
  });

  it('should reject scheduling when the word is inactive regardless of pool', async () => {
    const wordId = await insertWord({ word: 'ARASI', isActive: 0, pool: 'daily' });

    await expect(
      env.DB.prepare('INSERT INTO daily_words (word_id, date, length) VALUES (?, ?, 5)')
        .bind(wordId, '2026-03-05')
        .run()
    ).rejects.toThrow();
  });
});
