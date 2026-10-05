import { act, renderHook } from '@testing-library/react-native';
import { createMemoryStore } from '../test-utils/render-with-theme';
import { loadDailyStats, loadUnlimitedStats } from './stats';
import { useResultRecorder } from './useResultRecorder';
import type { KeyValueStore } from '../game/game-storage';
import type { GameSession } from '../game/game-session';

const TODAY = '2026-10-05';
const today = () => TODAY;

function buildSession(phase: GameSession['phase'], gameStatus: GameSession['game']['gameStatus'], guesses: readonly string[] = []): GameSession {
  return {
    phase,
    solution: 'KALEM',
    wordId: null,
    message: null,
    isSubmitting: false,
    storageKey: null,
    game: { guesses: [...guesses], evaluations: [], currentGuess: '', gameStatus, keyboardStatus: {} },
  };
}

async function flushPendingWrites(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
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
      { initialProps: { session: buildSession('ready', 'playing') } },
    );

    await rerender({ session: buildSession('ready', 'won', ['KALEM']) });
    await flushPendingWrites();
    await rerender({ session: buildSession('loading', 'playing') });
    await rerender({ session: buildSession('ready', 'playing') });
    await rerender({ session: buildSession('ready', 'lost', ['A', 'B', 'C', 'D', 'E', 'F']) });
    await flushPendingWrites();

    const stats = await loadUnlimitedStats(store, 5);
    expect(stats.gamesPlayed).toBe(2);
    expect(stats.gamesWon).toBe(1);
  });

  it('should not lose a write when a second round finishes before the first write settles', async () => {
    const store: KeyValueStore = createMemoryStore();
    const { rerender } = await renderHook(
      ({ session }: { session: GameSession }) => useResultRecorder({ store, mode: 'unlimited', wordLength: 5, session, today }),
      { initialProps: { session: buildSession('ready', 'playing') } },
    );

    await rerender({ session: buildSession('ready', 'won', ['KALEM']) });
    await rerender({ session: buildSession('loading', 'playing') });
    await rerender({ session: buildSession('ready', 'playing') });
    await rerender({ session: buildSession('ready', 'lost', ['A', 'B', 'C', 'D', 'E', 'F']) });
    await flushPendingWrites();

    const stats = await loadUnlimitedStats(store, 5);
    expect(stats.gamesPlayed).toBe(2);
    expect(stats.gamesWon).toBe(1);
  });
});
