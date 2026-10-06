import { useLocalStorage } from './useLocalStorage';
import type { WordLength } from '../types';
import { getTodayString, hintAllowance, pickHint, type HintMode, type LetterHint } from '@harfhane/shared';

interface UseHintReturn {
  hint: LetterHint | null;
  hintUsed: boolean;
  hintAvailable: boolean;
  revealHint: () => void;
}

function deriveHint(revealedPositions: number[], solution: string): LetterHint | null {
  if (revealedPositions.length === 0) return null;
  const position = revealedPositions[revealedPositions.length - 1]!;
  const letter = solution[position];
  if (letter === undefined) return null;
  return { position, letter };
}

export function useHint(
  solution: string,
  wordLength: WordLength,
  guesses: string[],
  isUnlimited: boolean
): UseHintReturn {
  const mode: HintMode = isUnlimited ? 'unlimited' : 'daily';
  const isSupporter = false; // TODO(Plan 005 Phase 4): read the real supporter flag once purchases ship.
  const allowance = hintAllowance(mode, isSupporter);

  const today = getTodayString();
  const storageKey = `harfhane:hint:${today}:${wordLength}`;
  const [revealedPositions, setRevealedPositions] = useLocalStorage<number[]>(storageKey, []);

  const hintAvailable = allowance > 0;
  const hintUsed = revealedPositions.length >= allowance;

  const revealHint = (): void => {
    if (hintUsed || !hintAvailable) return;
    const next = pickHint(solution, guesses, revealedPositions);
    if (next === null) return;
    setRevealedPositions((prev) => [...prev, next.position]);
  };

  return {
    hint: deriveHint(revealedPositions, solution),
    hintUsed,
    hintAvailable,
    revealHint,
  };
}
