// Branded type for a validated word length (Plan 010 R3). A plain `number`
// cannot be passed where `WordLength` is expected without going through
// `parseWordLength` first, so an unvalidated length can never reach a
// repository or service boundary by accident.

export const ALLOWED_WORD_LENGTHS = [4, 5, 6] as const;

type AllowedWordLength = (typeof ALLOWED_WORD_LENGTHS)[number];

declare const wordLengthBrand: unique symbol;

export type WordLength = AllowedWordLength & { readonly [wordLengthBrand]: true };

const ALLOWED_WORD_LENGTHS_SET: ReadonlySet<number> = new Set(ALLOWED_WORD_LENGTHS);

/**
 * Parses a plain number into a `WordLength`. Returns `null` instead of
 * throwing so route handlers can turn a rejection into a 400 response rather
 * than an unhandled exception (never throw on user input at a route
 * boundary).
 */
export function parseWordLength(value: number): WordLength | null {
  return ALLOWED_WORD_LENGTHS_SET.has(value) ? (value as WordLength) : null;
}

export const DEFAULT_WORD_LENGTH: WordLength = 5 as WordLength;
