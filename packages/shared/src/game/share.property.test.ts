import fc from 'fast-check';
import { describe, it, expect } from 'vitest';
import { generateShareText } from './share';
import type { ShareMode } from './share';
import type { TileStatus } from './types';

const NUM_RUNS = 500;
const MAX_GUESSES = 6;
const FILLED = '▰';
const EMPTY = '▱';

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

// Independently built expected bar line, mirroring share.ts's own construction but without
// calling it, so a mutated bar character, present marker or count is caught by plain equality.
function buildExpectedBar(row: TileStatus[]): string {
  const correctCount = row.filter((s) => s === 'correct').length;
  const presentCount = row.filter((s) => s === 'present').length;
  const bar = FILLED.repeat(correctCount) + EMPTY.repeat(row.length - correctCount);
  return presentCount > 0 ? `${bar} ✦${presentCount}` : bar;
}

describe('generateShareText property tests', () => {
  it('should have exactly one line per guess plus 6 fixed lines (header, result, blank, blank, hint, url)', () => {
    fc.assert(
      fc.property(gameArb, ([numGuesses, wordLength, evaluations, isWon, mode]) => {
        const guesses = Array.from({ length: numGuesses }, (_, i) => `G${i}`);
        const text = generateShareText(guesses, evaluations, wordLength, mode, isWon);
        expect(text.split('\n')).toHaveLength(numGuesses + 6);
      }),
      { numRuns: NUM_RUNS }
    );
  });

  it('should render every bar line with the exact fill/empty/marker pattern for its row', () => {
    fc.assert(
      fc.property(gameArb, ([numGuesses, wordLength, evaluations, isWon, mode]) => {
        const guesses = Array.from({ length: numGuesses }, (_, i) => `G${i}`);
        const text = generateShareText(guesses, evaluations, wordLength, mode, isWon);
        const barLines = text.split('\n').slice(3, 3 + numGuesses);
        const expected = evaluations.map(buildExpectedBar);
        expect(barLines).toEqual(expected);
      }),
      { numRuns: NUM_RUNS }
    );
  });

  it('should show "<n>. tahminde buldum" when won and "Bulamadım (6 tahmin)" when lost', () => {
    fc.assert(
      fc.property(gameArb, ([numGuesses, wordLength, evaluations, isWon, mode]) => {
        const guesses = Array.from({ length: numGuesses }, (_, i) => `G${i}`);
        const text = generateShareText(guesses, evaluations, wordLength, mode, isWon);
        const resultLine = text.split('\n')[1]!;
        const expected = isWon ? `${numGuesses}. tahminde buldum` : `Bulamadım (${MAX_GUESSES} tahmin)`;
        expect(resultLine).toBe(expected);
      }),
      { numRuns: NUM_RUNS }
    );
  });

  it('should keep the bar lines identical regardless of the hint flag or streak', () => {
    fc.assert(
      fc.property(gameArb, ([numGuesses, wordLength, evaluations, isWon, mode, , streak]) => {
        const guesses = Array.from({ length: numGuesses }, (_, i) => `G${i}`);
        const withHint = generateShareText(guesses, evaluations, wordLength, mode, isWon, { hintUsed: true, streak });
        const withoutHint = generateShareText(guesses, evaluations, wordLength, mode, isWon, { hintUsed: false, streak });
        const barLines = (text: string): string[] => text.split('\n').slice(3, 3 + numGuesses);
        expect(barLines(withHint)).toEqual(barLines(withoutHint));
      }),
      { numRuns: NUM_RUNS }
    );
  });

  it('should only ever show a streak suffix when the mode is daily and the streak is positive', () => {
    fc.assert(
      fc.property(gameArb, ([numGuesses, wordLength, evaluations, isWon, mode, hintUsed, streak]) => {
        const guesses = Array.from({ length: numGuesses }, (_, i) => `G${i}`);
        const text = generateShareText(guesses, evaluations, wordLength, mode, isWon, { hintUsed, streak });
        const lines = text.split('\n');
        const hintLine = lines[lines.length - 2]!;
        const expectsStreak = mode.type === 'daily' && streak > 0;
        expect(hintLine.includes('· Seri')).toBe(expectsStreak);
        if (expectsStreak) expect(hintLine).toBe(`${hintUsed ? 'İpucuyla' : 'İpucusuz'} · Seri ${streak}`);
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
