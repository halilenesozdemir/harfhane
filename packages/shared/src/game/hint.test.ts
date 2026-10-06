import { describe, it, expect } from 'vitest';
import {
  FREE_DAILY_HINTS,
  FREE_UNLIMITED_HINTS,
  SUPPORTER_DAILY_HINTS,
  SUPPORTER_UNLIMITED_HINTS,
  hintAllowance,
  pickHint,
} from './hint';

describe('pickHint', () => {
  it('should reveal L at position 2 when the answer is KALEM and K and A are green (008-AE7)', () => {
    const hint = pickHint('KALEM', ['KAPAK'], []);
    expect(hint).toEqual({ position: 2, letter: 'L' });
  });

  it('should reveal the first position when there are no guesses yet', () => {
    expect(pickHint('KALEM', [], [])).toEqual({ position: 0, letter: 'K' });
  });

  it('should skip positions already revealed when a second hint is picked', () => {
    expect(pickHint('KALEM', ['KAPAK'], [2])).toEqual({ position: 3, letter: 'E' });
  });

  it('should skip a position solved in any earlier guess when later guesses miss it', () => {
    expect(pickHint('KALEM', ['ZZLZZ', 'KZZZZ'], [])).toEqual({ position: 1, letter: 'A' });
  });

  it('should not treat a present letter as solved when it is in the wrong position', () => {
    expect(pickHint('KALEM', ['AKZZZ'], [])).toEqual({ position: 0, letter: 'K' });
  });

  it('should return null when every position is solved or revealed', () => {
    expect(pickHint('KALEM', ['KALZZ'], [3, 4])).toBeNull();
  });

  it('should keep Turkish letters intact when the answer contains İ and I', () => {
    expect(pickHint('KIRIŞ', ['KZZZZ'], [])).toEqual({ position: 1, letter: 'I' });
    expect(pickHint('İPLİK', [], [])).toEqual({ position: 0, letter: 'İ' });
  });
});

describe('hintAllowance', () => {
  it('should give free players one daily hint and none in unlimited', () => {
    expect(hintAllowance('daily', false)).toBe(1);
    expect(hintAllowance('unlimited', false)).toBe(0);
  });

  it('should give supporters three daily hints and one per unlimited game', () => {
    expect(hintAllowance('daily', true)).toBe(3);
    expect(hintAllowance('unlimited', true)).toBe(1);
  });

  it('should match the allowance agreed by the owner when reading the constants', () => {
    expect([FREE_DAILY_HINTS, FREE_UNLIMITED_HINTS, SUPPORTER_DAILY_HINTS, SUPPORTER_UNLIMITED_HINTS]).toEqual([
      1, 0, 3, 1,
    ]);
  });
});
