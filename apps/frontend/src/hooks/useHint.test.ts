import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useHint } from './useHint';
import { useEntitlements } from './useEntitlements';
import { getTodayString } from '@harfhane/shared';
import type { WordLength } from '../types';

vi.mock('./useEntitlements', () => ({ useEntitlements: vi.fn(() => ({ isSupporter: false })) }));

const SOLUTION = 'KALEM';
const WORD_LENGTH: WordLength = 5;

function dailyKeyFor(wordLength: WordLength): string {
  return `harfhane:hint:daily:${getTodayString()}:${wordLength}`;
}

// The key before mode-scoping was added: shared by daily and unlimited, which
// is exactly the bug this file now guards against.
function legacyKeyFor(wordLength: WordLength): string {
  return `harfhane:hint:${getTodayString()}:${wordLength}`;
}

describe('useHint', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.mocked(useEntitlements).mockReturnValue({ isSupporter: false });
  });

  it('should read the supporter allowance from useEntitlements instead of a hardcoded literal', () => {
    vi.mocked(useEntitlements).mockReturnValue({ isSupporter: true });

    const { result } = renderHook(() => useHint(SOLUTION, WORD_LENGTH, [], false));

    // The free allowance is 1 (FREE_DAILY_HINTS); a hardcoded literal would mark this used
    // after one reveal. A supporter (SUPPORTER_DAILY_HINTS = 3) must still have room left.
    act(() => result.current.revealHint());

    expect(result.current.hintUsed).toBe(false);
  });

  it('should reveal L, E or M when K and A are already correctly guessed (008-AE7)', () => {
    // KADİT: K and A are correctly placed (green), D/İ/T are not. The hint must
    // reveal the leftmost position neither green nor already revealed: L (index 2).
    const { result } = renderHook(() => useHint(SOLUTION, WORD_LENGTH, ['KADİT'], false));

    act(() => result.current.revealHint());

    expect(result.current.hint).not.toBeNull();
    expect(['L', 'E', 'M']).toContain(result.current.hint?.letter);
    expect(result.current.hint?.position).toBe(2);
    expect(result.current.hint?.letter).toBe('L');
  });

  it('should do nothing when revealHint is called twice (008-AE7)', () => {
    const { result } = renderHook(() => useHint(SOLUTION, WORD_LENGTH, [], false));

    act(() => result.current.revealHint());
    const firstHint = result.current.hint;

    act(() => result.current.revealHint());

    expect(result.current.hint).toEqual(firstHint);
    expect(result.current.hintUsed).toBe(true);
  });

  it('should report hint unavailable when mode is unlimited', () => {
    const { result } = renderHook(() => useHint(SOLUTION, WORD_LENGTH, [], true));

    expect(result.current.hintAvailable).toBe(false);
  });

  it('should keep the revealed hint after a reload', () => {
    const storageKey = dailyKeyFor(WORD_LENGTH);

    const { result, unmount } = renderHook(() => useHint(SOLUTION, WORD_LENGTH, [], false));
    act(() => result.current.revealHint());
    const revealed = result.current.hint;
    unmount();

    expect(window.localStorage.getItem(storageKey)).not.toBeNull();

    const { result: reloaded } = renderHook(() => useHint(SOLUTION, WORD_LENGTH, [], false));

    expect(reloaded.current.hint).toEqual(revealed);
    expect(reloaded.current.hintUsed).toBe(true);
  });

  it('should mark hintUsed true once the free daily allowance is exhausted', () => {
    const { result } = renderHook(() => useHint(SOLUTION, WORD_LENGTH, [], false));

    expect(result.current.hintUsed).toBe(false);

    act(() => result.current.revealHint());

    expect(result.current.hintUsed).toBe(true);
  });

  it('should ignore a legacy boolean value stored under the pre-mode-scoping key', () => {
    window.localStorage.setItem(legacyKeyFor(WORD_LENGTH), JSON.stringify(true));

    const { result } = renderHook(() => useHint(SOLUTION, WORD_LENGTH, [], false));

    expect(result.current.hintUsed).toBe(false);
    expect(result.current.hint).toBeNull();

    expect(() => act(() => result.current.revealHint())).not.toThrow();
    expect(result.current.hint?.position).toBe(0);
  });

  it('should not record the same position twice when revealHint fires twice before a re-render settles', () => {
    const storageKey = dailyKeyFor(WORD_LENGTH);
    const { result } = renderHook(() => useHint(SOLUTION, WORD_LENGTH, [], false));

    act(() => {
      result.current.revealHint();
      result.current.revealHint();
    });

    const stored = JSON.parse(window.localStorage.getItem(storageKey) ?? '[]') as unknown;
    expect(stored).toEqual([0]);
  });

  it('should hide the reveal affordance when every position is already solved by submitted guesses', () => {
    const { result } = renderHook(() => useHint(SOLUTION, WORD_LENGTH, [SOLUTION], false));

    expect(result.current.hint).toBeNull();
    expect(result.current.hintUsed).toBe(false);
    expect(result.current.hintAvailable).toBe(false);

    act(() => result.current.revealHint());
    expect(result.current.hint).toBeNull();
  });

  it('should opportunistically pick up a position revealed under the pre-mode-scoping key for daily mode', () => {
    window.localStorage.setItem(legacyKeyFor(WORD_LENGTH), JSON.stringify([1]));

    const { result } = renderHook(() => useHint(SOLUTION, WORD_LENGTH, [], false));

    expect(result.current.hint).toEqual({ position: 1, letter: 'A' });
  });

  it('should not leak a daily-mode revealed position into unlimited mode (same day, same length)', () => {
    window.localStorage.setItem(dailyKeyFor(WORD_LENGTH), JSON.stringify([0]));

    const { result } = renderHook(() => useHint('MASAL', WORD_LENGTH, [], true));

    expect(result.current.hint).toBeNull();
  });

  it('should make revealHint a no-op in unlimited mode even if storage has a stale value', () => {
    window.localStorage.setItem(dailyKeyFor(WORD_LENGTH), JSON.stringify([0]));

    const { result } = renderHook(() => useHint('MASAL', WORD_LENGTH, [], true));

    act(() => result.current.revealHint());

    expect(result.current.hint).toBeNull();
    expect(result.current.hintAvailable).toBe(false);
  });
});
