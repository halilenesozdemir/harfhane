import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useHint } from './useHint';
import { getTodayString } from '@harfhane/shared';
import type { WordLength } from '../types';

const SOLUTION = 'KALEM';
const WORD_LENGTH: WordLength = 5;

function storageKeyFor(wordLength: WordLength): string {
  return `harfhane:hint:${getTodayString()}:${wordLength}`;
}

describe('useHint', () => {
  beforeEach(() => {
    window.localStorage.clear();
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
    const storageKey = storageKeyFor(WORD_LENGTH);

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

  it('should ignore a legacy boolean value stored under the same key and start from no revealed positions', () => {
    const storageKey = storageKeyFor(WORD_LENGTH);
    window.localStorage.setItem(storageKey, JSON.stringify(true));

    const { result } = renderHook(() => useHint(SOLUTION, WORD_LENGTH, [], false));

    expect(result.current.hintUsed).toBe(false);
    expect(result.current.hint).toBeNull();

    expect(() => act(() => result.current.revealHint())).not.toThrow();
    expect(result.current.hint?.position).toBe(0);
  });

  it('should not record the same position twice when revealHint fires twice before a re-render settles', () => {
    const storageKey = storageKeyFor(WORD_LENGTH);
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
});
