import type { KeyValueStore } from './game-storage';

const NOOP_STORE: KeyValueStore = {
  getItem: async () => null,
  setItem: async () => undefined,
};

/**
 * Merely importing `@react-native-async-storage/async-storage` throws when the native
 * module isn't linked (e.g. a component test that renders a screen without injecting its
 * own store). Resolving it through `require` behind a try/catch, once at module load, lets
 * every caller here import `deviceStore` safely regardless of that environment.
 */
function resolveAsyncStorage(): KeyValueStore {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('@react-native-async-storage/async-storage').default as KeyValueStore;
  } catch {
    return NOOP_STORE;
  }
}

export const deviceStore: KeyValueStore = resolveAsyncStorage();
