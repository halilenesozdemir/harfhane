import { useEffect, useState } from 'react';
import { getTimeUntilMidnight } from '@harfhane/shared';

const COUNTDOWN_TICK_MS = 1000;

function readCountdown(now: () => Date): string {
  const { hours, minutes, seconds } = getTimeUntilMidnight(now());
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * `hh:mm:ss` until the next Turkey midnight, ticking once a second only
 * while `enabled` (mobile-redesign-spec.md section B: "updates each second
 * only while visible"). Isolated from `useHomeStatus` so the rest of the
 * home screen does not re-render on every tick — only the component that
 * actually shows the countdown (DailyCard, while a countdown chip is
 * visible) does.
 */
export function useCountdown(now: () => Date, enabled: boolean): string {
  const [countdown, setCountdown] = useState(() => readCountdown(now));
  const [wasEnabled, setWasEnabled] = useState(enabled);

  // Recompute during render (not in the effect below) the instant `enabled`
  // flips true: it can flip long after the initial (lazy) state was read,
  // and without this the chip would show that stale value until the first
  // tick, up to COUNTDOWN_TICK_MS later. Same "adjust state while
  // rendering" pattern as useHomeStatus.ts's useLoadedStatus.
  if (enabled !== wasEnabled) {
    setWasEnabled(enabled);
    if (enabled) setCountdown(readCountdown(now));
  }

  useEffect(() => {
    if (!enabled) return undefined;
    const timer = setInterval(() => setCountdown(readCountdown(now)), COUNTDOWN_TICK_MS);
    return () => clearInterval(timer);
  }, [now, enabled]);

  return countdown;
}
