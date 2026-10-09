import { act, renderHook } from '@testing-library/react-native';
import { useCountdown } from './useCountdown';

const NOW = '2026-10-08T16:47:51.000Z';
// One second later: the countdown's seconds digit must move down by one.
const NOW_PLUS_1S = '2026-10-08T16:47:52.000Z';

function now(): Date {
  return new Date();
}

describe('useCountdown', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(NOW));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should tick every second when enabled', async () => {
    const { result } = await renderHook(() => useCountdown(now, true));
    const first = result.current;
    jest.setSystemTime(new Date(NOW_PLUS_1S));
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    expect(result.current).not.toBe(first);
  });

  it('should not start the interval while disabled', async () => {
    const setIntervalSpy = jest.spyOn(global, 'setInterval');
    await renderHook(() => useCountdown(now, false));
    expect(setIntervalSpy).not.toHaveBeenCalled();
  });

  it('should start ticking once enabled flips true after mounting disabled', async () => {
    const { result, rerender } = await renderHook(({ enabled }: { enabled: boolean }) => useCountdown(now, enabled), {
      initialProps: { enabled: false },
    });
    const first = result.current;
    await act(async () => rerender({ enabled: true }));
    jest.setSystemTime(new Date(NOW_PLUS_1S));
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    expect(result.current).not.toBe(first);
  });

  it('should show a fresh value immediately when enabled flips true, before any tick elapses', async () => {
    const { result, rerender } = await renderHook(({ enabled }: { enabled: boolean }) => useCountdown(now, enabled), {
      initialProps: { enabled: false },
    });
    const staleValue = result.current;
    // Time passes while disabled (no interval, no re-render); the value
    // read at mount is now stale by more than a second.
    jest.setSystemTime(new Date(NOW_PLUS_1S));
    await act(async () => rerender({ enabled: true }));
    expect(result.current).not.toBe(staleValue);
  });

  it('should clear the interval on unmount when enabled', async () => {
    const setIntervalSpy = jest.spyOn(global, 'setInterval');
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
    const { unmount } = await renderHook(() => useCountdown(now, true));
    const timerId = setIntervalSpy.mock.results[0]?.value as ReturnType<typeof setInterval>;

    await act(async () => unmount());

    expect(clearIntervalSpy).toHaveBeenCalledWith(timerId);
  });
});
