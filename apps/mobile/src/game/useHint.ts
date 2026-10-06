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
  readonly allowance: number;
  readonly canReveal: boolean;
  revealHint(): void;
}

const NO_REVEALED_POSITIONS: readonly number[] = [];

function useRevealedPositions(store: KeyValueStore, mode: GameMode, dailyDate: string | null, wordLength: number) {
  const [loaded, setLoaded] = useState<readonly number[]>(NO_REVEALED_POSITIONS);
  useEffect(() => {
    if (mode !== 'daily' || dailyDate === null) return undefined;
    let isCurrent = true;
    void loadRevealedHints(store, hintStorageKey(mode, dailyDate, wordLength), wordLength).then((positions) => {
      if (isCurrent) setLoaded(positions);
    });
    return () => {
      isCurrent = false;
    };
  }, [store, mode, dailyDate, wordLength]);
  const isDaily = mode === 'daily' && dailyDate !== null;
  return [isDaily ? loaded : NO_REVEALED_POSITIONS, setLoaded] as const;
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
  const [revealed, setRevealed] = useRevealedPositions(store, mode, dailyDate, wordLength);
  const allowance = hintAllowance(mode, IS_SUPPORTER);
  const hasAllowanceLeft = mode === 'daily' && dailyDate !== null && revealed.length < allowance;
  const canReveal = hasAllowanceLeft && nextHint(solution, guesses, revealed) !== null;

  const revealHint = useCallback(() => {
    if (!hasAllowanceLeft || dailyDate === null) return;
    const hint = nextHint(solution, guesses, revealed);
    if (hint === null || revealed.includes(hint.position)) return;
    const next = [...revealed, hint.position];
    setRevealed(next);
    void saveRevealedHints(store, hintStorageKey(mode, dailyDate, wordLength), next);
  }, [hasAllowanceLeft, solution, guesses, revealed, setRevealed, mode, dailyDate, store, wordLength]);

  return { hints: toHints(solution, revealed), allowance, canReveal, revealHint };
}
