import { useCallback, useEffect, useState } from 'react';
import { hintAllowance, pickHint } from '@harfhane/shared';
import type { LetterHint } from '@harfhane/shared';
import type { GameMode } from './game-session';
import { hintStorageKey } from './game-state';
import { loadRevealedHints, saveRevealedHints } from './game-storage';
import type { KeyValueStore } from './game-storage';

// Supporter status is not purchasable yet (Plan 008 R7); the perk ships in Plan 005 Phase 4.
const IS_SUPPORTER = false;

export interface UseHintOptions {
  readonly store: KeyValueStore;
  readonly mode: GameMode;
  readonly wordLength: number;
  readonly dailyDate: string | null;
  // Submitted guesses only — the in-progress row must never reach pickHint, or an unsubmitted
  // correct letter would be treated as solved and the hint would skip past it.
  readonly guesses: readonly string[];
  readonly solution: string;
}

export interface UseHintResult {
  readonly hints: readonly LetterHint[];
  // True once at least one position has been revealed, even if `hints` could not render it
  // (e.g. a stale position outside the current solution's length).
  readonly isUsed: boolean;
  readonly allowance: number;
  readonly canReveal: boolean;
  revealHint(): void;
}

const NO_REVEALED_POSITIONS: readonly number[] = [];

interface LoadedHints {
  readonly key: string | null;
  readonly positions: readonly number[];
}

const NOT_YET_LOADED: LoadedHints = { key: null, positions: NO_REVEALED_POSITIONS };

// Derives "loaded for the current key" by comparing keys at render time, instead of resetting
// state inside the effect — a stale load from a previous key is never mistaken for "ready" and
// a reveal can never race ahead of the load it depends on (revealHint checks `isLoaded` too).
function useRevealedPositions(store: KeyValueStore, mode: GameMode, dailyDate: string | null, wordLength: number) {
  const [loaded, setLoaded] = useState<LoadedHints>(NOT_YET_LOADED);
  const isDaily = mode === 'daily' && dailyDate !== null;
  const currentKey = isDaily ? hintStorageKey(mode, dailyDate, wordLength) : null;

  useEffect(() => {
    if (currentKey === null) return undefined;
    let isCurrent = true;
    void loadRevealedHints(store, currentKey, wordLength).then((positions) => {
      if (isCurrent) setLoaded({ key: currentKey, positions });
    });
    return () => {
      isCurrent = false;
    };
  }, [store, currentKey, wordLength]);

  const isLoaded = !isDaily || loaded.key === currentKey;
  const revealed = isDaily && loaded.key === currentKey ? loaded.positions : NO_REVEALED_POSITIONS;
  return { revealed, isLoaded, setRevealed: (positions: readonly number[]) => setLoaded({ key: currentKey, positions }) };
}

function toHints(solution: string, revealed: readonly number[]): LetterHint[] {
  const letters = Array.from(solution);
  return revealed
    .map((position) => ({ position, letter: letters[position] }))
    .filter((hint): hint is LetterHint => typeof hint.letter === 'string');
}

function nextHint(solution: string, guesses: readonly string[], revealed: readonly number[]): LetterHint | null {
  return pickHint(solution, [...guesses], [...revealed]);
}

export function useHint({ store, mode, wordLength, dailyDate, solution, guesses }: UseHintOptions): UseHintResult {
  const { revealed, isLoaded, setRevealed } = useRevealedPositions(store, mode, dailyDate, wordLength);
  const allowance = hintAllowance(mode, IS_SUPPORTER);
  const hasAllowanceLeft = mode === 'daily' && dailyDate !== null && revealed.length < allowance;
  const canReveal = hasAllowanceLeft && isLoaded && nextHint(solution, guesses, revealed) !== null;

  const revealHint = useCallback(() => {
    if (!hasAllowanceLeft || !isLoaded || dailyDate === null) return;
    const hint = nextHint(solution, guesses, revealed);
    if (hint === null || revealed.includes(hint.position)) return;
    const next = [...revealed, hint.position];
    setRevealed(next);
    void saveRevealedHints(store, hintStorageKey(mode, dailyDate, wordLength), next);
  }, [hasAllowanceLeft, isLoaded, solution, guesses, revealed, setRevealed, mode, dailyDate, store, wordLength]);

  return { hints: toHints(solution, revealed), isUsed: revealed.length > 0, allowance, canReveal, revealHint };
}
