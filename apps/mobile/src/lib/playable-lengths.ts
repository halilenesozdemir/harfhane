import { useEffect, useState } from 'react';
import type { ApiClient } from './api';
import type { KeyValueStore } from '../game/game-storage';
import type { WordLength } from '../stats/stats';

/** R1: fallback used before the first successful fetch and when nothing is cached or valid. */
export const DEFAULT_PLAYABLE_LENGTHS: readonly WordLength[] = [5];

export const PLAYABLE_LENGTHS_STORAGE_KEY = 'harfhane:playable-lengths';

const PREFERRED_WORD_LENGTH: WordLength = 5;

function isWordLength(value: unknown): value is WordLength {
  return value === 4 || value === 5 || value === 6;
}

function parseLengths(raw: unknown): readonly WordLength[] | null {
  if (!Array.isArray(raw)) return null;
  const lengths = raw.filter(isWordLength);
  return lengths.length > 0 ? lengths : null;
}

function parseCachedJson(raw: string): readonly WordLength[] | null {
  try {
    return parseLengths(JSON.parse(raw));
  } catch {
    return null;
  }
}

export async function loadCachedPlayableLengths(store: KeyValueStore): Promise<readonly WordLength[] | null> {
  const raw = await store.getItem(PLAYABLE_LENGTHS_STORAGE_KEY);
  return raw === null ? null : parseCachedJson(raw);
}

export async function saveCachedPlayableLengths(store: KeyValueStore, lengths: readonly WordLength[]): Promise<void> {
  await store.setItem(PLAYABLE_LENGTHS_STORAGE_KEY, JSON.stringify(lengths));
}

/**
 * Reads the cache, swallowing a read failure (corrupt storage, I/O error):
 * the cache is a best-effort fallback, never a reason to reject.
 */
async function loadCachedPlayableLengthsSafely(store: KeyValueStore): Promise<readonly WordLength[] | null> {
  try {
    return await loadCachedPlayableLengths(store);
  } catch {
    return null;
  }
}

async function fallbackToCacheOrDefault(store: KeyValueStore): Promise<readonly WordLength[]> {
  const cached = await loadCachedPlayableLengthsSafely(store);
  return cached ?? DEFAULT_PLAYABLE_LENGTHS;
}

/**
 * Fetches the playable lengths and caches them for offline/failure use.
 * AE2: a failed request, or one with no valid scheduled length, falls back
 * to the cache, then to [5] — an invalid response never overwrites a good
 * cache with the default guess.
 */
export async function fetchPlayableLengths(api: ApiClient, store: KeyValueStore): Promise<readonly WordLength[]> {
  let response;
  try {
    response = await api.fetchPlayableLengths();
  } catch {
    return fallbackToCacheOrDefault(store);
  }

  const lengths = parseLengths(response.lengths);
  if (!lengths) return fallbackToCacheOrDefault(store);

  try {
    await saveCachedPlayableLengths(store, lengths);
  } catch {
    // A failing cache write must not discard an otherwise-good fetch result.
  }
  return lengths;
}

/**
 * The length to use when none was explicitly picked, or the pick is no
 * longer playable: 5 when it's playable (matches the pre-feature default),
 * otherwise the first playable length. Mirrors the web app's rule
 * (apps/frontend/src/hooks/usePlayableLengths.ts).
 */
export function getDefaultPlayableLength(playableLengths: readonly WordLength[]): WordLength {
  if (playableLengths.includes(PREFERRED_WORD_LENGTH)) return PREFERRED_WORD_LENGTH;
  return playableLengths[0] ?? PREFERRED_WORD_LENGTH;
}

/**
 * A user's explicit pick is kept as long as it's still playable; otherwise
 * (never picked, or the pick left the playable set) falls back to the
 * default (R1).
 */
export function resolveSelectedLength(pickedLength: WordLength | null, playableLengths: readonly WordLength[]): WordLength {
  if (pickedLength !== null && playableLengths.includes(pickedLength)) return pickedLength;
  return getDefaultPlayableLength(playableLengths);
}

/**
 * Shows the cached list immediately (if any) while the fresh fetch resolves,
 * so a returning player doesn't flash down to [5] on every cold start. The
 * cache read and the live fetch race; if the fetch settles first, a
 * later-arriving cache result is ignored so it can never un-apply the
 * fresher fetch result.
 */
export function usePlayableLengths(api: ApiClient, store: KeyValueStore): readonly WordLength[] {
  const [lengths, setLengths] = useState<readonly WordLength[]>(DEFAULT_PLAYABLE_LENGTHS);

  useEffect(() => {
    let isCurrent = true;
    let fetchSettled = false;

    loadCachedPlayableLengthsSafely(store).then((cached) => {
      if (isCurrent && !fetchSettled && cached) setLengths(cached);
    });

    fetchPlayableLengths(api, store).then((result) => {
      fetchSettled = true;
      if (isCurrent) setLengths(result);
    });

    return () => {
      isCurrent = false;
    };
  }, [api, store]);

  return lengths;
}
