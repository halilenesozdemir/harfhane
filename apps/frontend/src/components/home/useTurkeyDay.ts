import { useEffect, useState } from 'react';

const DAY_CHECK_TICK_MS = 1000;

/**
 * Tracks a day-identifying string returned by `today()`, re-rendering only
 * once it actually changes: a 1s interval polls `today()`, and a
 * `visibilitychange` listener forces the same check when the tab becomes
 * visible again, so a day that rolled over while the tab was hidden is
 * caught as soon as it's shown, not up to a second later. Mirrors
 * apps/mobile/src/game/useTurkeyDay.ts (web has no AppState, so this uses
 * the Page Visibility API instead).
 */
export function useTurkeyDay(today: () => string): string {
  const [current, setCurrent] = useState(() => today());

  useEffect(() => {
    const checkDay = (): void => {
      setCurrent((previous) => {
        const next = today();
        return previous === next ? previous : next;
      });
    };
    const onVisibilityChange = (): void => {
      if (document.visibilityState === 'visible') checkDay();
    };

    const intervalId = setInterval(checkDay, DAY_CHECK_TICK_MS);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [today]);

  return current;
}
