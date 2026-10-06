import fc from 'fast-check';
import { describe, it, expect } from 'vitest';
import { evaluateGuess, normalizeChar, normalizeWord } from './evaluate';
import { turkishWordArb, turkishWordOfLengthArb } from './turkish-arbitraries';
import type { TileStatus } from './types';

const FC_OPTIONS = { numRuns: 50, seed: 42 };

describe('normalizeChar / normalizeWord property tests', () => {
  it('should remain unchanged when normalizing an already-normalized word (009-AE5)', () => {
    fc.assert(
      fc.property(turkishWordArb(), (word) => {
        const normalized = normalizeWord(word);
        expect(normalizeWord(normalized)).toBe(normalized);
      }),
      FC_OPTIONS
    );
  });

  it('should map dotted and dotless i per Turkish casing rules for any surrounding word (009-AE5)', () => {
    const expectedMap: Record<string, string> = { i: 'İ', ı: 'I', İ: 'İ', I: 'I' };
    fc.assert(
      fc.property(fc.constantFrom('i', 'ı', 'İ', 'I'), (char) => {
        expect(normalizeChar(char)).toBe(expectedMap[char]);
      }),
      FC_OPTIONS
    );
  });

  it('should preserve string length when normalizing any word of Turkish letters', () => {
    fc.assert(
      fc.property(turkishWordArb(), (word) => {
        expect(normalizeWord(word).length).toBe(word.length);
      }),
      FC_OPTIONS
    );
  });

  it('should diverge from locale-insensitive toUpperCase when a word contains dotted lowercase i', () => {
    fc.assert(
      fc.property(turkishWordArb(0, 9), (rest) => {
        const word = `i${rest}`;
        expect(normalizeWord(word)).not.toBe(word.toUpperCase());
      }),
      FC_OPTIONS
    );
  });
});

describe('evaluateGuess property tests', () => {
  it('should mark every tile correct when guessing the answer against itself', () => {
    fc.assert(
      fc.property(turkishWordArb(1, 8), (word) => {
        const result = evaluateGuess(word, word);
        expect(result).toEqual(Array(word.length).fill('correct'));
      }),
      FC_OPTIONS
    );
  });

  it('should return a result array whose length equals the guess length', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 7 }).chain((length) => fc.tuple(turkishWordOfLengthArb(length), turkishWordOfLengthArb(length))), ([guess, solution]) => {
        expect(evaluateGuess(guess, solution)).toHaveLength(guess.length);
      }),
      FC_OPTIONS
    );
  });

  it('should never count a letter as correct+present more times than it appears in the answer', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 7 }).chain((length) => fc.tuple(turkishWordOfLengthArb(length), turkishWordOfLengthArb(length))),
        ([guess, solution]) => {
          const result = evaluateGuess(guess, solution);
          const solutionCounts: Record<string, number> = {};
          solution.split('').forEach((char) => {
            solutionCounts[char] = (solutionCounts[char] ?? 0) + 1;
          });

          const matchedCounts: Record<string, number> = {};
          guess.split('').forEach((char, i) => {
            const status: TileStatus = result[i] ?? null;
            if (status === 'correct' || status === 'present') {
              matchedCounts[char] = (matchedCounts[char] ?? 0) + 1;
            }
          });

          Object.entries(matchedCounts).forEach(([char, count]) => {
            expect(count).toBeLessThanOrEqual(solutionCounts[char] ?? 0);
          });
        }
      ),
      FC_OPTIONS
    );
  });

  it('should never mark absent when the guess is a permutation of the answer', () => {
    fc.assert(
      fc.property(
        turkishWordArb(2, 8).chain((word) =>
          fc
            .shuffledSubarray(word.split(''), { minLength: word.length, maxLength: word.length })
            .map((chars) => ({ word, guess: chars.join('') }))
        ),
        ({ word, guess }) => {
          const result = evaluateGuess(guess, word);
          expect(result).not.toContain('absent');
        }
      ),
      FC_OPTIONS
    );
  });
});
