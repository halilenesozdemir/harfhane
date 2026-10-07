import { useCallback, useEffect, useRef, useState } from 'react';
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
  readonly isLoaded: boolean;
  setEnabled(isEnabled: boolean): void;
}

/**
 * Reads and persists the "Titreşim" (haptics) preference, falling back to `deviceStore` so
 * callers need no new prop wiring. Reports `isEnabled: false` until the stored value has
 * loaded (default on), so a game loaded with haptics off can never buzz once before that
 * arrives. `isLoaded` lets a caller (e.g. the Settings switch) wait out that same window.
 * Once the caller calls `setEnabled`, that choice wins over a load that was still in flight,
 * so an early tap can never be overwritten by a late AsyncStorage read.
 */
export function useHapticsSettings(store: KeyValueStore = deviceStore): HapticsSettings {
  const [state, setState] = useState({ isEnabled: false, isLoaded: false });
  const hasUserSetRef = useRef(false);

  useEffect(() => {
    hasUserSetRef.current = false;
    let isCurrent = true;
    void store.getItem(HAPTICS_ENABLED_KEY).then((raw) => {
      if (isCurrent && !hasUserSetRef.current) setState({ isEnabled: parseHapticsEnabled(raw), isLoaded: true });
    });
    return () => {
      isCurrent = false;
    };
  }, [store]);

  const setEnabled = useCallback(
    (next: boolean) => {
      hasUserSetRef.current = true;
      setState({ isEnabled: next, isLoaded: true });
      void store.setItem(HAPTICS_ENABLED_KEY, JSON.stringify(next));
    },
    [store],
  );

  return { isEnabled: state.isEnabled, isLoaded: state.isLoaded, setEnabled };
}
