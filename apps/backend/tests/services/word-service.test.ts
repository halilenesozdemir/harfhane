import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { env } from 'cloudflare:test';
import { parseTurkeyDate, type TurkeyDate } from '@harfhane/shared';
import { getDailyWord, getPlayableLengths, getRandomWord, validateWord } from '../../src/services/word-service';
import { ApiError } from '../../src/errors/api-error';
import { applySchema, seedTestData } from '../helpers/db';

beforeAll(async () => {
  await applySchema(env.DB);
  await seedTestData(env.DB);
});

// Test-only helper: these fixture dates are always valid, so throwing on an
// unexpected null keeps the call sites below as plain `td('2026-01-01')`
// instead of repeating a null check at every call.
function td(value: string): TurkeyDate {
  const parsed = parseTurkeyDate(value);
  if (parsed === null) throw new Error(`invalid fixture date: ${value}`);
  return parsed;
}

describe('getDailyWord', () => {
  it('returns the daily word for a valid date', async () => {
    const result = await getDailyWord(env.DB, td('2026-01-01'));
    expect(result.word.word).toBe('KİTAP');
    expect(result.date).toBe('2026-01-01');
    expect(result.gameNumber).toBe(1);
  });

  it('throws NOT_FOUND for a date with no word', async () => {
    await expect(getDailyWord(env.DB, td('2025-06-01'))).rejects.toBeInstanceOf(ApiError);
    await expect(getDailyWord(env.DB, td('2025-06-01'))).rejects.toMatchObject({
      code: 'NOT_FOUND',
      statusCode: 404,
    });
  });

  // A malformed or calendar-impossible date can no longer reach this service:
  // `date` is `TurkeyDate`, constructed only by `parseTurkeyDate`. The
  // rejection itself is covered by packages/shared/src/types/branded-types.test.ts
  // and the route-level 400 by apps/backend/tests/routes/words.test.ts
  // ('returns 400 with BAD_REQUEST for an impossible calendar date'); the
  // compile-time guarantee is proved by strict-flags.types.test.ts (010-AE2).

  describe('explicit future dates', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('should throw NOT_FOUND when the requested date is after the Turkey day', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-12-31T12:00:00Z'));

      await expect(getDailyWord(env.DB, td('2026-01-01'))).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });

    it('should return the word when the requested date is the Turkey day', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-12-31T21:00:00Z'));

      const result = await getDailyWord(env.DB, td('2026-01-01'));

      expect(result.word.word).toBe('KİTAP');
    });
  });

  describe('no-args path at the Turkey midnight boundary', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('throws NOT_FOUND just before the Turkey midnight crossover into 2026-01-01', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-12-31T20:59:00Z'));

      await expect(getDailyWord(env.DB)).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });

    it("matches getTodayString()'s roll-over to 2026-01-01 right at the 21:00 UTC crossover", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-12-31T21:00:00Z'));

      const result = await getDailyWord(env.DB);

      expect(result.date).toBe('2026-01-01');
      expect(result.word.word).toBe('KİTAP');
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

describe('getPlayableLengths', () => {
  it('returns the parsed lengths from the var', () => {
    expect(getPlayableLengths('4,6')).toEqual({ lengths: [4, 6] });
  });

  it('falls back to [5] when the var is missing', () => {
    expect(getPlayableLengths(undefined)).toEqual({ lengths: [5] });
  });
});
