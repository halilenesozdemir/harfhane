import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';

/**
 * Theme hook for managing light/dark/system theme
 * @returns {Object} theme state and controls
 */
export const useTheme = () => {
  // Stored preference: 'light' | 'dark' | 'system'
  const [themePreference, setThemePreference] = useLocalStorage('nurdle:theme', 'system');
  
  // Track system preference
  const [systemTheme, setSystemTheme] = useState(() => {
    if (typeof window === 'undefined') return 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Resolve actual theme to apply
  const resolvedTheme = useMemo(() => {
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
      metaThemeColor.setAttribute('content', resolvedTheme === 'dark' ? '#121213' : '#ffffff');
    }
  }, [resolvedTheme]);

  // Theme setters
  const setTheme = useCallback((theme) => {
    setThemePreference(theme);
  }, [setThemePreference]);

  const toggleTheme = useCallback(() => {
    if (themePreference === 'system') {
      // If system, switch to opposite of current
      setThemePreference(systemTheme === 'dark' ? 'light' : 'dark');
    } else {
      // Toggle between light and dark
      setThemePreference(themePreference === 'dark' ? 'light' : 'dark');
    }
  }, [themePreference, systemTheme, setThemePreference]);

  const setSystemPreference = useCallback(() => {
    setThemePreference('system');
  }, [setThemePreference]);

  return {
    // Current values
    theme: themePreference,        // User's preference: 'light' | 'dark' | 'system'
    resolvedTheme,                 // Actually applied: 'light' | 'dark'
    systemTheme,                   // System preference: 'light' | 'dark'
    isDark: resolvedTheme === 'dark',
    isLight: resolvedTheme === 'light',
    isSystem: themePreference === 'system',
    
    // Actions
    setTheme,                      // Set specific theme
    toggleTheme,                   // Toggle between light/dark
    setSystemPreference,           // Use system preference
  };
};

export default useTheme;

