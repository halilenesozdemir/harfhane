import { describe, it, expect } from 'vitest';
import { getTodayString, getTimeUntilMidnight, getGameNumber } from './time';

describe('getTodayString', () => {
  it('should return the previous UTC day when it is 20:59 UTC on a Turkey calendar day', () => {
    const now = new Date('2026-06-14T20:59:00Z');
    expect(getTodayString(now)).toBe('2026-06-14');
  });

  it('should roll over to the next day at 21:00 UTC, the Turkey midnight crossover', () => {
    const now = new Date('2026-06-14T21:00:00Z');
    expect(getTodayString(now)).toBe('2026-06-15');
  });

  it('should stay on the old year just before the Turkey new year crossover', () => {
    const now = new Date('2026-12-31T20:59:59Z');
    expect(getTodayString(now)).toBe('2026-12-31');
  });

  it('should roll over to the new year at the Turkey midnight crossover', () => {
    const now = new Date('2026-12-31T21:00:00Z');
    expect(getTodayString(now)).toBe('2027-01-01');
  });

  it('should default to the current time when now is omitted', () => {
    expect(getTodayString()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('getTimeUntilMidnight', () => {
  it('should return one minute remaining at 20:59:00 UTC (23:59:00 Turkey time)', () => {
    const now = new Date('2026-06-14T20:59:00Z');
    expect(getTimeUntilMidnight(now)).toEqual({ hours: '00', minutes: '01', seconds: '00' });
  });

  it('should return nearly a full day remaining just after Turkey midnight', () => {
    const now = new Date('2026-06-14T21:00:01Z');
    expect(getTimeUntilMidnight(now)).toEqual({ hours: '23', minutes: '59', seconds: '59' });
  });

  it('should carry the same countdown across the Turkey new year crossover', () => {
    const now = new Date('2026-12-31T20:59:00Z');
    expect(getTimeUntilMidnight(now)).toEqual({ hours: '00', minutes: '01', seconds: '00' });
  });
});

describe('getGameNumber', () => {
  it('should return 0 one millisecond before the Turkey epoch midnight', () => {
    const now = new Date('2025-12-31T20:59:59.999Z');
    expect(getGameNumber(now)).toBe(0);
  });

  it('should return 1 exactly at the Turkey epoch midnight (2026-01-01 00:00 TR)', () => {
    const now = new Date('2025-12-31T21:00:00Z');
    expect(getGameNumber(now)).toBe(1);
  });

  it('should increment consistently across the Turkey midnight crossover', () => {
    const dayOne = new Date('2026-06-14T20:59:00Z');
    const dayTwo = new Date('2026-06-14T21:00:00Z');
    expect(getGameNumber(dayTwo) - getGameNumber(dayOne)).toBe(1);
  });
});
