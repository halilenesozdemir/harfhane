import { describe, it, expect } from 'vitest';
import { evaluateGuess, normalizeWord } from './evaluate';

describe('evaluateGuess', () => {
  it('should mark correct letters in correct positions', () => {
    const result = evaluateGuess('KELME', 'KELME');
    expect(result).toEqual(['correct', 'correct', 'correct', 'correct', 'correct']);
  });

  it('should mark present letters in wrong positions', () => {
    const result = evaluateGuess('EKLME', 'KELME');
    expect(result[0]).toBe('present');
    expect(result[1]).toBe('present');
  });

  it('should mark absent letters not in solution', () => {
    const result = evaluateGuess('ZZZZZ', 'KELME');
    expect(result).toEqual(['absent', 'absent', 'absent', 'absent', 'absent']);
  });

  it('should not double-count repeated letters', () => {
    const result = evaluateGuess('AABBB', 'AACCC');
    expect(result[0]).toBe('correct');
    expect(result[1]).toBe('correct');
    expect(result[2]).toBe('absent');
  });
});

describe('normalizeWord', () => {
  it('should convert Turkish i to İ', () => {
    expect(normalizeWord('iyi')).toBe('İYİ');
  });

  it('should convert Turkish ı to I', () => {
    expect(normalizeWord('ışık')).toBe('IŞIK');
  });

  it('should convert standard letters correctly', () => {
    expect(normalizeWord('kelime')).toBe('KELİME');
  });
});
