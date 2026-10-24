const PERSIST_REQUESTED_KEY = 'harfhane:persist-requested';

// Asks the browser to exempt this origin's storage (localStorage included)
// from automatic eviction, so stats and streaks survive storage pressure.
// Chrome and Safari decide silently; Firefox shows a permission prompt, so
// this runs once ever, right after a game result is saved (a user gesture).
export async function requestPersistentStorage(): Promise<void> {
  try {
    if (localStorage.getItem(PERSIST_REQUESTED_KEY)) return;
    const storage = typeof navigator === 'undefined' ? undefined : navigator.storage;
    if (!storage?.persist || !storage.persisted) return;
    localStorage.setItem(PERSIST_REQUESTED_KEY, '1');
    if (await storage.persisted()) return;
    await storage.persist();
  } catch {
    // Best effort: an unsupported or blocked Storage API leaves the default.
  }
}
