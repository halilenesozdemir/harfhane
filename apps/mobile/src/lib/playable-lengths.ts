import { useEffect, useState } from 'react';
import type { ApiClient } from './api';
import type { KeyValueStore } from '../game/game-storage';
import type { WordLength } from '../stats/stats';

/** R1: fallback used before the first successful fetch and when nothing is cached. */
export const DEFAULT_PLAYABLE_LENGTHS: readonly WordLength[] = [5];

export const PLAYABLE_LENGTHS_STORAGE_KEY = 'harfhane:playable-lengths';

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
 * Fetches the playable lengths and caches them for offline/failure use
 * (AE2: a failed request falls back to the cache, then to [5]).
 */
export async function fetchPlayableLengths(api: ApiClient, store: KeyValueStore): Promise<readonly WordLength[]> {
  try {
    const response = await api.fetchPlayableLengths();
    const lengths = parseLengths(response.lengths) ?? DEFAULT_PLAYABLE_LENGTHS;
    await saveCachedPlayableLengths(store, lengths);
    return lengths;
  } catch {
    const cached = await loadCachedPlayableLengths(store);
    return cached ?? DEFAULT_PLAYABLE_LENGTHS;
  }
}

/**
 * Shows the cached list immediately (if any) while the fresh fetch resolves,
 * so a returning player doesn't flash down to [5] on every cold start.
 */
export function usePlayableLengths(api: ApiClient, store: KeyValueStore): readonly WordLength[] {
  const [lengths, setLengths] = useState<readonly WordLength[]>(DEFAULT_PLAYABLE_LENGTHS);

  useEffect(() => {
    let isCurrent = true;

    loadCachedPlayableLengths(store).then((cached) => {
      if (isCurrent && cached) setLengths(cached);
    });

    fetchPlayableLengths(api, store).then((result) => {
      if (isCurrent) setLengths(result);
    });

    return () => {
      isCurrent = false;
    };
  }, [api, store]);

  return lengths;
}
