import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { fetchPlayableLengths } from '../lib/api';
import type { PlayableLengthsResponse } from '@harfhane/shared';
import type { WordLength } from '../types';

/** AE2: the backend fallback length, used while loading and on request failure. */
export const DEFAULT_PLAYABLE_LENGTHS: readonly WordLength[] = [5];

const PREFERRED_WORD_LENGTH: WordLength = 5;

/**
 * The length to use when none was explicitly picked: 5 when it's playable
 * (matches the pre-feature default), otherwise the first playable length.
 * Shared with the mobile app's equivalent rule (Plan 008 U3).
 */
export function getDefaultPlayableLength(playableLengths: readonly WordLength[]): WordLength {
  if (playableLengths.includes(PREFERRED_WORD_LENGTH)) return PREFERRED_WORD_LENGTH;
  return playableLengths[0] ?? PREFERRED_WORD_LENGTH;
}

function isWordLength(value: number): value is WordLength {
  return value === 4 || value === 5 || value === 6;
}

function toPlayableLengths(data: PlayableLengthsResponse | undefined): readonly WordLength[] {
  if (!data || !Array.isArray(data.lengths)) return DEFAULT_PLAYABLE_LENGTHS;

  const playable = data.lengths.filter(isWordLength);
  return playable.length > 0 ? playable : DEFAULT_PLAYABLE_LENGTHS;
}

/**
 * Raw query for callers (like the daily/unlimited route) that also need to
 * know whether the result is still loading, e.g. to avoid redirecting away
 * from a requested length before the real answer has arrived.
 */
export function usePlayableLengthsQuery(): UseQueryResult<PlayableLengthsResponse> {
  return useQuery({
    queryKey: ['words', 'lengths'],
    queryFn: fetchPlayableLengths,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

/**
 * Backend decides which word lengths are playable (R1). Cached with
 * staleTime: Infinity so every caller shares one request per session.
 */
export function usePlayableLengths(): readonly WordLength[] {
  const { data } = usePlayableLengthsQuery();
  return toPlayableLengths(data);
}
