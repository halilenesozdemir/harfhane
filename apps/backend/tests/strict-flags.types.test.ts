import { describe, it, expect } from 'vitest';
import { parseTurkeyDate, parseWordLength } from '@harfhane/shared';
import { getDailyWord } from '../src/services/word-service';
import { env } from 'cloudflare:test';

// Type-level proofs for Plan 010 R1/R2 in the backend. Removing
// `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` or `reset.d.ts`
// turns a @ts-expect-error below into an "unused directive" error, so
// `pnpm typecheck:test` fails.
describe('backend strict type flags', () => {
  it('should fail typecheck when an array index is used without handling undefined', () => {
    const letters: string[] = ['a', 'b', 'c'];

    // @ts-expect-error - `letters[0]` is `string | undefined` under
    // noUncheckedIndexedAccess; assigning it to `string` must fail until the
    // possible `undefined` is handled.
    const first: string = letters[0];

    const safeFirst = letters[0];
    if (safeFirst === undefined) {
      throw new Error('unreachable: the array literal above always has index 0');
    }

    expect(safeFirst).toBe('a');
    expect(first).toBe('a');
  });

  it('should fail typecheck when undefined is assigned to an optional property', () => {
    // @ts-expect-error - under exactOptionalPropertyTypes `a?: string` does not
    // accept an explicit `undefined`.
    const options: { a?: string } = { a: undefined };

    expect(options).toEqual({ a: undefined });
  });

  it('should fail typecheck when JSON.parse output is used as a number', () => {
    // @ts-expect-error - ts-reset types JSON.parse as `unknown`, not `any`.
    const parsed: number = JSON.parse('1');

    expect(parsed).toBe(1);
  });

  it('should fail typecheck when getDailyWord is called with a raw date string (010-AE2)', () => {
    // Type-level only: these tuples are never passed to getDailyWord, so this
    // proof makes no D1 call (which would otherwise race the isolated-storage
    // teardown between tests).
    type GetDailyWordArgs = Parameters<typeof getDailyWord>;

    // @ts-expect-error - `getDailyWord`'s date parameter is `TurkeyDate` and its
    // length parameter is `WordLength`; raw literals do not compile.
    const invalidArgs: GetDailyWordArgs = [env.DB, '2026-10-06', 5];

    const parsedDate = parseTurkeyDate('2026-10-06');
    const parsedLength = parseWordLength(5);
    if (parsedDate === null || parsedLength === null) {
      throw new Error('unreachable: 2026-10-06 and 5 are both valid');
    }

    // Compiles: a parsed TurkeyDate and WordLength satisfy the parameter types.
    const validArgs: GetDailyWordArgs = [env.DB, parsedDate, parsedLength];

    expect(invalidArgs[1]).toBe('2026-10-06');
    expect(validArgs[1]).toBe('2026-10-06');
  });
});
