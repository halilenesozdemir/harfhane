import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useTurkeyDay } from './useTurkeyDay';

describe('useTurkeyDay', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return the initial day string on first render', () => {
    const { result } = renderHook(() => useTurkeyDay(() => '2026-10-14'));
    expect(result.current).toBe('2026-10-14');
  });

  it('should re-render with the new day string once the polled value changes', () => {
    let day = '2026-10-14';
    const { result } = renderHook(() => useTurkeyDay(() => day));

    day = '2026-10-15';
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current).toBe('2026-10-15');
  });

  it('should re-check the day when the tab becomes visible again', () => {
    let day = '2026-10-14';
    const { result } = renderHook(() => useTurkeyDay(() => day));

    day = '2026-10-15';
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(result.current).toBe('2026-10-15');
  });
});
