import { describe, it, expect } from 'vitest';
import {
  FREE_DAILY_HINTS,
  FREE_UNLIMITED_HINTS,
  SUPPORTER_DAILY_HINTS,
  SUPPORTER_UNLIMITED_HINTS,
  hintAllowance,
  isHintSolved,
  pickHint,
} from './hint';

describe('pickHint', () => {
  it('should reveal L at position 2 when the answer is KALEM and K and A are green', () => {
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
    expect(pickHint('KALEM', ['KZZZZ', 'ZZZZZ'], [])).toEqual({ position: 1, letter: 'A' });
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

describe('isHintSolved', () => {
  it('should return false when the answer is KALEM and no guess has placed K at position 0', () => {
    expect(isHintSolved([], 0, 'K')).toBe(false);
    expect(isHintSolved(['ZZZZZ'], 0, 'K')).toBe(false);
  });

  it('should return true when a submitted guess places K at position 0', () => {
    expect(isHintSolved(['KALEM'], 0, 'K')).toBe(true);
  });

  it('should return false when the letter appears in the guess but at a different position', () => {
    expect(isHintSolved(['AKZZZ'], 0, 'K')).toBe(false);
  });

  it('should return true when any earlier guess solved the position, not only the latest one', () => {
    expect(isHintSolved(['KZZZZ', 'ZZZZZ'], 0, 'K')).toBe(true);
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
