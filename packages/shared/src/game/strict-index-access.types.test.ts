import { describe, it, expect } from 'vitest';

// Type-level proof for noUncheckedIndexedAccess (Plan 010 R1). This file is
// exercised by both `pnpm typecheck` (the @ts-expect-error line below) and
// vitest (the runtime assertions), so a regression in either direction is
// caught.
describe('noUncheckedIndexedAccess type safety', () => {
  it('should fail typecheck when an array index is used without handling undefined (010-AE1)', () => {
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
});
