import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useHint } from './useHint';
import { getTodayString } from '@harfhane/shared';
import type { WordLength } from '../types';

const SOLUTION = 'KALEM';
const WORD_LENGTH: WordLength = 5;

describe('useHint', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('should reveal the leftmost unsolved position when revealHint is called', () => {
    const { result } = renderHook(() => useHint(SOLUTION, WORD_LENGTH, ['KADİT'], false));

    act(() => result.current.revealHint());

    expect(result.current.hint).not.toBeNull();
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
    const today = getTodayString();
    const storageKey = `harfhane:hint:${today}:${WORD_LENGTH}`;

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
});
