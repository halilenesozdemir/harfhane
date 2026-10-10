import { act, renderHook, waitFor } from '@testing-library/react-native';
import { AppState } from 'react-native';
import { createInitialState, dailyGameKey } from '../game/game-state';
import { dailyStatsKey } from '../stats/stats';
import { createMemoryStore } from '../test-utils/render-with-theme';
import { useHomeStatus } from './useHomeStatus';
import type { KeyValueStore } from '../game/game-storage';
import type { DailyStats, WordLength } from '../stats/stats';
import type { UseHomeStatusResult } from './useHomeStatus';

const LENGTH = 5;
const TODAY = '2026-10-08T10:00:00.000Z';
// One second before Turkey midnight (UTC+3): 20:59:58.600Z -> 23:59:58.600 Turkey time.
const JUST_BEFORE_MIDNIGHT = '2026-10-08T20:59:58.600Z';

type AppStateHandler = (status: string) => void;

function mockAppStateListener(): { fire: (status: string) => void } {
  let handler: AppStateHandler | undefined;
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, nextHandler) => {
    handler = nextHandler as AppStateHandler;
    return { remove: () => undefined } as ReturnType<typeof AppState.addEventListener>;
  });
  return { fire: (status: string) => handler?.(status) };
}

// Fires the AppState handler and flushes the store's async getItem chain
// without advancing fake timers: RNTL's `waitFor` would advance them itself
// while polling, which would let the 1 s interval alone satisfy an
// assertion this test means to attribute only to the AppState handler.
async function fireAppStateAndFlush(appState: { fire: (status: string) => void }, status: string): Promise<void> {
  await act(async () => {
    appState.fire(status);
    for (let i = 0; i < 6; i += 1) await Promise.resolve();
  });
}

function storedStats(overrides: Partial<DailyStats>): Readonly<Record<string, string>> {
  const stats: DailyStats = {
    gamesPlayed: 1,
    gamesWon: 1,
    currentStreak: 3,
    maxStreak: 3,
    guessDistribution: [0, 0, 1, 0, 0, 0],
    lastPlayedDate: '2026-10-08',
    ...overrides,
  };
  return { [dailyStatsKey(LENGTH)]: JSON.stringify(stats) };
}

async function setup(store: KeyValueStore) {
  return renderHook(() => useHomeStatus(store, LENGTH));
}

