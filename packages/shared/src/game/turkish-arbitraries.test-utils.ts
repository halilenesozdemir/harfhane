import fc from 'fast-check';

// The 29-letter Turkish alphabet (no q, w, x), lowercase, including both
// the dotted (i) and dotless (ı) forms that drive the casing rules under test.
const TURKISH_LOWERCASE_LETTERS = 'abcçdefgğhıijklmnoöprsştuüvyz'.split('');
const TURKISH_UPPERCASE_LETTERS = 'ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ'.split('');

const MIN_WORD_LENGTH = 1;
const MAX_WORD_LENGTH = 10;

export const turkishLowercaseCharArb: fc.Arbitrary<string> = fc.constantFrom(...TURKISH_LOWERCASE_LETTERS);

export const turkishMixedCaseCharArb: fc.Arbitrary<string> = fc.constantFrom(
  ...TURKISH_LOWERCASE_LETTERS,
  ...TURKISH_UPPERCASE_LETTERS
);

export const turkishWordArb = (
  minLength = MIN_WORD_LENGTH,
  maxLength = MAX_WORD_LENGTH
): fc.Arbitrary<string> =>
  fc
    .array(turkishLowercaseCharArb, { minLength, maxLength })
    .map((chars) => chars.join(''));

export const turkishWordOfLengthArb = (length: number): fc.Arbitrary<string> =>
  fc.array(turkishLowercaseCharArb, { minLength: length, maxLength: length }).map((chars) => chars.join(''));

export const turkishMixedCaseWordArb = (minLength = 0, maxLength = MAX_WORD_LENGTH): fc.Arbitrary<string> =>
  fc
    .array(turkishMixedCaseCharArb, { minLength, maxLength })
    .map((chars) => chars.join(''));

// A small alphabet biased arbitrary: most real duplicate-letter and i/ı/İ/I
// collisions in evaluateGuess only show up when the generator is forced to
// repeat letters inside a single short word, which a uniform draw from the
// full alphabet rarely produces. Weighting toward a handful of letters
// (including every i/ı/İ/I variant) makes those collisions common.
const SMALL_ALPHABET = ['A', 'B', 'İ', 'I', 'ı', 'i'];

export const biasedLetterArb: fc.Arbitrary<string> = fc.oneof(
  { arbitrary: turkishMixedCaseCharArb, weight: 1 },
  { arbitrary: fc.constantFrom(...SMALL_ALPHABET), weight: 4 }
);

export const biasedWordOfLengthArb = (length: number): fc.Arbitrary<string> =>
  fc.array(biasedLetterArb, { minLength: length, maxLength: length }).map((chars) => chars.join(''));

export const biasedWordPairArb = (
  minLength = 1,
  maxLength = 7
): fc.Arbitrary<[string, string]> =>
  fc
    .integer({ min: minLength, max: maxLength })
    .chain((length) => fc.tuple(biasedWordOfLengthArb(length), biasedWordOfLengthArb(length)));
