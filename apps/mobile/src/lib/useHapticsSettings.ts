import { useCallback, useEffect, useState } from 'react';
import type { KeyValueStore } from '../game/game-storage';

export const HAPTICS_ENABLED_KEY = 'harfhane:haptics';
const DEFAULT_HAPTICS_ENABLED = true;

const NOOP_STORE: KeyValueStore = {
  getItem: async () => null,
  setItem: async () => undefined,
};

/**
 * `deviceStore` wraps the native AsyncStorage module, which throws merely from being
 * imported in an environment that never linked it (e.g. a render test for a screen that
 * doesn't inject a store). Resolving it lazily behind a try/catch, once at module load,
 * lets every caller here import this hook safely regardless of that environment.
 */
function resolveDefaultStore(): KeyValueStore {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return (require('../game/device-store') as { deviceStore: KeyValueStore }).deviceStore;
  } catch {
    return NOOP_STORE;
  }
}

const DEFAULT_STORE = resolveDefaultStore();

export function parseHapticsEnabled(raw: string | null): boolean {
  if (raw === null) return DEFAULT_HAPTICS_ENABLED;
  try {
    return JSON.parse(raw) === true;
  } catch {
    return DEFAULT_HAPTICS_ENABLED;
  }
}

export interface HapticsSettings {
  readonly isEnabled: boolean;
  setEnabled(isEnabled: boolean): void;
}

/**
 * Reads and persists the "Titreşim" (haptics) preference. Defaults to on while the stored
 * value loads, and falls back to `deviceStore` so callers need no new prop wiring.
 */
export function useHapticsSettings(store: KeyValueStore = DEFAULT_STORE): HapticsSettings {
  const [isEnabled, setIsEnabled] = useState(DEFAULT_HAPTICS_ENABLED);

  useEffect(() => {
    let isCurrent = true;
    void store.getItem(HAPTICS_ENABLED_KEY).then((raw) => {
      if (isCurrent) setIsEnabled(parseHapticsEnabled(raw));
    });
    return () => {
      isCurrent = false;
    };
  }, [store]);

  const setEnabled = useCallback(
    (next: boolean) => {
      setIsEnabled(next);
      void store.setItem(HAPTICS_ENABLED_KEY, JSON.stringify(next));
    },
    [store],
  );

  return { isEnabled, setEnabled };
}
