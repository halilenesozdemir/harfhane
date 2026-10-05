import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import WinConfetti from './WinConfetti';

const CONFETTI_DURATION_MS = 2500;

function particleCount(container: HTMLElement): number {
  return container.querySelectorAll('.animate-confetti-fall').length;
}

describe('WinConfetti', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should show confetti when it mounts already active', () => {
    const { container } = render(<WinConfetti active />);
    expect(particleCount(container)).toBeGreaterThan(0);
  });

  it('should show confetti when active turns true after mount', () => {
    const { container, rerender } = render(<WinConfetti active={false} />);
    expect(particleCount(container)).toBe(0);
    rerender(<WinConfetti active />);
    expect(particleCount(container)).toBeGreaterThan(0);
  });

  it('should clear confetti when the animation time has passed', () => {
    const { container } = render(<WinConfetti active />);
    act(() => {
      vi.advanceTimersByTime(CONFETTI_DURATION_MS);
    });
    expect(particleCount(container)).toBe(0);
  });
});
