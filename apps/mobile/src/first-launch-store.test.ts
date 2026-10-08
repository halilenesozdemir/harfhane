import { describe, expect, it, vi } from 'vitest';
import { HOW_TO_PLAY_SEEN_KEY, loadHasSeenHowToPlay, markHowToPlaySeen } from './first-launch-store';
import type { KeyValueStore } from './game/game-storage';

function createMemoryStore(initial: Record<string, string> = {}): KeyValueStore {
  const entries = new Map(Object.entries(initial));
  return {
    getItem: vi.fn(async (key: string) => entries.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: string) => {
      entries.set(key, value);
    }),
  };
}

describe('first-launch-store', () => {
  it('should report not seen when nothing was ever stored', async () => {
    const store = createMemoryStore();
    expect(await loadHasSeenHowToPlay(store)).toBe(false);
  });

  it('should report seen when the seen value was stored', async () => {
    const store = createMemoryStore({ [HOW_TO_PLAY_SEEN_KEY]: 'true' });
    expect(await loadHasSeenHowToPlay(store)).toBe(true);
  });

  it('should report not seen when the stored value is corrupt', async () => {
    const store = createMemoryStore({ [HOW_TO_PLAY_SEEN_KEY]: 'not-json-garbage' });
    expect(await loadHasSeenHowToPlay(store)).toBe(false);
  });

  it('should report not seen when the store read rejects', async () => {
    const store: KeyValueStore = {
      getItem: vi.fn().mockRejectedValue(new Error('I/O error')),
      setItem: vi.fn(),
    };
    expect(await loadHasSeenHowToPlay(store)).toBe(false);
  });

  it('should persist the seen value when marked', async () => {
    const store = createMemoryStore();
    await markHowToPlaySeen(store);
    expect(await loadHasSeenHowToPlay(store)).toBe(true);
  });

  it('should call setItem with the how-to-play key when marked', async () => {
    const store = createMemoryStore();
    await markHowToPlaySeen(store);
    expect(store.setItem).toHaveBeenCalledWith(HOW_TO_PLAY_SEEN_KEY, 'true');
  });
});
