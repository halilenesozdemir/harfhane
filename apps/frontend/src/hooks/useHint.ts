import { useLocalStorage } from './useLocalStorage';
import type { WordLength } from '../types';
import { getTodayString, hintAllowance, pickHint, type HintMode, type LetterHint } from '@harfhane/shared';

interface UseHintReturn {
  hint: LetterHint | null;
  hintUsed: boolean;
  hintAvailable: boolean;
  revealHint: () => void;
}

const NO_OP_HINT: UseHintReturn = {
  hint: null,
  hintUsed: false,
  hintAvailable: false,
  revealHint: () => {},
};

// The storage key predates this shape (it used to hold a boolean "used" flag,
// and it was also shared between daily and unlimited mode); a stale legacy
// value must not crash the hook, so anything that isn't a well-formed set of
// in-range positions is treated as "nothing revealed yet".
function sanitizeRevealedPositions(value: unknown, wordLength: number): number[] {
  if (!Array.isArray(value)) return [];
  const isValidPosition = (position: unknown): position is number =>
    typeof position === 'number' && Number.isInteger(position) && position >= 0 && position < wordLength;
  return value.every(isValidPosition) ? value : [];
}

// One-time, read-only fallback so a daily hint revealed before mode-scoped
// keys existed isn't lost; never written back directly (a later reveal
// persists under the new mode-scoped key instead).
function readLegacyDailyPositions(legacyKey: string, wordLength: number): number[] {
  try {
    const raw = window.localStorage.getItem(legacyKey);
    return sanitizeRevealedPositions(raw ? JSON.parse(raw) : [], wordLength);
  } catch {
    return [];
  }
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
  // Mode-scoped: daily and unlimited must never read or write each other's
  // revealed positions, even for the same word length on the same day.
  const storageKey = `harfhane:hint:${mode}:${today}:${wordLength}`;
  const [storedValue, setStoredValue] = useLocalStorage<unknown>(storageKey, []);

  let revealedPositions = sanitizeRevealedPositions(storedValue, wordLength);
  if (revealedPositions.length === 0 && mode === 'daily') {
    revealedPositions = readLegacyDailyPositions(`harfhane:hint:${today}:${wordLength}`, wordLength);
  }

  // Unlimited currently grants no hints at all (FREE_UNLIMITED_HINTS = 0):
  // short-circuit before anything can read stale storage back as a live hint.
  if (allowance === 0) return NO_OP_HINT;

  const hint = deriveHint(revealedPositions, solution);
  const hintUsed = revealedPositions.length >= allowance;
  const nextPickableHint = hint === null ? pickHint(solution, guesses, revealedPositions) : null;

  // Hidden when nothing has been revealed yet and there is no further
  // position left to pick (e.g. every letter is already solved by submitted
  // guesses) — a button that can never do anything on click must not render
  // as if it could.
  const hintAvailable = hint !== null || hintUsed || nextPickableHint !== null;

  const revealHint = (): void => {
    if (hintUsed || !hintAvailable) return;
    const next = pickHint(solution, guesses, revealedPositions);
    if (next === null) return;
    setStoredValue((prev: unknown) => addRevealedPosition(prev, next.position, wordLength));
  };

  return { hint, hintUsed, hintAvailable, revealHint };
}
