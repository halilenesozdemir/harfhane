import { useEffect, useState } from 'react';
import { getTimeUntilMidnight } from '@harfhane/shared';

const TICK_MS = 1000;

// A stable module-level reference: a fresh arrow function as the default
// parameter value would be re-created on every render, forever changing the
// effect's dependency and re-creating the interval on every render instead
// of once on mount (mirrors apps/mobile/src/home/useHomeStatus.ts).
function defaultNow(): Date {
  return new Date();
}

function formatCountdown(now: () => Date): string {
  const { hours, minutes, seconds } = getTimeUntilMidnight(now());
  return `${hours}:${minutes}:${seconds}`;
}

/** Live "HH:MM:SS" until the next Turkey day, ticking every second. */
export function useMidnightCountdown(now: () => Date = defaultNow): string {
  const [countdown, setCountdown] = useState(() => formatCountdown(now));

  useEffect(() => {
    const intervalId = setInterval(() => setCountdown(formatCountdown(now)), TICK_MS);
    return () => clearInterval(intervalId);
  }, [now]);

  return countdown;
}
