import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useAutoOpenAuthModal } from './useAutoOpenAuthModal';

describe('useAutoOpenAuthModal', () => {
  it('should start closed when googleAuthFailed is false', () => {
    const { result } = renderHook(({ failed }: { failed: boolean }) => useAutoOpenAuthModal(failed), {
      initialProps: { failed: false },
    });
    expect(result.current[0]).toBe(false);
  });

  it('should open when googleAuthFailed becomes true', () => {
    const { result, rerender } = renderHook(({ failed }: { failed: boolean }) => useAutoOpenAuthModal(failed), {
      initialProps: { failed: false },
    });

    rerender({ failed: true });

    expect(result.current[0]).toBe(true);
  });

  it('should stay closed after the user closes it even while googleAuthFailed is still true', () => {
    const { result, rerender } = renderHook(({ failed }: { failed: boolean }) => useAutoOpenAuthModal(failed), {
      initialProps: { failed: false },
    });
    rerender({ failed: true });
    act(() => result.current[1](false));

    rerender({ failed: true });

    expect(result.current[0]).toBe(false);
  });
});
