import { describe, it, expect } from 'vitest';
import { ALLOWED_WORD_LENGTHS, DEFAULT_WORD_LENGTH, parseWordLength } from './word-length';
import { parseTurkeyDate } from './turkey-date';

describe('parseWordLength', () => {
  it.each(ALLOWED_WORD_LENGTHS)('should return the value when given the allowed length %i', (length) => {
    expect(parseWordLength(length)).toBe(length);
  });

  it('should return null when given a length outside the allowed set', () => {
    expect(parseWordLength(7)).toBeNull();
  });

  it('should return null when given zero', () => {
    expect(parseWordLength(0)).toBeNull();
  });

  it('should return null when given a negative length', () => {
    expect(parseWordLength(-5)).toBeNull();
  });

  it('should return null when given a non-integer length', () => {
    expect(parseWordLength(5.5)).toBeNull();
  });
});

describe('DEFAULT_WORD_LENGTH', () => {
  it('should be an allowed word length', () => {
    expect(ALLOWED_WORD_LENGTHS).toContain(DEFAULT_WORD_LENGTH);
  });
});

describe('parseTurkeyDate', () => {
  it('should return the value when given a valid YYYY-MM-DD date', () => {
    expect(parseTurkeyDate('2026-10-06')).toBe('2026-10-06');
  });

  it('should return the value for the last day of a leap February', () => {
    expect(parseTurkeyDate('2028-02-29')).toBe('2028-02-29');
  });

  it('should return null for a non-leap-year February 29th', () => {
    expect(parseTurkeyDate('2026-02-29')).toBeNull();
  });

  it('should return null for an impossible calendar date', () => {
    expect(parseTurkeyDate('2026-02-30')).toBeNull();
  });

  it('should return null for a malformed date string', () => {
    expect(parseTurkeyDate('not-a-date')).toBeNull();
  });

  it('should return null for a date missing zero-padding', () => {
    expect(parseTurkeyDate('2026-1-6')).toBeNull();
  });

  it('should return null for a date with a slash separator', () => {
    expect(parseTurkeyDate('2026/10/06')).toBeNull();
  });

  it('should return null for an empty string', () => {
    expect(parseTurkeyDate('')).toBeNull();
  });

  it('should return null for a month of 13', () => {
    expect(parseTurkeyDate('2026-13-01')).toBeNull();
  });

  it('should return null for a day of 00', () => {
    expect(parseTurkeyDate('2026-10-00')).toBeNull();
  });

  it('should return null for a valid date with a prefix (anchors must reject a partial match)', () => {
    expect(parseTurkeyDate('x2026-10-06')).toBeNull();
  });

  it('should return null for a valid date with a suffix (anchors must reject a partial match)', () => {
    expect(parseTurkeyDate('2026-10-06x')).toBeNull();
  });

  it('should return null for a valid date embedded on its own line of a longer string', () => {
    expect(parseTurkeyDate('garbage\n2026-10-06\nmore garbage')).toBeNull();
  });
});
