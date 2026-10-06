import { describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_PLAYABLE_LENGTHS,
  PLAYABLE_LENGTHS_STORAGE_KEY,
  fetchPlayableLengths,
  getDefaultPlayableLength,
  loadCachedPlayableLengths,
  resolveSelectedLength,
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

function createFailingStore(): KeyValueStore {
  return {
    getItem: vi.fn().mockRejectedValue(new Error('storage read error')),
    setItem: vi.fn().mockRejectedValue(new Error('storage write error')),
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

  it('should return the cached lengths when they are valid', async () => {
    const store = createStore({ [PLAYABLE_LENGTHS_STORAGE_KEY]: JSON.stringify([4, 5]) });
    await expect(loadCachedPlayableLengths(store)).resolves.toEqual([4, 5]);
  });

  it('should return null when the cached JSON is malformed', async () => {
    const store = createStore({ [PLAYABLE_LENGTHS_STORAGE_KEY]: 'not json' });
    await expect(loadCachedPlayableLengths(store)).resolves.toBeNull();
  });

  it('should drop cached lengths that are not scheduled', async () => {
    const store = createStore({ [PLAYABLE_LENGTHS_STORAGE_KEY]: JSON.stringify([5, 7, 0]) });
    await expect(loadCachedPlayableLengths(store)).resolves.toEqual([5]);
  });

  it('should return null when every cached length is invalid', async () => {
    const store = createStore({ [PLAYABLE_LENGTHS_STORAGE_KEY]: JSON.stringify([7, 0]) });
    await expect(loadCachedPlayableLengths(store)).resolves.toBeNull();
  });
});

describe('fetchPlayableLengths', () => {
  it('should fetch, cache and return the lengths when the request succeeds', async () => {
    const store = createStore();
    const api = createApi({ fetchPlayableLengths: vi.fn().mockResolvedValue({ lengths: [4, 6] }) });
    await expect(fetchPlayableLengths(api, store)).resolves.toEqual([4, 6]);
    await expect(loadCachedPlayableLengths(store)).resolves.toEqual([4, 6]);
  });

  it('(008-AE2) should fall back to the cached lengths when the request fails', async () => {
    const store = createStore();
    await saveCachedPlayableLengths(store, [4, 5]);
    const api = createApi({ fetchPlayableLengths: vi.fn().mockRejectedValue(new Error('network error')) });
    await expect(fetchPlayableLengths(api, store)).resolves.toEqual([4, 5]);
  });

  it('(008-AE2) should fall back to the default when the request fails and nothing is cached', async () => {
    const store = createStore();
    const api = createApi({ fetchPlayableLengths: vi.fn().mockRejectedValue(new Error('network error')) });
    await expect(fetchPlayableLengths(api, store)).resolves.toEqual(DEFAULT_PLAYABLE_LENGTHS);
  });

  it('should fall back to the cache, not the default, when the response has no valid scheduled length', async () => {
    const store = createStore();
    await saveCachedPlayableLengths(store, [4, 5]);
    const api = createApi({ fetchPlayableLengths: vi.fn().mockResolvedValue({ lengths: [7, 0] }) });
    await expect(fetchPlayableLengths(api, store)).resolves.toEqual([4, 5]);
    // The invalid response must not have overwritten the good cache.
    await expect(loadCachedPlayableLengths(store)).resolves.toEqual([4, 5]);
  });

  it('should fall back to the default when the response has no valid scheduled length and nothing is cached', async () => {
    const store = createStore();
    const api = createApi({ fetchPlayableLengths: vi.fn().mockResolvedValue({ lengths: [7, 0] }) });
    await expect(fetchPlayableLengths(api, store)).resolves.toEqual(DEFAULT_PLAYABLE_LENGTHS);
  });

  it('should still return the fresh fetch result when caching it fails', async () => {
    const store = createFailingStore();
    const api = createApi({ fetchPlayableLengths: vi.fn().mockResolvedValue({ lengths: [4, 6] }) });
    await expect(fetchPlayableLengths(api, store)).resolves.toEqual([4, 6]);
  });

  it('(008-AE2) should fall back to the default, not reject, when both the request and the cache read fail', async () => {
    const store = createFailingStore();
    const api = createApi({ fetchPlayableLengths: vi.fn().mockRejectedValue(new Error('network error')) });
    await expect(fetchPlayableLengths(api, store)).resolves.toEqual(DEFAULT_PLAYABLE_LENGTHS);
  });

  it('should fall back to the default, not reject, when the response is invalid and the cache read fails', async () => {
    const store = createFailingStore();
    const api = createApi({ fetchPlayableLengths: vi.fn().mockResolvedValue({ lengths: [7, 0] }) });
    await expect(fetchPlayableLengths(api, store)).resolves.toEqual(DEFAULT_PLAYABLE_LENGTHS);
  });

  it('should fall back to the default, not reject, when the response itself is undefined', async () => {
    const store = createStore();
    const api = createApi({ fetchPlayableLengths: vi.fn().mockResolvedValue(undefined as never) });
    await expect(fetchPlayableLengths(api, store)).resolves.toEqual(DEFAULT_PLAYABLE_LENGTHS);
  });
});

describe('getDefaultPlayableLength', () => {
  it('should prefer 5 when it is playable, regardless of order', () => {
    expect(getDefaultPlayableLength([4, 5, 6])).toBe(5);
    expect(getDefaultPlayableLength([6, 5])).toBe(5);
  });

  it('should fall back to the first playable length when 5 is not playable', () => {
    expect(getDefaultPlayableLength([4, 6])).toBe(4);
  });

  it('should fall back to 5 when the list is empty', () => {
    expect(getDefaultPlayableLength([])).toBe(5);
  });
});

describe('resolveSelectedLength', () => {
  it('should keep the picked length when it is still playable', () => {
    expect(resolveSelectedLength(6, [4, 5, 6])).toBe(6);
  });

  it('(008-AE1) should fall back to the default when the picked length is no longer playable', () => {
    expect(resolveSelectedLength(6, [4, 5])).toBe(5);
  });

  it('should use the default when nothing was picked yet', () => {
    expect(resolveSelectedLength(null, [4, 6])).toBe(4);
  });
});
