import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { requestPersistentStorage } from './persistStorage';

const LAST_ATTEMPT_KEY = 'harfhane:persist-last-attempt';
const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = Date.parse('2026-10-24T12:00:00Z');

function stubStorageManager(alreadyPersisted: boolean): { persist: ReturnType<typeof vi.fn>; persisted: ReturnType<typeof vi.fn> } {
  const manager = { persist: vi.fn().mockResolvedValue(false), persisted: vi.fn().mockResolvedValue(alreadyPersisted) };
  vi.stubGlobal('navigator', { ...navigator, storage: manager });
  return manager;
}

describe('requestPersistentStorage', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.unstubAllGlobals());

  it('should request persistence and record the attempt when storage is not yet persisted', async () => {
    const manager = stubStorageManager(false);

    await requestPersistentStorage(NOW);

    expect(manager.persist).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(LAST_ATTEMPT_KEY)).toBe(String(NOW));
  });

  it('should not request again when the last attempt was less than a week ago', async () => {
    const manager = stubStorageManager(false);

    await requestPersistentStorage(NOW);
    await requestPersistentStorage(NOW + 6 * DAY_MS);

    expect(manager.persist).toHaveBeenCalledTimes(1);
  });

  it('should retry when a week has passed since a refused attempt', async () => {
    const manager = stubStorageManager(false);

    await requestPersistentStorage(NOW);
    await requestPersistentStorage(NOW + 7 * DAY_MS);

    expect(manager.persist).toHaveBeenCalledTimes(2);
  });

  it('should not request when storage is already persisted', async () => {
    const manager = stubStorageManager(true);

    await requestPersistentStorage(NOW);

    expect(manager.persist).not.toHaveBeenCalled();
  });

  it('should resolve without throwing when the Storage API is missing', async () => {
    vi.stubGlobal('navigator', { ...navigator, storage: undefined });

    await expect(requestPersistentStorage(NOW)).resolves.toBeUndefined();
    expect(localStorage.getItem(LAST_ATTEMPT_KEY)).toBeNull();
  });

  it('should resolve without throwing when persist rejects', async () => {
    const manager = stubStorageManager(false);
    manager.persist.mockRejectedValue(new Error('blocked'));

    await expect(requestPersistentStorage(NOW)).resolves.toBeUndefined();
  });
});
