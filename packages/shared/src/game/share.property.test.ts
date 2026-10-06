import fc from 'fast-check';
import { describe, it, expect } from 'vitest';
import { generateShareText } from './share';
import type { TileStatus } from './types';

const FC_OPTIONS = { numRuns: 50, seed: 42 };
const TILE_EMOJIS = ['🟩', '🟨', '⬜'];
const HEADER_LINES = 2;

const tileStatusArb: fc.Arbitrary<TileStatus> = fc.constantFrom('correct', 'present', 'absent');

const gameArb = fc
  .integer({ min: 1, max: 6 })
  .chain((numGuesses) =>
    fc.integer({ min: 3, max: 7 }).chain((wordLength) =>
      fc.tuple(
        fc.constant(numGuesses),
        fc.constant(wordLength),
        fc.array(fc.array(tileStatusArb, { minLength: wordLength, maxLength: wordLength }), {
          minLength: numGuesses,
          maxLength: numGuesses,
        }),
        fc.boolean()
      )
    )
  );

describe('generateShareText property tests', () => {
  it('should emit exactly one row per guess for any guess count and tile pattern', () => {
    fc.assert(
      fc.property(gameArb, ([numGuesses, , evaluations, isWon]) => {
        const guesses = Array.from({ length: numGuesses }, (_, i) => `G${i}`);
        const text = generateShareText(guesses, evaluations, 'Mod', isWon);
        const rows = text.split('\n').slice(HEADER_LINES, HEADER_LINES + numGuesses);
        expect(rows).toHaveLength(numGuesses);
      }),
      FC_OPTIONS
    );
  });

  it('should use only the three tile status emojis, one per guessed letter', () => {
    fc.assert(
      fc.property(gameArb, ([numGuesses, wordLength, evaluations, isWon]) => {
        const guesses = Array.from({ length: numGuesses }, (_, i) => `G${i}`);
        const text = generateShareText(guesses, evaluations, 'Mod', isWon);
        const rows = text.split('\n').slice(HEADER_LINES, HEADER_LINES + numGuesses);

        rows.forEach((row) => {
          const symbols = Array.from(row);
          expect(symbols).toHaveLength(wordLength);
          symbols.forEach((symbol) => {
            expect(TILE_EMOJIS).toContain(symbol);
          });
        });
      }),
      FC_OPTIONS
    );
  });
});
