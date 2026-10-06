import { SCHEDULED_WORD_LENGTHS, type ScheduledWordLength } from '../constants/schedule';

export const DEFAULT_PLAYABLE_WORD_LENGTHS: readonly ScheduledWordLength[] = [5];

function isScheduledLength(length: number): length is ScheduledWordLength {
  return (SCHEDULED_WORD_LENGTHS as readonly number[]).includes(length);
}

/**
 * Parses the comma-separated PLAYABLE_WORD_LENGTHS worker var, keeping only
 * scheduled lengths (R1). Falls back to DEFAULT_PLAYABLE_WORD_LENGTHS when the
 * value is missing or every entry is invalid.
 */
export function parsePlayableLengths(raw: string | undefined): ScheduledWordLength[] {
  if (!raw) return [...DEFAULT_PLAYABLE_WORD_LENGTHS];

  const parsed = raw
    .split(',')
    .map((part) => Number.parseInt(part.trim(), 10))
    .filter(isScheduledLength);

  const unique = Array.from(new Set(parsed)).sort((a, b) => a - b);

  return unique.length > 0 ? unique : [...DEFAULT_PLAYABLE_WORD_LENGTHS];
}
