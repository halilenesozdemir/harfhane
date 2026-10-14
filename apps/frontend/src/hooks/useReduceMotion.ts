import { useEffect, useState } from 'react';

const REDUCE_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/**
 * One subscription to the OS "reduce motion" preference, read by GameGrid and
 * passed down to every Tile (R5), mirroring
 * apps/mobile/src/ui/motion/useReduceMotion.ts rather than each tile
 * subscribing to matchMedia on its own.
 */
export function useReduceMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState<boolean>(() =>
    typeof window === 'undefined' ? false : window.matchMedia(REDUCE_MOTION_QUERY).matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(REDUCE_MOTION_QUERY);
    const handleChange = (event: MediaQueryListEvent): void => setReduceMotion(event.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return reduceMotion;
}
