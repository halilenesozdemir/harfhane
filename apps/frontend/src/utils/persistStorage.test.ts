import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { requestPersistentStorage } from './persistStorage';

const PERSIST_REQUESTED_KEY = 'harfhane:persist-requested';

function stubStorageManager(alreadyPersisted: boolean): { persist: ReturnType<typeof vi.fn>; persisted: ReturnType<typeof vi.fn> } {
  const manager = { persist: vi.fn().mockResolvedValue(true), persisted: vi.fn().mockResolvedValue(alreadyPersisted) };
  vi.stubGlobal('navigator', { ...navigator, storage: manager });
  return manager;
}

describe('requestPersistentStorage', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.unstubAllGlobals());

  it('should request persistence when storage is not yet persisted', async () => {
    const manager = stubStorageManager(false);

    await requestPersistentStorage();

    expect(manager.persist).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(PERSIST_REQUESTED_KEY)).toBe('1');
  });

  it('should not request again when it already asked once', async () => {
    const manager = stubStorageManager(false);

    await requestPersistentStorage();
    await requestPersistentStorage();

    expect(manager.persist).toHaveBeenCalledTimes(1);
  });

  it('should not request when storage is already persisted', async () => {
    const manager = stubStorageManager(true);

    await requestPersistentStorage();

    expect(manager.persist).not.toHaveBeenCalled();
  });

  it('should resolve without throwing when the Storage API is missing', async () => {
    vi.stubGlobal('navigator', { ...navigator, storage: undefined });

    await expect(requestPersistentStorage()).resolves.toBeUndefined();
    expect(localStorage.getItem(PERSIST_REQUESTED_KEY)).toBeNull();
  });

  it('should resolve without throwing when persist rejects', async () => {
    const manager = stubStorageManager(false);
    manager.persist.mockRejectedValue(new Error('blocked'));

    await expect(requestPersistentStorage()).resolves.toBeUndefined();
  });
});
