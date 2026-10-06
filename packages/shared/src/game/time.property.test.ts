import fc from 'fast-check';
import { describe, it, expect } from 'vitest';
import { getGameNumber, getTodayString } from './time';

const FC_OPTIONS = { numRuns: 50, seed: 42 };

const MS_PER_SECOND = 1000;
const MS_PER_MINUTE = MS_PER_SECOND * 60;
const MS_PER_HOUR = MS_PER_MINUTE * 60;
const MS_PER_DAY = MS_PER_HOUR * 24;
const SECONDS_BEFORE_BOUNDARY = 20 * MS_PER_HOUR + 59 * MS_PER_MINUTE + 59 * MS_PER_SECOND;
const SECONDS_AT_BOUNDARY = 21 * MS_PER_HOUR;

const isoDate = (date: Date): string => date.toISOString().split('T')[0]!;

// Any UTC midnight within a wide range, used as the base calendar day for the boundary check.
const utcMidnightArb = fc
  .date({ min: new Date(Date.UTC(2020, 0, 1)), max: new Date(Date.UTC(2035, 11, 31)) })
  .map((date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())));

describe('Turkey-day boundary property tests', () => {
  it('should map 20:59:59Z and 21:00:00Z on the same UTC day to consecutive Turkey calendar days for any date', () => {
    fc.assert(
      fc.property(utcMidnightArb, (baseUtcMidnight) => {
        const justBeforeBoundary = new Date(baseUtcMidnight.getTime() + SECONDS_BEFORE_BOUNDARY);
        const atBoundary = new Date(baseUtcMidnight.getTime() + SECONDS_AT_BOUNDARY);
        const nextUtcDay = new Date(baseUtcMidnight.getTime() + MS_PER_DAY);

        expect(getTodayString(justBeforeBoundary)).toBe(isoDate(baseUtcMidnight));
        expect(getTodayString(atBoundary)).toBe(isoDate(nextUtcDay));
      }),
      FC_OPTIONS
    );
  });

  it('should increment the game number by exactly one across the 21:00Z Turkey-day boundary for any date', () => {
    fc.assert(
      fc.property(utcMidnightArb, (baseUtcMidnight) => {
        const justBeforeBoundary = new Date(baseUtcMidnight.getTime() + SECONDS_BEFORE_BOUNDARY);
        const atBoundary = new Date(baseUtcMidnight.getTime() + SECONDS_AT_BOUNDARY);

        expect(getGameNumber(atBoundary) - getGameNumber(justBeforeBoundary)).toBe(1);
      }),
      FC_OPTIONS
    );
  });
});
