const LEGACY_PREFIX = 'nurdle';
const NEW_PREFIX = 'harfhane';

export function migrateLocalStorage(): void {
  const keysToMigrate: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(LEGACY_PREFIX)) keysToMigrate.push(key);
  }

  for (const oldKey of keysToMigrate) {
    const newKey = NEW_PREFIX + oldKey.slice(LEGACY_PREFIX.length);
    const value = localStorage.getItem(oldKey);
    if (value !== null) localStorage.setItem(newKey, value);
    localStorage.removeItem(oldKey);
  }
}

export function migrateSessionStorage(): void {
  const keysToMigrate: string[] = [];

  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key?.startsWith(LEGACY_PREFIX)) keysToMigrate.push(key);
  }

  for (const oldKey of keysToMigrate) {
    const newKey = NEW_PREFIX + oldKey.slice(LEGACY_PREFIX.length);
    const value = sessionStorage.getItem(oldKey);
    if (value !== null) sessionStorage.setItem(newKey, value);
    sessionStorage.removeItem(oldKey);
  }
}
