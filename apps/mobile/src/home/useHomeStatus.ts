import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { getTodayString } from '@harfhane/shared';
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
}

const DAY_CHECK_TICK_MS = 1000;

// A stable module-level reference: a fresh arrow function as the default
// parameter value would be re-created on every render, forever changing
// useTurkeyDay's effect dependency and re-creating its interval/AppState
// subscription on every render (a frozen day-rollover check in the worst
// case) instead of once on mount.
function defaultNow(): Date {
  return new Date();
}

function fallbackStatus(): TodayStatus {
  return { displayedStreak: 0, state: { kind: 'not-started' } };
}

/**
 * Tracks the Turkey day string, re-rendering only once the day actually
 * rolls over (mobile-redesign-spec.md section B, "Midnight"): the interval
 * checks every second but only calls setState when the computed day
 * differs from the previous one, so a home screen driven by this hook does
 * not re-render every second the way a raw per-second clock would. The
 * live countdown display is a separate concern (`useCountdown`), ticked
 * only by the component that actually shows it.
 */
function useTurkeyDay(now: () => Date): string {
  const [today, setToday] = useState(() => getTodayString(now()));
  useEffect(() => {
    const checkDay = () => {
      const current = getTodayString(now());
      setToday((previous) => (previous === current ? previous : current));
    };
    const timer = setInterval(checkDay, DAY_CHECK_TICK_MS);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') checkDay();
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [now]);
  return today;
}

function useLoadedStatus(store: KeyValueStore, length: WordLength, today: string): TodayStatus | null {
  const loadKey = `${length}:${today}`;
  const [loadedKey, setLoadedKey] = useState(loadKey);
  const [status, setStatus] = useState<TodayStatus | null>(null);

  // Drop the previous length/day's status during render, not in the effect
  // below: otherwise its state would briefly show for the newly selected
  // length/day while the effect's own load is still in flight. This is
  // React's "adjust state while rendering" pattern, not a side effect.
  if (loadKey !== loadedKey) {
    setLoadedKey(loadKey);
    setStatus(null);
  }

  useEffect(() => {
    let isCurrent = true;
    Promise.all([loadDailyStats(store, length), loadGameState(store, dailyGameKey(today, length))])
      .then(([stats, game]) => {
        if (isCurrent) setStatus(getTodayStatus(stats, game, today));
      })
      .catch(() => {
        // A rejecting store must not leave status null forever (and must
        // not throw an unhandled rejection): fall back to a defined
        // not-started/streak-0 status, matching how useResultRecorder
        // handles a rejecting store on main.
        if (isCurrent) setStatus(fallbackStatus());
      });
    return () => {
      isCurrent = false;
    };
  }, [store, length, today]);

  return status;
}

/** Drives the daily mode card (mobile-redesign-spec.md section B): today's state and the displayed streak. */
export function useHomeStatus(store: KeyValueStore, length: WordLength, now: () => Date = defaultNow): UseHomeStatusResult {
  const today = useTurkeyDay(now);
  const status = useLoadedStatus(store, length, today);
  return { status };
}
