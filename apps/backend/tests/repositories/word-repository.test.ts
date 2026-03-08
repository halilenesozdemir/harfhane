import { describe, it, expect, beforeAll } from 'vitest';
import { env } from 'cloudflare:test';
import { findDailyWord, findRandomWord, wordExists } from '../../src/repositories/word-repository';
import { applySchema, seedTestData } from '../helpers/db';

beforeAll(async () => {
  await applySchema(env.DB);
  await seedTestData(env.DB);
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
    expect(result!.word).toBeDefined();
    expect(['isim', 'sıfat', 'fiil']).toContain(result!.category);
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
