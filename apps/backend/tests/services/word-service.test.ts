import { describe, it, expect, beforeAll } from 'vitest';
import { env } from 'cloudflare:test';
import { getDailyWord, getRandomWord, validateWord } from '../../src/services/word-service';
import { ApiError } from '../../src/errors/api-error';
import { applySchema, seedTestData } from '../helpers/db';

beforeAll(async () => {
  await applySchema(env.DB);
  await seedTestData(env.DB);
});

describe('getDailyWord', () => {
  it('returns the daily word for a valid date', async () => {
    const result = await getDailyWord(env.DB, '2026-01-01');
    expect(result.word.word).toBe('KİTAP');
    expect(result.date).toBe('2026-01-01');
    expect(result.gameNumber).toBe(1);
  });

  it('throws NOT_FOUND for a date with no word', async () => {
    await expect(getDailyWord(env.DB, '2025-06-01')).rejects.toBeInstanceOf(ApiError);
    await expect(getDailyWord(env.DB, '2025-06-01')).rejects.toMatchObject({
      code: 'NOT_FOUND',
      statusCode: 404,
    });
  });

  it('throws INVALID_DATE for a malformed date', async () => {
    await expect(getDailyWord(env.DB, 'not-a-date')).rejects.toMatchObject({
      code: 'INVALID_DATE',
      statusCode: 400,
    });
  });
});

describe('getRandomWord', () => {
  it('returns a word entry', async () => {
    const result = await getRandomWord(env.DB);
    expect(result.word.word).toBeDefined();
    expect(result.word.meaning).toBeDefined();
  });
});

describe('validateWord', () => {
  it('returns isValid true for a known word', async () => {
    const result = await validateWord(env.DB, 'KİTAP');
    expect(result.isValid).toBe(true);
  });

  it('returns isValid false for an unknown word', async () => {
    const result = await validateWord(env.DB, 'YOKTUR');
    expect(result.isValid).toBe(false);
  });

  it('normalises lowercase input', async () => {
    const result = await validateWord(env.DB, 'kalem');
    expect(result.isValid).toBe(true);
  });
});
