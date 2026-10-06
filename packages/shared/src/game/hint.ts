// Hint allowance per game (owner 2026-10-06, Plan 008 R7). Supporter values apply only once a
// purchase ships (Plan 005); until then every player takes the free path.
export const FREE_DAILY_HINTS = 1;
export const FREE_UNLIMITED_HINTS = 0;
export const SUPPORTER_DAILY_HINTS = 3;
export const SUPPORTER_UNLIMITED_HINTS = 1;

export type HintMode = 'daily' | 'unlimited';

export interface LetterHint {
  position: number;
  letter: string;
}

export const hintAllowance = (mode: HintMode, isSupporter: boolean): number => {
  if (mode === 'daily') return isSupporter ? SUPPORTER_DAILY_HINTS : FREE_DAILY_HINTS;
  return isSupporter ? SUPPORTER_UNLIMITED_HINTS : FREE_UNLIMITED_HINTS;
};

// Inputs are normalized uppercase words. Picks the leftmost position no guess has placed
// correctly and no earlier hint has revealed, so the same board always yields the same hint.
export const pickHint = (solution: string, guesses: string[], revealed: number[]): LetterHint | null => {
  const letters = Array.from(solution);
  const isSolved = (position: number): boolean =>
    guesses.some((guess) => Array.from(guess)[position] === letters[position]);
  const position = letters.findIndex((_, index) => !isSolved(index) && !revealed.includes(index));
  const letter = letters[position];
  if (letter === undefined) return null;
  return { position, letter };
};
