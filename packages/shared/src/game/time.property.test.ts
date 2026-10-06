import fc from 'fast-check';
import { describe, it, expect } from 'vitest';
import { getGameNumber, getTimeUntilMidnight, getTodayString } from './time';

const NUM_RUNS = 500;

const MS_PER_SECOND = 1000;
const MS_PER_MINUTE = MS_PER_SECOND * 60;
const MS_PER_HOUR = MS_PER_MINUTE * 60;
const MS_PER_DAY = MS_PER_HOUR * 24;
const TURKEY_OFFSET_MS = MS_PER_HOUR * 3;

// Whole-second instants across a wide range. Aligning to whole seconds means
// the countdown's floored hours/minutes/seconds reconstruct to the exact
// remaining ms (no sub-second rounding loss), so the boundary checks below
// are exact rather than occasionally flaky around a day crossover.
const wholeSecondInstantArb = fc
  .integer({ min: Date.UTC(2015, 0, 1), max: Date.UTC(2040, 11, 31) })
  .map((ts) => ts - (ts % MS_PER_SECOND));

const countdownToMs = (countdown: { hours: string; minutes: string; seconds: string }): number =>
  (Number(countdown.hours) * MS_PER_HOUR +
    Number(countdown.minutes) * MS_PER_MINUTE +
    Number(countdown.seconds) * MS_PER_SECOND);

// An independent model of the Turkey calendar day index, used to check
// getGameNumber's day arithmetic without reusing its own GAME_START anchor.
const turkeyDayIndex = (ts: number): number => Math.floor((ts + TURKEY_OFFSET_MS) / MS_PER_DAY);

describe('Turkey-day boundary property tests', () => {
  it('should land exactly on the next Turkey calendar day after waiting out the countdown, and stay on today one second earlier, for any instant', () => {
    fc.assert(
      fc.property(wholeSecondInstantArb, (ts) => {
        const now = new Date(ts);
        const todayStr = getTodayString(now);
        const countdownMs = countdownToMs(getTimeUntilMidnight(now));

        const atNextMidnight = new Date(ts + countdownMs);
        const oneSecondEarlier = new Date(ts + countdownMs - MS_PER_SECOND);

        expect(getTodayString(oneSecondEarlier)).toBe(todayStr);
        expect(Date.parse(getTodayString(atNextMidnight)) - Date.parse(todayStr)).toBe(MS_PER_DAY);
      }),
      { numRuns: NUM_RUNS }
    );
  });

  it('should make getGameNumber differences equal the Turkey calendar day difference for any two instants', () => {
    fc.assert(
      fc.property(wholeSecondInstantArb, wholeSecondInstantArb, (a, b) => {
        const actualDiff = getGameNumber(new Date(a)) - getGameNumber(new Date(b));
        const expectedDiff = turkeyDayIndex(a) - turkeyDayIndex(b);
        expect(actualDiff).toBe(expectedDiff);
      }),
      { numRuns: NUM_RUNS }
    );
  });
});
