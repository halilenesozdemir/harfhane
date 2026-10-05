import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
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
  readonly waitForStoredTheme?: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface StoredSettings {
  readonly preference: ThemePreference;
  readonly isHighContrast: boolean;
  readonly isLoaded: boolean;
}

const INITIAL_SETTINGS: StoredSettings = { preference: 'system', isHighContrast: false, isLoaded: false };

type TouchedSettings = { preference: boolean; isHighContrast: boolean };

function useLoadSettings(store: KeyValueStore, touched: { readonly current: TouchedSettings }, setSettings: (update: (current: StoredSettings) => StoredSettings) => void) {
  useEffect(() => {
    let isCurrent = true;
    void Promise.all([store.getItem(THEME_PREFERENCE_KEY), store.getItem(HIGH_CONTRAST_KEY)]).then(([rawPreference, rawContrast]) => {
      if (!isCurrent) return;
      setSettings((current) => ({
        preference: touched.current.preference ? current.preference : parsePreference(rawPreference),
        isHighContrast: touched.current.isHighContrast ? current.isHighContrast : parseHighContrast(rawContrast),
        isLoaded: true,
      }));
    });
    return () => {
      isCurrent = false;
    };
  }, [store, touched, setSettings]);
}

function useStoredSettings(store: KeyValueStore) {
  const [settings, setSettings] = useState<StoredSettings>(INITIAL_SETTINGS);
  const touched = useRef<TouchedSettings>({ preference: false, isHighContrast: false });
  useLoadSettings(store, touched, setSettings);

  const setPreference = useCallback((preference: ThemePreference) => {
    touched.current.preference = true;
    setSettings((current) => ({ ...current, preference }));
    void store.setItem(THEME_PREFERENCE_KEY, JSON.stringify(preference));
  }, [store]);

  const setHighContrast = useCallback((isHighContrast: boolean) => {
    touched.current.isHighContrast = true;
    setSettings((current) => ({ ...current, isHighContrast }));
    void store.setItem(HIGH_CONTRAST_KEY, JSON.stringify(isHighContrast));
  }, [store]);

  return { settings, setPreference, setHighContrast };
}

export function ThemeProvider({ store, children, waitForStoredTheme = true }: ThemeProviderProps) {
  const systemScheme = useColorScheme();
  const { settings, setPreference, setHighContrast } = useStoredSettings(store);
  const { preference, isHighContrast, isLoaded } = settings;
  const scheme = resolveScheme(preference, systemScheme);

  const value = useMemo<ThemeContextValue>(
    () => ({ colors: getThemeColors({ scheme, isHighContrast }), scheme, preference, isHighContrast, setPreference, setHighContrast }),
    [scheme, preference, isHighContrast, setPreference, setHighContrast],
  );

  if (waitForStoredTheme && !isLoaded) return null;
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
