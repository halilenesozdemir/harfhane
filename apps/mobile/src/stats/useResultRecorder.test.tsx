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

describe('useResultRecorder', () => {
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
