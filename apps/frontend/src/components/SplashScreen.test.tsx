import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SplashScreen from './SplashScreen';

const TOTAL_DURATION_MS = 600;
const FIXED_LEGACY_DURATION_MS = 1900;

describe('SplashScreen', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('(011-R6) should not call onDone before the capped duration has passed', () => {
    const onDone = vi.fn();
    render(<SplashScreen onDone={onDone} />);
    act(() => {
      vi.advanceTimersByTime(TOTAL_DURATION_MS - 1);
    });
    expect(onDone).not.toHaveBeenCalled();
  });

  it('(011-R6) should call onDone at the capped ~600ms duration, not the old fixed 1.9s wait', () => {
    const onDone = vi.fn();
    render(<SplashScreen onDone={onDone} />);
    act(() => {
      vi.advanceTimersByTime(TOTAL_DURATION_MS);
    });
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(TOTAL_DURATION_MS).toBeLessThan(FIXED_LEGACY_DURATION_MS);
  });

  it('should show the H-A-R-F tile row', () => {
    const { getByText } = render(<SplashScreen onDone={vi.fn()} />);
    for (const letter of ['H', 'A', 'R', 'F']) {
      expect(getByText(letter)).toBeTruthy();
    }
  });
});
