import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import type { KeyValueStore } from './game/game-storage';
import {
  HIGH_CONTRAST_KEY,
  THEME_PREFERENCE_KEY,
  getThemeColors,
  parseHighContrast,
  parsePreference,
  resolveScheme,
} from './theme';
import type { ColorScheme, ThemeColors, ThemePreference } from './theme';

export interface ThemeContextValue {
  readonly colors: ThemeColors;
  readonly scheme: ColorScheme;
  readonly preference: ThemePreference;
  readonly isHighContrast: boolean;
  setPreference(preference: ThemePreference): void;
  setHighContrast(isHighContrast: boolean): void;
}

export interface ThemeProviderProps {
  readonly store: KeyValueStore;
  readonly children: ReactNode;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function useStoredSettings(store: KeyValueStore) {
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [isHighContrast, setHighContrastState] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    void Promise.all([store.getItem(THEME_PREFERENCE_KEY), store.getItem(HIGH_CONTRAST_KEY)]).then(([rawPreference, rawContrast]) => {
      if (!isCurrent) return;
      setPreferenceState(parsePreference(rawPreference));
      setHighContrastState(parseHighContrast(rawContrast));
    });
    return () => {
      isCurrent = false;
    };
  }, [store]);

  return { preference, setPreferenceState, isHighContrast, setHighContrastState };
}

export function ThemeProvider({ store, children }: ThemeProviderProps) {
  const systemScheme = useColorScheme();
  const { preference, setPreferenceState, isHighContrast, setHighContrastState } = useStoredSettings(store);
  const scheme = resolveScheme(preference, systemScheme);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    void store.setItem(THEME_PREFERENCE_KEY, JSON.stringify(next));
  }, [store, setPreferenceState]);

  const setHighContrast = useCallback((next: boolean) => {
    setHighContrastState(next);
    void store.setItem(HIGH_CONTRAST_KEY, JSON.stringify(next));
  }, [store, setHighContrastState]);

  const value = useMemo<ThemeContextValue>(
    () => ({ colors: getThemeColors({ scheme, isHighContrast }), scheme, preference, isHighContrast, setPreference, setHighContrast }),
    [scheme, preference, isHighContrast, setPreference, setHighContrast],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
