import { act, renderHook } from '@testing-library/react-native';
import { AppState } from 'react-native';
import { useTurkeyDay } from './useTurkeyDay';

type AppStateHandler = (status: string) => void;

function mockAppStateListener(): { fire: (status: string) => void } {
  let handler: AppStateHandler | undefined;
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, nextHandler) => {
    handler = nextHandler as AppStateHandler;
    return { remove: () => undefined } as ReturnType<typeof AppState.addEventListener>;
  });
  return { fire: (status: string) => handler?.(status) };
}

describe('useTurkeyDay', () => {
  // Real timers would leave the day tracker's own setInterval running past the test (most
  // tests below never unmount the hook), keeping the process alive and hanging the runner —
  // fake timers everywhere, cleared in afterEach, avoid that regardless of whether a test also
  // unmounts.
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('should update once the polled value changes', async () => {
    let current = '2026-10-05';
    const { result, unmount } = await renderHook(() => useTurkeyDay(() => current));
    expect(result.current).toBe('2026-10-05');

    current = '2026-10-06';
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current).toBe('2026-10-06');
    unmount();
  });

  it('should update immediately on an AppState "active" event, without waiting for the next tick', async () => {
    let current = '2026-10-05';
    const appState = mockAppStateListener();
    const { result, unmount } = await renderHook(() => useTurkeyDay(() => current));
    expect(result.current).toBe('2026-10-05');

    current = '2026-10-06';
    await act(async () => {
      appState.fire('active');
    });

    expect(result.current).toBe('2026-10-06');
    unmount();
  });

  it('should not update on an AppState event other than "active"', async () => {
    let current = '2026-10-05';
    const appState = mockAppStateListener();
    const { result, unmount } = await renderHook(() => useTurkeyDay(() => current));

    current = '2026-10-06';
    await act(async () => {
      appState.fire('background');
    });

    expect(result.current).toBe('2026-10-05');
    unmount();
  });

  it('should not poll or subscribe to AppState when disabled', async () => {
    const setIntervalSpy = jest.spyOn(global, 'setInterval');
    const addEventListenerSpy = jest.spyOn(AppState, 'addEventListener');
    // Deltas, not an absolute zero: mounting a React Native test renderer can itself trigger
    // unrelated AppState subscriptions (the native module's own setup), so only a call count
    // that changes from mounting this hook is attributable to it.
    const intervalCallsBefore = setIntervalSpy.mock.calls.length;
    const listenerCallsBefore = addEventListenerSpy.mock.calls.length;
    const { unmount } = await renderHook(() => useTurkeyDay(() => '2026-10-05', false));
    expect(setIntervalSpy.mock.calls.length).toBe(intervalCallsBefore);
    expect(addEventListenerSpy.mock.calls.length).toBe(listenerCallsBefore);
    unmount();
  });

  it('should re-subscribe (new interval, new AppState listener) when the `today` function reference changes', async () => {
    const setIntervalSpy = jest.spyOn(global, 'setInterval');
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
    const addEventListenerSpy = jest.spyOn(AppState, 'addEventListener');
    const removeSpy = jest.fn();
    addEventListenerSpy.mockReturnValue({ remove: removeSpy } as ReturnType<typeof AppState.addEventListener>);

    const first = () => '2026-10-05';
    const second = () => '2026-10-06';
    const { result, rerender, unmount } = await renderHook<string, { today: () => string }>(({ today }) => useTurkeyDay(today), {
      initialProps: { today: first },
    });
    expect(result.current).toBe('2026-10-05');
    const firstTimerId = setIntervalSpy.mock.results[0]?.value as ReturnType<typeof setInterval>;
    const listenerCallsAfterMount = addEventListenerSpy.mock.calls.length;
    const intervalCallsAfterMount = setIntervalSpy.mock.calls.length;

    await act(async () => {
      rerender({ today: second });
    });

    // The old interval/listener are torn down and a fresh pair created for the new `today`.
    expect(clearIntervalSpy).toHaveBeenCalledWith(firstTimerId);
    expect(removeSpy).toHaveBeenCalledTimes(1);
    expect(setIntervalSpy.mock.calls.length).toBe(intervalCallsAfterMount + 1);
    expect(addEventListenerSpy.mock.calls.length).toBe(listenerCallsAfterMount + 1);

    // The new interval is the one now driving state: the next tick picks up `second`, not a
    // stale closure still reading `first` from before the resubscription.
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    expect(result.current).toBe('2026-10-06');
    unmount();
  });

  it('should not re-subscribe on a re-render with the same `today` reference and `enabled` value', async () => {
    const setIntervalSpy = jest.spyOn(global, 'setInterval');
    const addEventListenerSpy = jest.spyOn(AppState, 'addEventListener');
    const stableToday = () => '2026-10-05';
    const { rerender, unmount } = await renderHook(() => useTurkeyDay(stableToday));
    const callsAfterMount = setIntervalSpy.mock.calls.length;
    const listenerCallsAfterMount = addEventListenerSpy.mock.calls.length;

    await act(async () => {
      rerender(undefined);
    });
    await act(async () => {
      rerender(undefined);
    });

    expect(setIntervalSpy.mock.calls.length).toBe(callsAfterMount);
    expect(addEventListenerSpy.mock.calls.length).toBe(listenerCallsAfterMount);
    unmount();
  });
});
