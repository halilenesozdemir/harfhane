import { describe, expect, it } from 'vitest';
import { dailyGameNumber, selectResultMessage } from './gameOverMessages';

describe('dailyGameNumber', () => {
  it('should match the backend formula when given the same Turkey-day date string', () => {
    // apps/backend/src/repositories/word-repository.ts computes the same value for "2026-01-01".
    expect(dailyGameNumber('2026-01-01')).toBe(1);
  });

  it('should increase by one for the following Turkey day', () => {
    const first = dailyGameNumber('2026-01-01');
    const second = dailyGameNumber('2026-01-02');
    expect(second).toBe(first + 1);
  });
});

describe('selectResultMessage', () => {
  it('should return the same win variant for the same guess count and seed every time', () => {
    const first = selectResultMessage('won', 3, 7);
    const second = selectResultMessage('won', 3, 7);
    expect(first).toBe(second);
  });

  it('should return a different win variant when the seed changes to a different remainder', () => {
    const variants = new Set<string>();
    for (let seed = 0; seed < 3; seed += 1) {
      variants.add(selectResultMessage('won', 3, seed));
    }
    expect(variants.size).toBeGreaterThan(1);
  });

  it('should fall back to a generic win message when the guess count is out of range', () => {
    expect(selectResultMessage('won', 0, 0)).toBe('Tebrikler!');
  });

  it('should pick a loss variant deterministically when the game is lost', () => {
    const first = selectResultMessage('lost', 6, 5);
    const second = selectResultMessage('lost', 6, 5);
    expect(first).toBe(second);
  });

  it('should normalize a negative seed into a valid variant index', () => {
    expect(() => selectResultMessage('won', 3, -1)).not.toThrow();
  });
});
