import { useLocalStorage } from './useLocalStorage';
import type { WordLength } from '../types';
import { getTodayString, hintAllowance, pickHint, type HintMode, type LetterHint } from '@harfhane/shared';

interface UseHintReturn {
  hint: LetterHint | null;
  hintUsed: boolean;
  hintAvailable: boolean;
  revealHint: () => void;
}

// The storage key predates this shape (it used to hold a boolean "used" flag);
// a stale legacy value must not crash the hook, so anything that isn't a
// well-formed set of in-range positions is treated as "nothing revealed yet".
function sanitizeRevealedPositions(value: unknown, wordLength: number): number[] {
  if (!Array.isArray(value)) return [];
  const isValidPosition = (position: unknown): position is number =>
    typeof position === 'number' && Number.isInteger(position) && position >= 0 && position < wordLength;
  return value.every(isValidPosition) ? value : [];
}

function deriveHint(revealedPositions: number[], solution: string): LetterHint | null {
  if (revealedPositions.length === 0) return null;
  const position = revealedPositions[revealedPositions.length - 1]!;
  const letter = solution[position];
  if (letter === undefined) return null;
  return { position, letter };
}

function addRevealedPosition(prev: unknown, position: number, wordLength: number): number[] {
  const current = sanitizeRevealedPositions(prev, wordLength);
  return current.includes(position) ? current : [...current, position];
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
  const [storedValue, setStoredValue] = useLocalStorage<unknown>(storageKey, []);
  const revealedPositions = sanitizeRevealedPositions(storedValue, wordLength);

  const hint = deriveHint(revealedPositions, solution);
  const hintUsed = revealedPositions.length >= allowance;
  const nextPickableHint = hint === null ? pickHint(solution, guesses, revealedPositions) : null;

  // Hidden when the mode grants no hints at all, or when nothing has been
  // revealed yet and there is no further position left to pick (e.g. every
  // letter is already solved by submitted guesses) — a button that can never
  // do anything on click must not render as if it could.
  const hintAvailable = allowance > 0 && (hint !== null || hintUsed || nextPickableHint !== null);

  const revealHint = (): void => {
    if (hintUsed || !hintAvailable) return;
    const next = pickHint(solution, guesses, revealedPositions);
    if (next === null) return;
    setStoredValue((prev: unknown) => addRevealedPosition(prev, next.position, wordLength));
  };

  return { hint, hintUsed, hintAvailable, revealHint };
}
