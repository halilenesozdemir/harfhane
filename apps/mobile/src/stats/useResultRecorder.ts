import { useEffect, useRef } from 'react';
import { getTodayString } from '@harfhane/shared';
import type { KeyValueStore } from '../game/game-storage';
import type { GameMode, GameSession } from '../game/game-session';
import type { WordLength } from './stats';
import {
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

interface RecordResultOptions {
  readonly store: KeyValueStore;
  readonly mode: GameMode;
  readonly wordLength: WordLength;
  readonly won: boolean;
  readonly guessCount: number;
  readonly dailyDate: string | null;
  readonly today: () => string;
}

async function recordResult({ store, mode, wordLength, won, guessCount, dailyDate, today }: RecordResultOptions): Promise<void> {
  if (mode === 'daily') {
    const stats = await loadDailyStats(store, wordLength);
    await saveDailyStats(store, wordLength, recordDailyResult(stats, won, guessCount, dailyDate ?? today()));
    return;
  }
  const stats = await loadUnlimitedStats(store, wordLength);
  await saveUnlimitedStats(store, wordLength, recordUnlimitedResult(stats, won, guessCount));
}

const pendingWrites = new Map<string, Promise<void>>();

function recordQueueKey(mode: GameMode, wordLength: WordLength): string {
  return `${mode}:${wordLength}`;
}

function enqueueRecordResult(options: RecordResultOptions): void {
  const key = recordQueueKey(options.mode, options.wordLength);
  const previous = pendingWrites.get(key) ?? Promise.resolve();
  const next = previous.then(() => recordResult(options));
  pendingWrites.set(key, next.catch(() => undefined));
}

export function useResultRecorder({ store, mode, wordLength, session, today = getTodayString }: UseResultRecorderOptions): void {
  const { phase, game, dailyDate } = session;
  const previousPhaseRef = useRef(phase);
  const previousStatusRef = useRef(game.gameStatus);

  useEffect(() => {
    const wasReadyPlaying = previousPhaseRef.current === 'ready' && previousStatusRef.current === 'playing';
    const isNowFinished = phase === 'ready' && game.gameStatus !== 'playing';
    if (wasReadyPlaying && isNowFinished) {
      enqueueRecordResult({
        store,
        mode,
        wordLength,
        won: game.gameStatus === 'won',
        guessCount: game.guesses.length,
        dailyDate,
        today,
      });
    }
    previousPhaseRef.current = phase;
    previousStatusRef.current = game.gameStatus;
  }, [phase, game.gameStatus, game.guesses.length, store, mode, wordLength, dailyDate, today]);
}
