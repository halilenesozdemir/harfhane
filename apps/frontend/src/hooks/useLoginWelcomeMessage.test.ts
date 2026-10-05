import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useLoginWelcomeMessage } from './useLoginWelcomeMessage';

interface Props {
  justLoggedIn: boolean;
  username: string | undefined;
}

function renderWelcome(clearJustLoggedIn: () => void, initialProps: Props) {
  return renderHook(({ justLoggedIn, username }: Props) => useLoginWelcomeMessage(justLoggedIn, username, clearJustLoggedIn), {
    initialProps,
  });
}

describe('useLoginWelcomeMessage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should be empty when the user has not just logged in', () => {
    const { result } = renderWelcome(vi.fn(), { justLoggedIn: false, username: undefined });
    expect(result.current).toBe('');
  });

  it('should show a welcome message right when justLoggedIn becomes true', () => {
    const { result, rerender } = renderWelcome(vi.fn(), { justLoggedIn: false, username: 'ayse' });
    rerender({ justLoggedIn: true, username: 'ayse' });
    expect(result.current).toBe('Hoş geldin, ayse!');
  });

  it('should clear the message and notify after the welcome duration', () => {
    const clearJustLoggedIn = vi.fn();
    const { result, rerender } = renderWelcome(clearJustLoggedIn, { justLoggedIn: false, username: 'ayse' });
    rerender({ justLoggedIn: true, username: 'ayse' });

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current).toBe('');
    expect(clearJustLoggedIn).toHaveBeenCalledTimes(1);
  });
});
