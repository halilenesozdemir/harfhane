import fc from 'fast-check';
import { describe, it, expect } from 'vitest';
import { generateShareText } from './share';
import type { ShareMode } from './share';
import type { TileStatus } from './types';

const NUM_RUNS = 500;
const MAX_GUESSES = 6;
const CORRECT = '🟢';
const PRESENT = '🟡';
const ABSENT = '⚪';

const tileStatusArb: fc.Arbitrary<TileStatus> = fc.constantFrom('correct', 'present', 'absent', null);

const modeArb: fc.Arbitrary<ShareMode> = fc.oneof(
  fc.constant<ShareMode>({ type: 'unlimited' }),
  fc
    .tuple(fc.integer({ min: 2026, max: 2030 }), fc.integer({ min: 1, max: 12 }), fc.integer({ min: 1, max: 28 }))
    .map(
      ([year, month, day]): ShareMode => ({
        type: 'daily',
        date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      })
    )
);

const gameArb = fc
  .integer({ min: 1, max: MAX_GUESSES })
  .chain((numGuesses) =>
    fc.integer({ min: 3, max: 7 }).chain((wordLength) =>
      fc.tuple(
        fc.constant(numGuesses),
        fc.constant(wordLength),
        fc.array(fc.array(tileStatusArb, { minLength: wordLength, maxLength: wordLength }), {
          minLength: numGuesses,
          maxLength: numGuesses,
        }),
        fc.boolean(),
        modeArb,
        fc.boolean(),
        fc.nat({ max: 50 })
      )
    )
  );

// Independently built expected grid line, mirroring share.ts's own construction but without
// calling it, so a mutated circle character or a swapped status mapping is caught by plain
// equality. Positional: each tile keeps its own index, unlike an aggregate count.
function buildExpectedGridLine(row: TileStatus[]): string {
  return row
    .map((status) => {
      if (status === 'correct') return CORRECT;
      if (status === 'present') return PRESENT;
      return ABSENT;
    })
    .join('');
}

describe('generateShareText property tests', () => {
  it('should have exactly one line per guess plus 5 fixed lines (header, result, blank, blank, url)', () => {
    fc.assert(
      fc.property(gameArb, ([numGuesses, wordLength, evaluations, isWon, mode]) => {
        const guesses = Array.from({ length: numGuesses }, (_, i) => `G${i}`);
        const text = generateShareText(guesses, evaluations, wordLength, mode, isWon);
        expect(text.split('\n')).toHaveLength(numGuesses + 5);
      }),
      { numRuns: NUM_RUNS }
    );
  });

  it('should render every grid line with the exact positional circle for its row', () => {
    fc.assert(
      fc.property(gameArb, ([numGuesses, wordLength, evaluations, isWon, mode]) => {
        const guesses = Array.from({ length: numGuesses }, (_, i) => `G${i}`);
        const text = generateShareText(guesses, evaluations, wordLength, mode, isWon);
        const gridLines = text.split('\n').slice(3, 3 + numGuesses);
        const expected = evaluations.map(buildExpectedGridLine);
        expect(gridLines).toEqual(expected);
      }),
      { numRuns: NUM_RUNS }
    );
  });

  it('should show "<n>/6" when won and "Bulamadım · 6/6" when lost', () => {
    fc.assert(
      fc.property(gameArb, ([numGuesses, wordLength, evaluations, isWon, mode]) => {
        const guesses = Array.from({ length: numGuesses }, (_, i) => `G${i}`);
        const text = generateShareText(guesses, evaluations, wordLength, mode, isWon);
        const resultLine = text.split('\n')[1]!.split(' · Seri')[0]!.split(' · İpucuyla')[0]!;
        const expected = isWon ? `${numGuesses}/${MAX_GUESSES}` : `Bulamadım · ${MAX_GUESSES}/${MAX_GUESSES}`;
        expect(resultLine).toBe(expected);
      }),
      { numRuns: NUM_RUNS }
    );
  });

  it('should keep the grid lines identical regardless of the hint flag or streak', () => {
    fc.assert(
      fc.property(gameArb, ([numGuesses, wordLength, evaluations, isWon, mode, , streak]) => {
        const guesses = Array.from({ length: numGuesses }, (_, i) => `G${i}`);
        const withHint = generateShareText(guesses, evaluations, wordLength, mode, isWon, { hintUsed: true, streak });
        const withoutHint = generateShareText(guesses, evaluations, wordLength, mode, isWon, { hintUsed: false, streak });
        const gridLines = (text: string): string[] => text.split('\n').slice(3, 3 + numGuesses);
        expect(gridLines(withHint)).toEqual(gridLines(withoutHint));
      }),
      { numRuns: NUM_RUNS }
    );
  });

  it('should only ever show a streak suffix on the second line when the mode is daily and the streak is positive', () => {
    fc.assert(
      fc.property(gameArb, ([numGuesses, wordLength, evaluations, isWon, mode, hintUsed, streak]) => {
        const guesses = Array.from({ length: numGuesses }, (_, i) => `G${i}`);
        const text = generateShareText(guesses, evaluations, wordLength, mode, isWon, { hintUsed, streak });
        const secondLine = text.split('\n')[1]!;
        const expectsStreak = mode.type === 'daily' && streak > 0;
        expect(secondLine.includes('· Seri')).toBe(expectsStreak);
      }),
      { numRuns: NUM_RUNS }
    );
  });

  it('should only ever show the hint suffix on the second line when hintUsed is true', () => {
    fc.assert(
      fc.property(gameArb, ([numGuesses, wordLength, evaluations, isWon, mode, hintUsed, streak]) => {
        const guesses = Array.from({ length: numGuesses }, (_, i) => `G${i}`);
        const text = generateShareText(guesses, evaluations, wordLength, mode, isWon, { hintUsed, streak });
        const secondLine = text.split('\n')[1]!;
        expect(secondLine.includes('İpucuyla')).toBe(hintUsed);
      }),
      { numRuns: NUM_RUNS }
    );
  });

  it('should always end with the resolved share URL as the last line', () => {
    fc.assert(
      fc.property(gameArb, ([numGuesses, wordLength, evaluations, isWon, mode]) => {
        const guesses = Array.from({ length: numGuesses }, (_, i) => `G${i}`);
        const text = generateShareText(guesses, evaluations, wordLength, mode, isWon);
        expect(text.split('\n').at(-1)).toBe('harfhane.app');
      }),
      { numRuns: NUM_RUNS }
    );
  });

  it('should never contain a guess word anywhere in the generated text', () => {
    fc.assert(
      fc.property(gameArb, ([numGuesses, wordLength, evaluations, isWon, mode]) => {
        const guesses = Array.from({ length: numGuesses }, (_, i) => `SOLUTION${i}`);
        const text = generateShareText(guesses, evaluations, wordLength, mode, isWon);
        for (const guess of guesses) expect(text).not.toContain(guess);
      }),
      { numRuns: NUM_RUNS }
    );
  });
});
