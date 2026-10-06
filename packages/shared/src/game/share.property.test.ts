import fc from 'fast-check';
import { describe, it, expect } from 'vitest';
import { generateShareText } from './share';
import type { TileStatus } from './types';

const NUM_RUNS = 500;
// Mirrors the private constant in share.ts; evaluations.length is bounded to
// the real game's guess limit.
const MAX_GUESSES = 6;
const EMOJI: Record<string, string> = { correct: '🟩', present: '🟨', absent: '⬜' };
const toEmoji = (status: TileStatus): string => (status ? EMOJI[status]! : '⬜');

const tileStatusArb: fc.Arbitrary<TileStatus> = fc.constantFrom('correct', 'present', 'absent', null);

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
        fc.string({ minLength: 1, maxLength: 6 })
      )
    )
  );

// Independently built expected text, mirroring share.ts's own construction
// but without calling it, so a mutated header, emoji map, row order, row
// count or footer is caught by plain string equality.
const buildExpectedText = (
  numGuesses: number,
  evaluations: TileStatus[][],
  isWon: boolean,
  modeText: string
): string => {
  const attemptText = isWon ? `${numGuesses}/${MAX_GUESSES}` : `X/${MAX_GUESSES}`;
  const rows = evaluations.map((row) => row.map(toEmoji).join('')).join('\n');
  return `Harfhane ${modeText} ${attemptText}\n\n${rows}\n\nhttps://harfhane.app`;
};

describe('generateShareText property tests', () => {
  it('should produce exactly the header, rows and footer the format intends, for any guess count and tile pattern', () => {
    fc.assert(
      fc.property(gameArb, ([numGuesses, , evaluations, isWon, modeText]) => {
        const guesses = Array.from({ length: numGuesses }, (_, i) => `G${i}`);
        const actual = generateShareText(guesses, evaluations, modeText, isWon);
        const expected = buildExpectedText(numGuesses, evaluations, isWon, modeText);
        expect(actual).toBe(expected);
      }),
      { numRuns: NUM_RUNS }
    );
  });

  it('should have exactly one line per guess plus 4 fixed lines (header, blank, blank, URL)', () => {
    fc.assert(
      fc.property(gameArb, ([numGuesses, , evaluations, isWon, modeText]) => {
        const guesses = Array.from({ length: numGuesses }, (_, i) => `G${i}`);
        const text = generateShareText(guesses, evaluations, modeText, isWon);
        expect(text.split('\n')).toHaveLength(numGuesses + 4);
      }),
      { numRuns: NUM_RUNS }
    );
  });

  it('should show "n/6" when won and "X/6" when lost, matching guesses.length', () => {
    fc.assert(
      fc.property(gameArb, ([numGuesses, , evaluations, isWon, modeText]) => {
        const guesses = Array.from({ length: numGuesses }, (_, i) => `G${i}`);
        const text = generateShareText(guesses, evaluations, modeText, isWon);
        const headerLine = text.split('\n')[0]!;
        if (isWon) {
          expect(headerLine.endsWith(`${numGuesses}/${MAX_GUESSES}`)).toBe(true);
        } else {
          expect(headerLine.endsWith(`X/${MAX_GUESSES}`)).toBe(true);
        }
      }),
      { numRuns: NUM_RUNS }
    );
  });

  it.each<[TileStatus[][], boolean, string]>([
    [[['correct', 'correct', 'correct', 'correct', 'correct']], true, '🟩🟩🟩🟩🟩'],
    [[['present', 'present', 'present', 'present', 'present']], true, '🟨🟨🟨🟨🟨'],
    [[['absent', 'absent', 'absent', 'absent', 'absent']], true, '⬜⬜⬜⬜⬜'],
  ])('should render %j exactly as %s, never swapping tile colors', (evaluations, isWon, expectedRow) => {
    const text = generateShareText(['KELME'], evaluations, 1, isWon);
    const rows = text.split('\n');
    expect(rows[2]).toBe(expectedRow);
  });
});