describe('useHomeStatus', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(TODAY));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('should report the displayed streak and today state once loaded', async () => {
    const store = createMemoryStore(storedStats({}));
    const { result } = await setup(store);
    await waitFor(() => expect(result.current.status).not.toBeNull());
    expect(result.current.status).toEqual({ displayedStreak: 3, state: { kind: 'not-started' } });
  });

  it('should report in-progress with the guess count from the stored daily game', async () => {
    const store = createMemoryStore({
      ...storedStats({}),
      [dailyGameKey('2026-10-08', LENGTH)]: JSON.stringify({ ...createInitialState(), guesses: ['kalem'] }),
    });
    const { result } = await setup(store);
    await waitFor(() => expect(result.current.status).not.toBeNull());
    expect(result.current.status?.state).toEqual({ kind: 'in-progress', guesses: 1 });
  });

  it('should recompute the daily status once the Turkey day rolls over', async () => {
    jest.setSystemTime(new Date(JUST_BEFORE_MIDNIGHT));
    const store = createMemoryStore({
      ...storedStats({ lastPlayedDate: '2026-10-08' }),
      [dailyGameKey('2026-10-09', LENGTH)]: JSON.stringify({ ...createInitialState(), gameStatus: 'won', guesses: ['tahta'] }),
    });
    const { result } = await setup(store);
    await waitFor(() => expect(result.current.status).not.toBeNull());
    expect(result.current.status?.state).toEqual({ kind: 'not-started' });

    await act(async () => {
      jest.advanceTimersByTime(2000);
    });
    await waitFor(() => expect(result.current.status?.state).toEqual({ kind: 'won', guesses: 1 }));
  });

  it('should recompute the daily status when the app returns to the foreground on a new day', async () => {
    const appState = mockAppStateListener();
    const store = createMemoryStore({
      ...storedStats({}),
      [dailyGameKey('2026-10-09', LENGTH)]: JSON.stringify({ ...createInitialState(), gameStatus: 'lost', guesses: new Array(6).fill('tahta') }),
    });
    const { result } = await setup(store);
    await waitFor(() => expect(result.current.status).not.toBeNull());
    expect(result.current.status?.state).toEqual({ kind: 'not-started' });

    // No timer ever advances past this point: the only way `today` can
    // change to 2026-10-09 below is the AppState 'active' handler, not the
    // 1 s countdown interval (M7: a surviving mutant removed that handler
    // and the test still passed, because a subsequent `waitFor` silently
    // advanced fake timers for it).
    jest.setSystemTime(new Date('2026-10-09T10:00:00.000Z'));
    await fireAppStateAndFlush(appState, 'active');
    expect(result.current.status?.state).toEqual({ kind: 'lost' });
  });

  it('should not recompute the daily status on an unrelated AppState event', async () => {
    const appState = mockAppStateListener();
    // A game for the new day, so that a mutant which drops the `state ===
    // 'active'' check (recomputing on any AppState event) would flip the
    // state below instead of accidentally matching it anyway.
    const store = createMemoryStore({
      ...storedStats({}),
      [dailyGameKey('2026-10-09', LENGTH)]: JSON.stringify({ ...createInitialState(), gameStatus: 'won', guesses: ['tahta'] }),
    });
    const { result } = await setup(store);
    await waitFor(() => expect(result.current.status).not.toBeNull());

    jest.setSystemTime(new Date('2026-10-09T10:00:00.000Z'));
    await fireAppStateAndFlush(appState, 'background');
    expect(result.current.status?.state).toEqual({ kind: 'not-started' });
  });

  it('should clear the day-check interval on unmount', async () => {
    const setIntervalSpy = jest.spyOn(global, 'setInterval');
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
    const store = createMemoryStore(storedStats({}));
    const { unmount, result } = await setup(store);
    await waitFor(() => expect(result.current.status).not.toBeNull());
    const timerId = setIntervalSpy.mock.results[0]?.value as ReturnType<typeof setInterval>;

    await act(async () => unmount());

    expect(clearIntervalSpy).toHaveBeenCalledWith(timerId);
  });

  it('should not re-create the day-check interval or the AppState subscription on a re-render', async () => {
    const setIntervalSpy = jest.spyOn(global, 'setInterval');
    const addEventListenerSpy = jest.spyOn(AppState, 'addEventListener');
    const store = createMemoryStore(storedStats({}));
    const { rerender } = await setup(store);
    const intervalCallsAfterMount = setIntervalSpy.mock.calls.length;
    const listenerCallsAfterMount = addEventListenerSpy.mock.calls.length;

    await act(async () => rerender(undefined));
    await act(async () => rerender(undefined));

    expect(setIntervalSpy.mock.calls.length).toBe(intervalCallsAfterMount);
    expect(addEventListenerSpy.mock.calls.length).toBe(listenerCallsAfterMount);
  });

  it('should re-create the day-check interval and AppState subscription when the `now` function reference changes', async () => {
    const setIntervalSpy = jest.spyOn(global, 'setInterval');
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
    const addEventListenerSpy = jest.spyOn(AppState, 'addEventListener');
    const removeSpy = jest.fn();
    addEventListenerSpy.mockReturnValue({ remove: removeSpy } as ReturnType<typeof AppState.addEventListener>);
    const store = createMemoryStore(storedStats({}));

    const firstNow = () => new Date(TODAY);
    const secondNow = () => new Date('2026-10-09T10:00:00.000Z');
    const { result, rerender } = await renderHook<UseHomeStatusResult, { now: () => Date }>(({ now }) => useHomeStatus(store, LENGTH, now), {
      initialProps: { now: firstNow },
    });
    await waitFor(() => expect(result.current.status).not.toBeNull());
    const firstTimerId = setIntervalSpy.mock.results[0]?.value as ReturnType<typeof setInterval>;
    const intervalCallsAfterMount = setIntervalSpy.mock.calls.length;
    const listenerCallsAfterMount = addEventListenerSpy.mock.calls.length;

    await act(async () => rerender({ now: secondNow }));

    // A changed `now` (e.g. the app swapping in a real clock after a test harness) must tear
    // down the interval/listener built around the old one and build a fresh pair around the new
    // `now`, not keep polling with a stale closure.
    expect(clearIntervalSpy).toHaveBeenCalledWith(firstTimerId);
    expect(removeSpy).toHaveBeenCalledTimes(1);
    expect(setIntervalSpy.mock.calls.length).toBe(intervalCallsAfterMount + 1);
    expect(addEventListenerSpy.mock.calls.length).toBe(listenerCallsAfterMount + 1);
  });

  it('should not trigger a fresh load on a tick that does not cross the Turkey day boundary', async () => {
    const store = createMemoryStore(storedStats({}));
    const { result } = await setup(store);
    await waitFor(() => expect(result.current.status).not.toBeNull());
    const statusBeforeTick = result.current.status;

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    // Same length, status and day: the day-check interval ran but found no
    // change, so useLoadedStatus's effect must not have re-run (same object
    // reference, not just an equal one).
    expect(result.current.status).toBe(statusBeforeTick);
  });

  it('should fall back to a not-started/streak-0 status when the store rejects', async () => {
    const store: KeyValueStore = {
      getItem: () => Promise.reject(new Error('storage unavailable')),
      setItem: async () => undefined,
    };
    const { result } = await setup(store);
    await waitFor(() => expect(result.current.status).not.toBeNull());
    expect(result.current.status).toEqual({ displayedStreak: 0, state: { kind: 'not-started' } });
  });

  it('should clear the status while a new length loads, instead of showing the previous length\'s status', async () => {
    const lengthFive: WordLength = 5;
    const lengthSix: WordLength = 6;
    let resolveSix!: (value: string | null) => void;
    const store: KeyValueStore = {
      getItem: (key) => {
        if (key === dailyStatsKey(lengthFive)) {
          const stats: DailyStats = { gamesPlayed: 1, gamesWon: 1, currentStreak: 3, maxStreak: 3, guessDistribution: [0, 0, 1, 0, 0, 0], lastPlayedDate: '2026-10-08' };
          return Promise.resolve(JSON.stringify(stats));
        }
        if (key === dailyStatsKey(lengthSix)) return new Promise((resolve) => { resolveSix = resolve; });
        return Promise.resolve(null);
      },
      setItem: async () => undefined,
    };
    const { result, rerender } = await renderHook(({ length }: { length: WordLength }) => useHomeStatus(store, length), {
      initialProps: { length: lengthFive },
    });
    await waitFor(() => expect(result.current.status).not.toBeNull());
    expect(result.current.status?.displayedStreak).toBe(3);

    await act(async () => rerender({ length: lengthSix }));
    expect(result.current.status).toBeNull();

    await act(async () => {
      resolveSix(null);
    });
    await waitFor(() => expect(result.current.status).not.toBeNull());
    expect(result.current.status?.displayedStreak).toBe(0);
  });

  it('should not mix up stats from a previous length when the selected length changes before its load settles', async () => {
    const lengthFive: WordLength = 5;
    const lengthSix: WordLength = 6;
    let resolveFive!: (value: string | null) => void;
    const store: KeyValueStore = {
      getItem: (key) => {
        if (key === dailyStatsKey(lengthFive)) return new Promise((resolve) => { resolveFive = resolve; });
        if (key === dailyStatsKey(lengthSix)) {
          const stats: DailyStats = { gamesPlayed: 2, gamesWon: 2, currentStreak: 7, maxStreak: 7, guessDistribution: [0, 0, 0, 0, 0, 0], lastPlayedDate: '2026-10-08' };
          return Promise.resolve(JSON.stringify(stats));
        }
        return Promise.resolve(null);
      },
      setItem: async () => undefined,
    };
    const { result, rerender } = await renderHook(({ length }: { length: WordLength }) => useHomeStatus(store, length), {
      initialProps: { length: lengthFive },
    });
    await act(async () => rerender({ length: lengthSix }));
    await waitFor(() => expect(result.current.status).not.toBeNull());
    expect(result.current.status?.displayedStreak).toBe(7);

    // The length-5 load settles after length 6 already resolved; without the
    // isCurrent guard this stale response would overwrite the correct state.
    await act(async () => {
      resolveFive(JSON.stringify({ gamesPlayed: 1, gamesWon: 0, currentStreak: 1, maxStreak: 1, guessDistribution: [0, 0, 0, 0, 0, 0], lastPlayedDate: '2026-10-01' }));
    });
    expect(result.current.status?.displayedStreak).toBe(7);
  });
});
