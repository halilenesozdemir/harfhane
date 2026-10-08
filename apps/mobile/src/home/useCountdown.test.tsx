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

  it('should tick every second while enabled', async () => {
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
});
