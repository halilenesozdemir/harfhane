import { act, renderHook } from '@testing-library/react-native';
import { createMemoryStore } from '../test-utils/render-with-theme';
import { loadDailyStats, loadUnlimitedStats } from './stats';
import { useResultRecorder } from './useResultRecorder';
import type { KeyValueStore } from '../game/game-storage';
import type { GameSession } from '../game/game-session';

const TODAY = '2026-10-05';
const today = () => TODAY;

function buildSession(
  phase: GameSession['phase'],
  gameStatus: GameSession['game']['gameStatus'],
  guesses: readonly string[] = [],
  dailyDate: string | null = TODAY,
): GameSession {
  return {
    phase,
    solution: 'KALEM',
    wordId: null,
    message: null,
    isSubmitting: false,
    storageKey: null,
    dailyDate,
    rejectionCount: 0,
    game: { guesses: [...guesses], evaluations: [], currentGuess: '', gameStatus, keyboardStatus: {} },
  };
}

async function flushPendingWrites(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

async function waitUntil(predicate: () => Promise<boolean>, maxTicks = 50): Promise<void> {
  for (let tick = 0; tick < maxTicks; tick += 1) {
    if (await predicate()) return;
    await Promise.resolve();
  }
  throw new Error('waitUntil: condition never became true');
}

interface ControllableStore extends KeyValueStore {
  releaseWrites(): void;
}

function createControllableStore(): ControllableStore {
  const entries = new Map<string, string>();
  const heldCommits: Array<() => void> = [];
  let writesHeld = true;
  return {
    getItem: async (key) => entries.get(key) ?? null,
    setItem: (key, value) =>
      new Promise<void>((resolve) => {
        const commit = () => {
          entries.set(key, value);
          resolve();
        };
        if (writesHeld) {
          heldCommits.push(commit);
          return;
        }
        commit();
      }),
    releaseWrites() {
      writesHeld = false;
      while (heldCommits.length > 0) heldCommits.shift()?.();
    },
  };
}

function createRejectingWriteStore(): KeyValueStore {
  const entries = new Map<string, string>();
  return {
    getItem: async (key) => entries.get(key) ?? null,
    setItem: async () => {
      throw new Error('AsyncStorage unavailable');
    },
  };
}

const FIRST_WRITE_CALL = 1;

// Rejects only the first setItem call, then behaves like a normal store — proves a save
// rejection does not poison the shared per-key write queue for later results.
function createFirstWriteRejectingStore(): KeyValueStore {
  const entries = new Map<string, string>();
  let setItemCalls = 0;
  return {
    getItem: async (key) => entries.get(key) ?? null,
    setItem: async (key, value) => {
      setItemCalls += 1;
      if (setItemCalls === FIRST_WRITE_CALL) throw new Error('AsyncStorage unavailable');
      entries.set(key, value);
    },
  };
}

function createLoadRejectingStore(): KeyValueStore {
  const entries = new Map<string, string>();
  return {
    getItem: async () => {
      throw new Error('AsyncStorage read failure');
    },
    setItem: async (key, value) => {
      entries.set(key, value);
    },
  };
}

describe('useResultRecorder', () => {
  it('should expose the just-recorded distribution once the write resolves (B2)', async () => {
    const store = createMemoryStore();
    const { result, rerender } = await renderHook(
      ({ session }: { session: GameSession }) => useResultRecorder({ store, mode: 'unlimited', wordLength: 5, session, today }),
      { initialProps: { session: buildSession('ready', 'playing', [], null) } },
    );
    expect(result.current.justRecordedDistribution).toBeNull();

    await rerender({ session: buildSession('ready', 'won', ['KALEM'], null) });
    await flushPendingWrites();

    expect(result.current.justRecordedDistribution).toEqual([1, 0, 0, 0, 0, 0]);
  });

  it('should clear the just-recorded distribution once a new game starts loading (B2)', async () => {
    const store = createMemoryStore();
    const { result, rerender } = await renderHook(
      ({ session }: { session: GameSession }) => useResultRecorder({ store, mode: 'unlimited', wordLength: 5, session, today }),
      { initialProps: { session: buildSession('ready', 'playing', [], null) } },
    );

    await rerender({ session: buildSession('ready', 'won', ['KALEM'], null) });
    await flushPendingWrites();
    expect(result.current.justRecordedDistribution).toEqual([1, 0, 0, 0, 0, 0]);

    // "Yeni kelime" dispatches 'loading' before the next word resolves — the stale distribution
    // must not still be showing once that next game's own finish eventually records.
    await rerender({ session: buildSession('loading', 'playing', [], null) });
    expect(result.current.justRecordedDistribution).toBeNull();
  });

  it('should not expose a distribution for a game restored already finished (nothing was just recorded)', async () => {
    const store = createMemoryStore();
    const { result, rerender } = await renderHook(
      ({ session }: { session: GameSession }) => useResultRecorder({ store, mode: 'daily', wordLength: 5, session, today }),
      { initialProps: { session: buildSession('loading', 'playing') } },
    );

    await rerender({ session: buildSession('ready', 'won', ['KALEM']) });
    await flushPendingWrites();

    expect(result.current.justRecordedDistribution).toBeNull();
  });

  it('should still expose the computed distribution when the storage write fails', async () => {
    const store = createRejectingWriteStore();
    const { result, rerender } = await renderHook(
      ({ session }: { session: GameSession }) => useResultRecorder({ store, mode: 'unlimited', wordLength: 5, session, today }),
      { initialProps: { session: buildSession('ready', 'playing', [], null) } },
    );

    await rerender({ session: buildSession('ready', 'won', ['KALEM'], null) });
    await flushPendingWrites();

    expect(result.current.justRecordedDistribution).toEqual([1, 0, 0, 0, 0, 0]);
  });

  it('should still record a later daily result for the same mode and length when an earlier save for that key rejected', async () => {
    const store = createFirstWriteRejectingStore();
    const { rerender } = await renderHook(
      ({ session }: { session: GameSession }) => useResultRecorder({ store, mode: 'daily', wordLength: 5, session, today }),
      { initialProps: { session: buildSession('ready', 'playing') } },
    );

    // Game 1's save rejects (first setItem call) but must not break the shared write queue.
    await rerender({ session: buildSession('ready', 'won', ['KALEM']) });
    await flushPendingWrites();

    // Game 2's save should still go through.
    await rerender({ session: buildSession('loading', 'playing') });
    await rerender({ session: buildSession('ready', 'playing') });
    await rerender({ session: buildSession('ready', 'lost', ['A', 'B', 'C', 'D', 'E', 'F']) });
    await flushPendingWrites();

    const stats = await loadDailyStats(store, 5);
    expect(stats.gamesPlayed).toBe(1);
  });

  it('should still expose the computed distribution when the daily stats load fails', async () => {
    const store = createLoadRejectingStore();
    const { result, rerender } = await renderHook(
      ({ session }: { session: GameSession }) => useResultRecorder({ store, mode: 'daily', wordLength: 5, session, today }),
      { initialProps: { session: buildSession('ready', 'playing') } },
    );

    await rerender({ session: buildSession('ready', 'won', ['KALEM']) });
    await flushPendingWrites();

    expect(result.current.justRecordedDistribution).toEqual([1, 0, 0, 0, 0, 0]);
  });

  it('should still expose the computed distribution when the unlimited stats load fails', async () => {
    const store = createLoadRejectingStore();
    const { result, rerender } = await renderHook(
      ({ session }: { session: GameSession }) => useResultRecorder({ store, mode: 'unlimited', wordLength: 5, session, today }),
      { initialProps: { session: buildSession('ready', 'playing', [], null) } },
    );

    await rerender({ session: buildSession('ready', 'won', ['KALEM'], null) });
    await flushPendingWrites();

    expect(result.current.justRecordedDistribution).toEqual([1, 0, 0, 0, 0, 0]);
  });

  it("should not let a previous game's late-resolving write set the current game's justRecordedDistribution", async () => {
    const store = createControllableStore();
    const { result, rerender } = await renderHook(
      ({ session }: { session: GameSession }) => useResultRecorder({ store, mode: 'unlimited', wordLength: 5, session, today }),
      { initialProps: { session: buildSession('ready', 'playing', [], null) } },
    );

    // Game 1 finishes; its write is held pending.
    await rerender({ session: buildSession('ready', 'won', ['KALEM'], null) });
    expect(result.current.justRecordedDistribution).toBeNull();

    // Game 2 starts before game 1's write resolves — this cleans up game 1's effect instance
    // (isCurrent becomes false for it), while game 2's own effect has not recorded anything yet.
    await rerender({ session: buildSession('loading', 'playing', [], null) });
    await rerender({ session: buildSession('ready', 'playing', [], null) });
    expect(result.current.justRecordedDistribution).toBeNull();

    // Game 1's held write resolves only now, after game 2 has already started.
    await act(async () => {
      store.releaseWrites();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current.justRecordedDistribution).toBeNull();
  });

  it('should record once when a daily game transitions from playing to won', async () => {
    const store = createMemoryStore();
    const { rerender } = await renderHook(
      ({ session }: { session: GameSession }) => useResultRecorder({ store, mode: 'daily', wordLength: 5, session, today }),
      { initialProps: { session: buildSession('ready', 'playing') } },
    );

    await rerender({ session: buildSession('ready', 'won', ['KALEM']) });
    await flushPendingWrites();

    const stats = await loadDailyStats(store, 5);
    expect(stats.gamesPlayed).toBe(1);
    expect(stats.gamesWon).toBe(1);

    await rerender({ session: buildSession('ready', 'won', ['KALEM']) });
    await flushPendingWrites();
    const unchangedStats = await loadDailyStats(store, 5);
    expect(unchangedStats.gamesPlayed).toBe(1);
  });

  it('should not record a daily game that was already finished when restored from storage', async () => {
    const store = createMemoryStore();
    const { rerender } = await renderHook(
      ({ session }: { session: GameSession }) => useResultRecorder({ store, mode: 'daily', wordLength: 5, session, today }),
      { initialProps: { session: buildSession('loading', 'playing') } },
    );

    await rerender({ session: buildSession('ready', 'won', ['KALEM']) });
    await flushPendingWrites();

    const stats = await loadDailyStats(store, 5);
    expect(stats.gamesPlayed).toBe(0);
  });

  it('should record each finished round of an unlimited game', async () => {
    const store: KeyValueStore = createMemoryStore();
    const { rerender } = await renderHook(
      ({ session }: { session: GameSession }) => useResultRecorder({ store, mode: 'unlimited', wordLength: 5, session, today }),
      { initialProps: { session: buildSession('ready', 'playing', [], null) } },
    );

    await rerender({ session: buildSession('ready', 'won', ['KALEM'], null) });
    await flushPendingWrites();
    await rerender({ session: buildSession('loading', 'playing', [], null) });
    await rerender({ session: buildSession('ready', 'playing', [], null) });
    await rerender({ session: buildSession('ready', 'lost', ['A', 'B', 'C', 'D', 'E', 'F'], null) });
    await flushPendingWrites();

    const stats = await loadUnlimitedStats(store, 5);
    expect(stats.gamesPlayed).toBe(2);
    expect(stats.gamesWon).toBe(1);
  });

  it('should record a daily result under the date the game was loaded, not the date it finished', async () => {
    const store = createMemoryStore();
    const crossesMidnight = () => '2026-10-06';
    const { rerender } = await renderHook(
      ({ session }: { session: GameSession }) =>
        useResultRecorder({ store, mode: 'daily', wordLength: 5, session, today: crossesMidnight }),
      { initialProps: { session: buildSession('ready', 'playing', [], '2026-10-05') } },
    );

    await rerender({ session: buildSession('ready', 'won', ['KALEM'], '2026-10-05') });
    await flushPendingWrites();

    const stats = await loadDailyStats(store, 5);
    expect(stats.lastPlayedDate).toBe('2026-10-05');
  });

  it('should serialize writes so a second finish cannot read stale data from an unsettled first write', async () => {
    const store = createControllableStore();
    const { rerender } = await renderHook(
      ({ session }: { session: GameSession }) => useResultRecorder({ store, mode: 'unlimited', wordLength: 5, session, today }),
      { initialProps: { session: buildSession('ready', 'playing', [], null) } },
    );

    await rerender({ session: buildSession('ready', 'won', ['KALEM'], null) });
    await rerender({ session: buildSession('loading', 'playing', [], null) });
    await rerender({ session: buildSession('ready', 'playing', [], null) });
    await rerender({ session: buildSession('ready', 'lost', ['A', 'B', 'C', 'D', 'E', 'F'], null) });

    await act(async () => {
      store.releaseWrites();
      await waitUntil(async () => (await loadUnlimitedStats(store, 5)).gamesPlayed === 2);
    });

    const stats = await loadUnlimitedStats(store, 5);
    expect(stats.gamesPlayed).toBe(2);
    expect(stats.gamesWon).toBe(1);
  });
});
