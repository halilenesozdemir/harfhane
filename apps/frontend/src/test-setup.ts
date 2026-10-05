import '@testing-library/jest-dom';
import { afterEach } from 'vitest';

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
  } as Storage;
}

Object.defineProperty(window, 'localStorage', { value: createMemoryStorage(), configurable: true });
Object.defineProperty(window, 'sessionStorage', { value: createMemoryStorage(), configurable: true });

afterEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
});
