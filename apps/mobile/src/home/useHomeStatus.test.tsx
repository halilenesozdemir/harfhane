import { act, renderHook, waitFor } from '@testing-library/react-native';
import { AppState } from 'react-native';
import { createInitialState, dailyGameKey } from '../game/game-state';
import { dailyStatsKey } from '../stats/stats';
import { createMemoryStore } from '../test-utils/render-with-theme';
import { useHomeStatus } from './useHomeStatus';
import type { KeyValueStore } from '../game/game-storage';
import type { DailyStats } from '../stats/stats';

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

    jest.setSystemTime(new Date('2026-10-09T10:00:00.000Z'));
    await act(async () => appState.fire('active'));
    await waitFor(() => expect(result.current.status?.state).toEqual({ kind: 'lost' }));
  });
});
