const LAST_ATTEMPT_KEY = 'harfhane:persist-last-attempt';
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const RETRY_INTERVAL_MS = 7 * MS_PER_DAY;

function attemptedRecently(now: number): boolean {
  const lastAttempt = Number(localStorage.getItem(LAST_ATTEMPT_KEY));
  return lastAttempt > 0 && now - lastAttempt < RETRY_INTERVAL_MS;
}

// Asks the browser to exempt this origin's storage (localStorage included)
// from automatic eviction, so stats and streaks survive storage pressure.
// Chrome and Safari decide silently from engagement, so a first refusal is
// retried later; Firefox may show a prompt, so attempts are at most weekly.
// Called when a finished game's result is recorded, shortly after the
// player's final guess.
export async function requestPersistentStorage(now: number = Date.now()): Promise<void> {
  try {
    const storage = typeof navigator === 'undefined' ? undefined : navigator.storage;
    if (!storage?.persist || !storage.persisted) return;
    if (attemptedRecently(now) || (await storage.persisted())) return;
    localStorage.setItem(LAST_ATTEMPT_KEY, String(now));
    await storage.persist();
  } catch {
    // Best effort: an unsupported or blocked Storage API leaves the default.
  }
}
