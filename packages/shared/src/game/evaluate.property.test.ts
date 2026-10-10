import fc from 'fast-check';
import { describe, it, expect } from 'vitest';
import { evaluateGuess, normalizeWord } from './evaluate';
import {
  biasedWordPairArb,
  turkishMixedCaseWordArb,
  turkishWordArb,
} from './turkish-arbitraries.test-utils';
import type { TileStatus } from './types';

const NUM_RUNS = 500;

// An independently written two-pass reference model: correct positions are
// found first and removed from the pool before present/absent is decided,
// but using a "leftover" tally instead of evaluateGuess's "decrement a full
// count" approach, so it is not just a copy-paste of the implementation.
const evaluateGuessReferenceModel = (guess: string, solution: string): TileStatus[] => {
  const guessChars = guess.split('');
  const solutionChars = solution.split('');
  const result: TileStatus[] = new Array(guessChars.length).fill('absent');
  const leftover: Record<string, number> = {};

  guessChars.forEach((char, i) => {
    if (char === solutionChars[i]) {
      result[i] = 'correct';
    } else {
      leftover[solutionChars[i]!] = (leftover[solutionChars[i]!] ?? 0) + 1;
    }
  });

  guessChars.forEach((char, i) => {
    if (result[i] === 'correct') return;
    if ((leftover[char] ?? 0) > 0) {
      result[i] = 'present';
      leftover[char] = (leftover[char] ?? 0) - 1;
    }
  });

  return result;
};

describe('normalizeChar / normalizeWord property tests', () => {
  it('should remain unchanged when normalizing an already-normalized string of any characters', () => {
    fc.assert(
      fc.property(fc.oneof(fc.string({ unit: 'binary' }), turkishMixedCaseWordArb()), (word) => {
        const normalized = normalizeWord(word);
        expect(normalizeWord(normalized)).toBe(normalized);
      }),
      { numRuns: NUM_RUNS }
    );
  });

  it('should map dotted and dotless i per Turkish casing rules at any position within a mixed-case word (009-AE5)', () => {
    const expectedMap: Record<string, string> = { i: 'İ', ı: 'I', İ: 'İ', I: 'I' };
    fc.assert(
      fc.property(
        fc.constantFrom('i', 'ı', 'İ', 'I'),
        turkishMixedCaseWordArb(0, 8),
        turkishMixedCaseWordArb(0, 8),
        (targetChar, prefix, suffix) => {
          const word = `${prefix}${targetChar}${suffix}`;
          const normalized = normalizeWord(word);
          expect(normalized[prefix.length]).toBe(expectedMap[targetChar]);
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  it('should match the tr-TR locale uppercase transform for any word of Turkish letters (009-AE5)', () => {
    fc.assert(
      fc.property(turkishMixedCaseWordArb(1, 10), (word) => {
        expect(normalizeWord(word)).toBe(word.toLocaleUpperCase('tr-TR'));
      }),
      { numRuns: NUM_RUNS }
    );
  });

  it('should map "izmir" to "İZMİR", not the locale-insensitive toUpperCase result "IZMIR" (009-AE5)', () => {
    expect(normalizeWord('izmir')).toBe('İZMİR');
    expect(normalizeWord('izmir')).not.toBe('izmir'.toUpperCase());
  });

  it('should preserve string length when normalizing any word of Turkish letters', () => {
    fc.assert(
      fc.property(turkishWordArb(), (word) => {
        expect(normalizeWord(word).length).toBe(word.length);
      }),
      { numRuns: NUM_RUNS }
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
      { numRuns: NUM_RUNS }
    );
  });

  it('should mark a tile correct if and only if the guess and solution share the same letter at that position', () => {
    fc.assert(
      fc.property(biasedWordPairArb(), ([guess, solution]) => {
        const result = evaluateGuess(guess, solution);
        for (let i = 0; i < guess.length; i += 1) {
          expect(result[i] === 'correct').toBe(guess[i] === solution[i]);
        }
      }),
      { numRuns: NUM_RUNS }
    );
  });

  it('should agree with an independent two-pass reference model for any guess/solution pair', () => {
    fc.assert(
      fc.property(biasedWordPairArb(), ([guess, solution]) => {
        expect(evaluateGuess(guess, solution)).toEqual(evaluateGuessReferenceModel(guess, solution));
      }),
      { numRuns: NUM_RUNS }
    );
  });

  it('should never count a letter as correct+present more times than it appears in the answer', () => {
    fc.assert(
      fc.property(biasedWordPairArb(), ([guess, solution]) => {
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
      }),
      { numRuns: NUM_RUNS }
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
      { numRuns: NUM_RUNS }
    );
  });

  // Explicit regression cases for duplicate-letter mutants that slipped past
  // the property suite above in review (greedy single-pass matching that
  // lets an earlier 'present' steal a letter a later position needed as
  // 'correct', and a correct-pass that forgets to decrement the count).
  it.each<[string, string, TileStatus[]]>([
    ['AA', 'BA', ['absent', 'correct']],
    ['ABAA', 'AABB', ['correct', 'present', 'present', 'absent']],
    ['İİI', 'IİI', ['absent', 'correct', 'correct']],
  ])('should evaluate %s against %s as %j', (guess, solution, expected) => {
    expect(evaluateGuess(guess, solution)).toEqual(expected);
  });
});
