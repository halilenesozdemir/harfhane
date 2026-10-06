import { describe, it, expect, beforeAll } from 'vitest';
import { env } from 'cloudflare:test';
import {
  findDailyWord,
  findRandomWord,
  findWordById,
  wordExists,
} from '../../src/repositories/word-repository';
import { applySchema, seedTestData } from '../helpers/db';

let userWordId: number;

beforeAll(async () => {
  await applySchema(env.DB);
  await seedTestData(env.DB);

  const userWord = await env.DB.prepare(
    `INSERT INTO words
      (word, meaning, context, category, length, source, license, status, family_safe, is_active)
     VALUES
      ('KUZGUN', 'Kuzgun kuşu', 'Kuzgun uçtu.', 'isim', 6, 'user', 'user-submitted', 'draft', 0, 1)
     RETURNING id`
  ).first<{ id: number }>();
  if (!userWord) throw new Error('Failed to seed user-sourced word');
  userWordId = userWord.id;
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

  it('draws from the unlimited pool when no daily-pool word exists for that length', async () => {
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

describe('findWordById', () => {
  it('returns an active, non-user word by id', async () => {
    const result = await findRandomWord(env.DB, 5);
    expect(result).not.toBeNull();
    const byId = await findWordById(env.DB, result!.id);
    expect(byId).not.toBeNull();
  });

  it('refuses to serve an unmoderated user-submitted word as a challenge answer', async () => {
    const result = await findWordById(env.DB, userWordId);
    expect(result).toBeNull();
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
