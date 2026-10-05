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
  readonly today: () => string;
}

async function recordResult({ store, mode, wordLength, won, guessCount, today }: RecordResultOptions): Promise<void> {
  if (mode === 'daily') {
    const stats = await loadDailyStats(store, wordLength);
    await saveDailyStats(store, wordLength, recordDailyResult(stats, won, guessCount, today()));
    return;
  }
  const stats = await loadUnlimitedStats(store, wordLength);
  await saveUnlimitedStats(store, wordLength, recordUnlimitedResult(stats, won, guessCount));
}

export function useResultRecorder({ store, mode, wordLength, session, today = getTodayString }: UseResultRecorderOptions): void {
  const { phase, game } = session;
  const previousPhaseRef = useRef(phase);
  const previousStatusRef = useRef(game.gameStatus);

  useEffect(() => {
    const wasReadyPlaying = previousPhaseRef.current === 'ready' && previousStatusRef.current === 'playing';
    const isNowFinished = phase === 'ready' && game.gameStatus !== 'playing';
    if (wasReadyPlaying && isNowFinished) {
      void recordResult({ store, mode, wordLength, won: game.gameStatus === 'won', guessCount: game.guesses.length, today });
    }
    previousPhaseRef.current = phase;
    previousStatusRef.current = game.gameStatus;
  }, [phase, game.gameStatus, game.guesses.length, store, mode, wordLength, today]);
}
