import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { getTimeUntilMidnight, getTodayString } from '@harfhane/shared';
import { dailyGameKey } from '../game/game-state';
import { loadGameState } from '../game/game-storage';
import { loadDailyStats } from '../stats/stats';
import { getTodayStatus } from './today-status';
import type { KeyValueStore } from '../game/game-storage';
import type { WordLength } from '../stats/stats';
import type { TodayStatus } from './today-status';

export interface UseHomeStatusResult {
  /** Null until the stored stats and daily game state have both loaded (mobile-redesign-spec.md section B, "Loading"). */
  readonly status: TodayStatus | null;
  /** `hh:mm:ss` until the next Turkey midnight, ticking once a second. */
  readonly countdown: string;
}

interface TurkeyClock {
  readonly today: string;
  readonly countdown: string;
}

const COUNTDOWN_TICK_MS = 1000;

// A stable module-level reference: a fresh arrow function as the default
// parameter value would be re-created on every render, forever changing
// useTurkeyClock's effect dependency and re-creating its interval/AppState
// subscription on every render (countdown drift, a frozen clock in the
// worst case) instead of once on mount.
function defaultNow(): Date {
  return new Date();
}

function readClock(now: () => Date): TurkeyClock {
  const { hours, minutes, seconds } = getTimeUntilMidnight(now());
  return { today: getTodayString(now()), countdown: `${hours}:${minutes}:${seconds}` };
}

/**
 * Ticks every second and whenever the app returns to the foreground, so the
 * daily card sees both the live countdown and, once the Turkey day actually
 * rolls over, the new day (mobile-redesign-spec.md section B, "Midnight").
 */
function useTurkeyClock(now: () => Date): TurkeyClock {
  const [clock, setClock] = useState(() => readClock(now));
  useEffect(() => {
    const tick = () => setClock(readClock(now));
    const timer = setInterval(tick, COUNTDOWN_TICK_MS);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') tick();
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [now]);
  return clock;
}

function useLoadedStatus(store: KeyValueStore, length: WordLength, today: string): TodayStatus | null {
  const [status, setStatus] = useState<TodayStatus | null>(null);

  useEffect(() => {
    let isCurrent = true;
    Promise.all([loadDailyStats(store, length), loadGameState(store, dailyGameKey(today, length))]).then(
      ([stats, game]) => {
        if (isCurrent) setStatus(getTodayStatus(stats, game, today));
      },
    );
    return () => {
      isCurrent = false;
    };
  }, [store, length, today]);

  return status;
}

/** Drives the daily mode card (mobile-redesign-spec.md section B): today's state, the displayed streak and the midnight countdown. */
export function useHomeStatus(store: KeyValueStore, length: WordLength, now: () => Date = defaultNow): UseHomeStatusResult {
  const { today, countdown } = useTurkeyClock(now);
  const status = useLoadedStatus(store, length, today);
  return { status, countdown };
}
