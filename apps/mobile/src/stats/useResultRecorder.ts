import { useEffect, useRef, useState } from 'react';
import { getTodayString } from '@harfhane/shared';
import type { KeyValueStore } from '../game/game-storage';
import type { GameMode, GameSession } from '../game/game-session';
import type { WordLength } from './stats';
import {
  createInitialDailyStats,
  createInitialUnlimitedStats,
  loadDailyStats,
  loadUnlimitedStats,
  recordDailyResult,
  recordUnlimitedResult,
  saveDailyStats,
  saveUnlimitedStats,
} from './stats';

export interface UseResultRecorderOptions {
  readonly store: KeyValueStore;
  readonly mode: GameMode;
  readonly wordLength: WordLength;
  readonly session: GameSession;
  readonly today?: () => string;
}

export interface UseResultRecorderResult {
  // The just-finished game's distribution, computed the moment this hook decides to record a
  // result — not read back from storage, so it is available even if the save itself fails, and
  // it cannot lose a race against a child component's own storage read (GameOverDistribution
  // used to read storage directly and, under reduce motion where the game-over card mounts in
  // the same commit as the finish, that child effect could run before this hook's write landed,
  // showing the just-played game's bar as empty). Stays null for a game that was already finished
  // when this hook first saw it (a restored session) — nothing was just recorded, so the display
  // falls back to reading storage for that case.
  readonly justRecordedDistribution: readonly number[] | null;
}

interface RecordResultOptions {
  readonly store: KeyValueStore;
  readonly mode: GameMode;
  readonly wordLength: WordLength;
  readonly won: boolean;
  readonly guessCount: number;
  readonly dailyDate: string | null;
  readonly today: () => string;
}

async function recordResult({ store, mode, wordLength, won, guessCount, dailyDate, today }: RecordResultOptions): Promise<readonly number[]> {
  // A rejected read or write (I/O error, corrupt native module) must still let the player see
  // their own just-played result on screen — fall back to initial stats rather than letting this
  // reject, so the computed distribution below always reflects at least this one game.
  if (mode === 'daily') {
    const stats = await loadDailyStats(store, wordLength).catch(() => createInitialDailyStats());
    const next = recordDailyResult(stats, won, guessCount, dailyDate ?? today());
    await saveDailyStats(store, wordLength, next).catch(() => undefined);
    return next.guessDistribution;
  }
  const stats = await loadUnlimitedStats(store, wordLength).catch(() => createInitialUnlimitedStats());
  const next = recordUnlimitedResult(stats, won, guessCount);
  await saveUnlimitedStats(store, wordLength, next).catch(() => undefined);
  return next.guessDistribution;
}

const pendingWrites = new Map<string, Promise<readonly number[]>>();

function recordQueueKey(mode: GameMode, wordLength: WordLength): string {
  return `${mode}:${wordLength}`;
}

function enqueueRecordResult(options: RecordResultOptions): Promise<readonly number[]> {
  const key = recordQueueKey(options.mode, options.wordLength);
  const previous = pendingWrites.get(key) ?? Promise.resolve<readonly number[]>([]);
  const next = previous.then(() => recordResult(options));
  pendingWrites.set(key, next);
  return next;
}

export function useResultRecorder({ store, mode, wordLength, session, today = getTodayString }: UseResultRecorderOptions): UseResultRecorderResult {
  const { phase, game, dailyDate } = session;
  const previousPhaseRef = useRef(phase);
  const previousStatusRef = useRef(game.gameStatus);
  const [justRecordedDistribution, setJustRecordedDistribution] = useState<readonly number[] | null>(null);

  useEffect(() => {
    const wasReadyPlaying = previousPhaseRef.current === 'ready' && previousStatusRef.current === 'playing';
    const isNowFinished = phase === 'ready' && game.gameStatus !== 'playing';
    previousPhaseRef.current = phase;
    previousStatusRef.current = game.gameStatus;
    if (!wasReadyPlaying || !isNowFinished) return undefined;
    let isCurrent = true;
    enqueueRecordResult({
      store,
      mode,
      wordLength,
      won: game.gameStatus === 'won',
      guessCount: game.guesses.length,
      dailyDate,
      today,
    }).then((distribution) => {
      if (isCurrent) setJustRecordedDistribution(distribution);
    });
    return () => {
      isCurrent = false;
    };
  }, [phase, game.gameStatus, game.guesses.length, store, mode, wordLength, dailyDate, today]);

  return { justRecordedDistribution };
}
