import fc from 'fast-check';

// The 29-letter Turkish alphabet (no q, w, x), lowercase, including both
// the dotted (i) and dotless (ı) forms that drive the casing rules under test.
const TURKISH_LOWERCASE_LETTERS = 'abcçdefgğhıijklmnoöprsştuüvyz'.split('');

const MIN_WORD_LENGTH = 1;
const MAX_WORD_LENGTH = 10;

export const turkishLowercaseCharArb: fc.Arbitrary<string> = fc.constantFrom(...TURKISH_LOWERCASE_LETTERS);

export const turkishWordArb = (
  minLength = MIN_WORD_LENGTH,
  maxLength = MAX_WORD_LENGTH
): fc.Arbitrary<string> =>
  fc
    .array(turkishLowercaseCharArb, { minLength, maxLength })
    .map((chars) => chars.join(''));

export const turkishWordOfLengthArb = (length: number): fc.Arbitrary<string> =>
  fc.array(turkishLowercaseCharArb, { minLength: length, maxLength: length }).map((chars) => chars.join(''));
