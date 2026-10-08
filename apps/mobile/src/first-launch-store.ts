import type { KeyValueStore } from './game/game-storage';

export const HOW_TO_PLAY_SEEN_KEY = 'harfhane:how-to-play-seen';

const SEEN_VALUE = 'true';

// Any failure to read (missing key, corrupt value, rejecting store) means
// "treat as not seen" — never crash and never block the splash gate this
// feeds (App.tsx awaits it before deciding the first route).
export async function loadHasSeenHowToPlay(store: KeyValueStore): Promise<boolean> {
  try {
    const raw = await store.getItem(HOW_TO_PLAY_SEEN_KEY);
    return raw === SEEN_VALUE;
  } catch {
    return false;
  }
}

export async function markHowToPlaySeen(store: KeyValueStore): Promise<void> {
  await store.setItem(HOW_TO_PLAY_SEEN_KEY, SEEN_VALUE);
}
