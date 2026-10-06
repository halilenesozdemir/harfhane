import { useState, useEffect, useMemo, useCallback } from 'react';
import { themes } from '@harfhane/ui-tokens';
import { useLocalStorage } from './useLocalStorage';
import type { Theme, ThemeContextValue } from '../types';

const LIGHT_THEME_COLOR = themes.light.themeColor;
const DARK_THEME_COLOR = themes.dark.themeColor;

/**
 * Theme hook for managing light/dark/system theme
 * @returns {ThemeContextValue} theme state and controls
 */
export const useTheme = (): ThemeContextValue => {
  // Stored preference: 'light' | 'dark' | 'system'
  const [themePreference, setThemePreference] = useLocalStorage<Theme>('harfhane:theme', 'system');
  const [isHighContrast, setHighContrast] = useLocalStorage<boolean>('harfhane:high-contrast', false);
  
  // Track system preference
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent): void => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Resolve actual theme to apply
  const resolvedTheme = useMemo<'light' | 'dark'>(() => {
    if (themePreference === 'system') {
      return systemTheme;
    }
    return themePreference;
  }, [themePreference, systemTheme]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', resolvedTheme === 'dark' ? DARK_THEME_COLOR : LIGHT_THEME_COLOR);
    }
  }, [resolvedTheme]);

  useEffect(() => {
    document.documentElement.classList.toggle('high-contrast', isHighContrast);
  }, [isHighContrast]);

  // Theme setters
  const setTheme = useCallback((theme: Theme): void => {
    setThemePreference(theme);
  }, [setThemePreference]);

  const toggleTheme = useCallback((): void => {
    if (themePreference === 'system') {
      // If system, switch to opposite of current
      setThemePreference(systemTheme === 'dark' ? 'light' : 'dark');
    } else {
      // Toggle between light and dark
      setThemePreference(themePreference === 'dark' ? 'light' : 'dark');
    }
  }, [themePreference, systemTheme, setThemePreference]);

  const setSystemPreference = useCallback((): void => {
    setThemePreference('system');
  }, [setThemePreference]);

  return {
    // Current values
    theme: themePreference,
    resolvedTheme,
    systemTheme,
    isDark: resolvedTheme === 'dark',
    isLight: resolvedTheme === 'light',
    isSystem: themePreference === 'system',
    isHighContrast,
    
    // Actions
    setTheme,
    toggleTheme,
    setSystemPreference,
    setHighContrast,
  };
};
