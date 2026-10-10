import { describe, it, expect } from 'vitest';

// Type-level proofs for the rest of Plan 010 R1/R2 in shared. Removing
// `exactOptionalPropertyTypes` or `reset.d.ts` turns a @ts-expect-error below
// into an "unused directive" error, so `pnpm typecheck` fails.
describe('shared strict type flags', () => {
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
});
