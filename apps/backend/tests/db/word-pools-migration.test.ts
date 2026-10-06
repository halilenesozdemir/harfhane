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
  it('defaults new words to the daily pool', async () => {
    await env.DB.prepare(
      `INSERT INTO words (word, length, source, license, status, family_safe, is_active)
       VALUES ('KARGA', 5, 'test', 'test', 'approved', 1, 1)`
    ).run();

    const row = await env.DB.prepare('SELECT pool FROM words WHERE word = ?').bind('KARGA').first<{ pool: string }>();
    expect(row?.pool).toBe('daily');
  });

  it('rejects a pool value outside daily/unlimited', async () => {
    await expect(insertWord({ word: 'YANLI', pool: 'other' })).rejects.toThrow();
  });
});

describe('daily_words_require_active_word trigger', () => {
  it('allows scheduling an approved, family-safe, active, daily-pool word', async () => {
    const wordId = await insertWord({ word: 'DOGRU', pool: 'daily' });

    await expect(
      env.DB.prepare('INSERT INTO daily_words (word_id, date, length) VALUES (?, ?, 5)')
        .bind(wordId, '2026-03-01')
        .run()
    ).resolves.toBeDefined();
  });

  it('rejects scheduling an unlimited-pool word', async () => {
    const wordId = await insertWord({ word: 'SINIR', pool: 'unlimited' });

    await expect(
      env.DB.prepare('INSERT INTO daily_words (word_id, date, length) VALUES (?, ?, 5)')
        .bind(wordId, '2026-03-02')
        .run()
    ).rejects.toThrow();
  });

  it('still rejects a draft word regardless of pool', async () => {
    // source='user' so the table CHECK permits is_active=1 without status='approved'.
    const wordId = await insertWord({ word: 'TASLA', status: 'draft', pool: 'daily', source: 'user' });

    await expect(
      env.DB.prepare('INSERT INTO daily_words (word_id, date, length) VALUES (?, ?, 5)')
        .bind(wordId, '2026-03-03')
        .run()
    ).rejects.toThrow();
  });

  it('still rejects a word that is not family-safe regardless of pool', async () => {
    const wordId = await insertWord({ word: 'ACIMA', familySafe: 0, pool: 'daily', source: 'user' });

    await expect(
      env.DB.prepare('INSERT INTO daily_words (word_id, date, length) VALUES (?, ?, 5)')
        .bind(wordId, '2026-03-04')
        .run()
    ).rejects.toThrow();
  });

  it('still rejects an inactive word regardless of pool', async () => {
    const wordId = await insertWord({ word: 'ARASI', isActive: 0, pool: 'daily' });

    await expect(
      env.DB.prepare('INSERT INTO daily_words (word_id, date, length) VALUES (?, ?, 5)')
        .bind(wordId, '2026-03-05')
        .run()
    ).rejects.toThrow();
  });
});
