import { useCallback, useEffect, useRef, useState } from 'react';
import { base } from '@harfhane/ui-tokens';
import { parseMs } from '../utils/ms';

export type LaunchIntroPhase = 'mark' | 'tiles' | 'wordmark' | 'crossfade' | 'done';

export interface UseLaunchIntroPhasesResult {
  readonly phase: LaunchIntroPhase;
  /** Row 2 ("HARF") has finished its flip and should play its staggered win-style bounce. */
  readonly row2Celebrate: boolean;
  /** Skips straight to the end: used by the tap-anywhere-to-skip gesture. */
  readonly skip: () => void;
}

const MARK_MS = parseMs(base.motionBase);
// Owner decision 2026-10-09 asks for "~150 ms" between tiles, distinct from the shared
// motion-stagger token (100ms) used for in-game reveals.
const ROW_STAGGER_MS = 150;
const FLIP_MS = parseMs(base.motionFlip);
const BOUNCE_MS = parseMs(base.motionBounce);
const TILES_PER_ROW = 4;
// Row 2 starts once row 1's last tile has begun flipping, so the two rows read as one
// continuous wave across 8 tiles instead of two fully sequential 950ms blocks (which alone
// would already blow past the owner's "about 2 s" budget for the whole intro).
const ROW2_START_MS = (TILES_PER_ROW - 1) * ROW_STAGGER_MS;
const TILES_FLIP_DONE_MS = ROW2_START_MS + (TILES_PER_ROW - 1) * ROW_STAGGER_MS + FLIP_MS;
// A small, barely-staggered jump across row 2, not a full ROW_STAGGER_MS sweep (owner: "a small
// staggered jump").
const BOUNCE_STAGGER_MS = 30;
const CELEBRATE_DONE_MS = TILES_FLIP_DONE_MS + (TILES_PER_ROW - 1) * BOUNCE_STAGGER_MS + BOUNCE_MS;
const WORDMARK_MS = 250;
// How long the fully-gathered wordmark + subtitle hold on screen, steady, before the overlay
// starts its cross-fade — long enough to actually read "harfhane" / the subtitle, not just flash
// past them (owner 2026-10-09: readable, not instant).
const WORDMARK_HOLD_MS = 600;
const CROSSFADE_MS = MARK_MS;
// The tile rows are mounted (and their reveal timers armed) the instant LaunchIntro itself
// mounts, at t=0 — but the tiles layer they sit in only starts fading in once `phase` reaches
// 'tiles', at t=MARK_MS. Without this offset the flips visibly start while still fading in, and
// (since row2Celebrate is scheduled from MARK_MS + TILES_FLIP_DONE_MS, i.e. relative to the real
// phase change) the bounce would then also wait out an extra, dead MARK_MS doing nothing.
const TILE_REVEAL_START_MS = MARK_MS;

export const LAUNCH_INTRO_TIMING = {
  MARK_MS,
  ROW_STAGGER_MS,
  ROW2_START_MS,
  BOUNCE_STAGGER_MS,
  WORDMARK_MS,
  WORDMARK_HOLD_MS,
  CROSSFADE_MS,
  TILE_REVEAL_START_MS,
} as const;

/**
 * Orchestrates the cold-start launch intro's phases on plain timers (like Tile's own flip
 * mid-point timer), so the sequence is deterministic under fake timers in tests. Each phase's
 * own visuals (opacity/transform) are driven by the component from `phase`/`row2Celebrate`.
 */
export function useLaunchIntroPhases(reduceMotion: boolean, onDone: () => void): UseLaunchIntroPhasesResult {
  const [phase, setPhase] = useState<LaunchIntroPhase>(reduceMotion ? 'done' : 'mark');
  const [row2Celebrate, setRow2Celebrate] = useState(false);
  const isDoneRef = useRef(false);
  const timerIdsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const clearTimers = useCallback(() => {
    timerIdsRef.current.forEach(clearTimeout);
    timerIdsRef.current = [];
  }, []);

  const finish = useCallback(() => {
    if (isDoneRef.current) return;
    isDoneRef.current = true;
    clearTimers();
    setPhase('done');
    onDoneRef.current();
  }, [clearTimers]);

  // useReduceMotion() always starts false and resolves asynchronously (AccessibilityInfo is a
  // native call), so reduceMotion can flip to true a moment after this mounts — finishing then
  // must still skip the rest of the intro, exactly like a flip turning reduce motion on mid-flip
  // (Tile.tsx's own useFlipAnimation). A later flip back to false must never restart a finished
  // intro, which `finish`'s doneRef guard already ensures.
  useEffect(() => {
    if (reduceMotion) finish();
  }, [reduceMotion, finish]);

  useEffect(() => {
    const schedule = (run: () => void, delayMs: number) => {
      timerIdsRef.current.push(setTimeout(run, delayMs));
    };

    schedule(() => setPhase('tiles'), MARK_MS);
    schedule(() => setRow2Celebrate(true), MARK_MS + TILES_FLIP_DONE_MS);
    schedule(() => setPhase('wordmark'), MARK_MS + CELEBRATE_DONE_MS);
    schedule(() => setPhase('crossfade'), MARK_MS + CELEBRATE_DONE_MS + WORDMARK_MS + WORDMARK_HOLD_MS);
    schedule(finish, MARK_MS + CELEBRATE_DONE_MS + WORDMARK_MS + WORDMARK_HOLD_MS + CROSSFADE_MS);

    return clearTimers;
    // Scheduled once per mount regardless of reduceMotion's initial value: the effect above
    // cancels these the moment reduceMotion is (or becomes) true, via finish()'s doneRef guard.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { phase, row2Celebrate, skip: finish };
}
