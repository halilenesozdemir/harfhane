import { act, renderHook, waitFor } from '@testing-library/react-native';
import { AppState } from 'react-native';
import { createInitialState, dailyGameKey } from '../game/game-state';
import { dailyStatsKey } from '../stats/stats';
import { createMemoryStore } from '../test-utils/render-with-theme';
import { useHomeStatus } from './useHomeStatus';
import type { KeyValueStore } from '../game/game-storage';
import type { DailyStats, WordLength } from '../stats/stats';

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

  it('should tick the countdown every second', async () => {
    const { result } = await setup(createMemoryStore(storedStats({})));
    const first = result.current.countdown;
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    expect(result.current.countdown).not.toBe(first);
  });

  it('should recompute the daily status once the countdown crosses midnight', async () => {
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
    const store = createMemoryStore(storedStats({}));
    const { result } = await setup(store);
    await waitFor(() => expect(result.current.status).not.toBeNull());

    jest.setSystemTime(new Date('2026-10-09T10:00:00.000Z'));
    await fireAppStateAndFlush(appState, 'background');
    expect(result.current.status?.state).toEqual({ kind: 'not-started' });
  });

  it('should not re-create the countdown interval or the AppState subscription on a re-render', async () => {
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
