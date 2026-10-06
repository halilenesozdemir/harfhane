import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SplashScreen from './SplashScreen';

const TOTAL_DURATION_MS = 600;
const HOLD_START_MS = 400;
const FIXED_LEGACY_DURATION_MS = 1900;

function mockMatchMedia(matches: boolean): void {
  window.matchMedia = vi.fn().mockReturnValue({
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }) as unknown as typeof window.matchMedia;
}

describe('SplashScreen', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockMatchMedia(false);
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

  it('(011-R6) should start fading out at HOLD_START_MS, before onDone unmounts it', () => {
    const onDone = vi.fn();
    const { container } = render(<SplashScreen onDone={onDone} />);
    act(() => {
      vi.advanceTimersByTime(HOLD_START_MS);
    });
    expect(onDone).not.toHaveBeenCalled();
    expect(container.firstElementChild?.className).toMatch(/opacity-0/);
  });

  it('(011-R6) should give the fade-out exactly as much time as TOTAL_DURATION_MS leaves after HOLD_START_MS, not less', () => {
    const onDone = vi.fn();
    const { container } = render(<SplashScreen onDone={onDone} />);
    act(() => {
      vi.advanceTimersByTime(HOLD_START_MS);
    });
    const outerClassName = container.firstElementChild?.className ?? '';
    const fadeDurationMatch = outerClassName.match(/duration-(\d+)/);
    expect(fadeDurationMatch).not.toBeNull();
    const fadeDurationMs = Number(fadeDurationMatch?.[1]);
    // The fade must finish inside its own remaining window, not get cut
    // off mid-transition when onDone unmounts the splash.
    expect(TOTAL_DURATION_MS - HOLD_START_MS).toBe(fadeDurationMs);
  });

  it('(011-R6) should skip the animated wait and call onDone promptly when prefers-reduced-motion is set', () => {
    mockMatchMedia(true);
    const onDone = vi.fn();
    render(<SplashScreen onDone={onDone} />);
    act(() => {
      vi.advanceTimersByTime(HOLD_START_MS - 1);
    });
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
