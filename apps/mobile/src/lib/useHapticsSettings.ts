import { useCallback, useEffect, useState } from 'react';
import { deviceStore } from '../game/device-store';
import type { KeyValueStore } from '../game/game-storage';

export const HAPTICS_ENABLED_KEY = 'harfhane:haptics';
const DEFAULT_HAPTICS_ENABLED = true;

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
 * Reads and persists the "Titreşim" (haptics) preference, falling back to `deviceStore` so
 * callers need no new prop wiring. Reports `isEnabled: false` until the stored value has
 * loaded (default on), so a game loaded with haptics off can never buzz once before that
 * arrives.
 */
export function useHapticsSettings(store: KeyValueStore = deviceStore): HapticsSettings {
  const [state, setState] = useState({ isEnabled: false, isLoaded: false });

  useEffect(() => {
    let isCurrent = true;
    void store.getItem(HAPTICS_ENABLED_KEY).then((raw) => {
      if (isCurrent) setState({ isEnabled: parseHapticsEnabled(raw), isLoaded: true });
    });
    return () => {
      isCurrent = false;
    };
  }, [store]);

  const setEnabled = useCallback(
    (next: boolean) => {
      setState({ isEnabled: next, isLoaded: true });
      void store.setItem(HAPTICS_ENABLED_KEY, JSON.stringify(next));
    },
    [store],
  );

  return { isEnabled: state.isEnabled, setEnabled };
}
