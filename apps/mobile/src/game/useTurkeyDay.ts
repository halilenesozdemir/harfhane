import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

const DAY_CHECK_TICK_MS = 1000;

/**
 * Tracks a day-identifying string returned by `today()`, re-rendering only once it actually
 * changes: a 1s interval polls `today()`, and an `AppState` 'active' listener forces the same
 * check when the app returns to the foreground, so a day that rolled over while the app was
 * backgrounded is caught as soon as it returns, not up to a second later. Shared by the home
 * screen's own day tracker (`useHomeStatus.ts`) and `GameOverCard`'s midnight-rollover check.
 * Pass `enabled: false` to skip the interval/listener entirely (e.g. unlimited mode, which has
 * no Turkey day to track).
 */
export function useTurkeyDay(today: () => string, enabled: boolean = true): string {
  const [current, setCurrent] = useState(() => today());
  useEffect(() => {
    if (!enabled) return undefined;
    const checkDay = () =>
      setCurrent((previous) => {
        const next = today();
        return previous === next ? previous : next;
      });
    const timer = setInterval(checkDay, DAY_CHECK_TICK_MS);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') checkDay();
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [today, enabled]);
  return current;
}
