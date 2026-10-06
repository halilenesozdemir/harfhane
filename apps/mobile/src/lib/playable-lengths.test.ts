import { describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_PLAYABLE_LENGTHS,
  PLAYABLE_LENGTHS_STORAGE_KEY,
  fetchPlayableLengths,
  loadCachedPlayableLengths,
  saveCachedPlayableLengths,
} from './playable-lengths';
import type { ApiClient } from './api';
import type { KeyValueStore } from '../game/game-storage';

function createStore(initial: Record<string, string> = {}): KeyValueStore {
  const entries = new Map(Object.entries(initial));
  return {
    getItem: vi.fn(async (key: string) => entries.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: string) => {
      entries.set(key, value);
    }),
  };
}

function createApi(impl: Partial<ApiClient> = {}): ApiClient {
  return {
    fetchDailyWord: vi.fn(),
    fetchRandomWord: vi.fn(),
    validateWord: vi.fn(),
    fetchPlayableLengths: vi.fn(),
    ...impl,
  } as ApiClient;
}

describe('loadCachedPlayableLengths', () => {
  it('should return null when nothing is cached', async () => {
    const store = createStore();
    await expect(loadCachedPlayableLengths(store)).resolves.toBeNull();
  });

  it('should return the cached lengths', async () => {
    const store = createStore({ [PLAYABLE_LENGTHS_STORAGE_KEY]: JSON.stringify([4, 5]) });
    await expect(loadCachedPlayableLengths(store)).resolves.toEqual([4, 5]);
  });

  it('should return null for malformed cached JSON', async () => {
    const store = createStore({ [PLAYABLE_LENGTHS_STORAGE_KEY]: 'not json' });
    await expect(loadCachedPlayableLengths(store)).resolves.toBeNull();
  });

  it('should drop lengths that are not scheduled', async () => {
    const store = createStore({ [PLAYABLE_LENGTHS_STORAGE_KEY]: JSON.stringify([5, 7, 0]) });
    await expect(loadCachedPlayableLengths(store)).resolves.toEqual([5]);
  });

  it('should return null when every cached length is invalid', async () => {
    const store = createStore({ [PLAYABLE_LENGTHS_STORAGE_KEY]: JSON.stringify([7, 0]) });
    await expect(loadCachedPlayableLengths(store)).resolves.toBeNull();
  });
});

describe('fetchPlayableLengths', () => {
  it('should fetch, cache and return the lengths on success', async () => {
    const store = createStore();
    const api = createApi({ fetchPlayableLengths: vi.fn().mockResolvedValue({ lengths: [4, 6] }) });
    await expect(fetchPlayableLengths(api, store)).resolves.toEqual([4, 6]);
    await expect(loadCachedPlayableLengths(store)).resolves.toEqual([4, 6]);
  });

  it('should fall back to the cached lengths on request failure', async () => {
    const store = createStore();
    await saveCachedPlayableLengths(store, [4, 5]);
    const api = createApi({ fetchPlayableLengths: vi.fn().mockRejectedValue(new Error('network error')) });
    await expect(fetchPlayableLengths(api, store)).resolves.toEqual([4, 5]);
  });

  it('should fall back to the default when the request fails and nothing is cached', async () => {
    const store = createStore();
    const api = createApi({ fetchPlayableLengths: vi.fn().mockRejectedValue(new Error('network error')) });
    await expect(fetchPlayableLengths(api, store)).resolves.toEqual(DEFAULT_PLAYABLE_LENGTHS);
  });

  it('should fall back to the default when the response has no valid scheduled length', async () => {
    const store = createStore();
    const api = createApi({ fetchPlayableLengths: vi.fn().mockResolvedValue({ lengths: [7, 0] }) });
    await expect(fetchPlayableLengths(api, store)).resolves.toEqual(DEFAULT_PLAYABLE_LENGTHS);
  });
});
