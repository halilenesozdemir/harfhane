import { createContext, useContext } from 'react';
import { useTheme } from '../hooks/useTheme';
import type { ThemeContextValue } from '../types';

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: React.ReactNode;
}

/**
 * ThemeProvider - Wraps app to provide theme context
 */
export const ThemeProvider = ({ children }: ThemeProviderProps): React.JSX.Element => {
  const themeState = useTheme();

  return (
    <ThemeContext.Provider value={themeState}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * useThemeContext - Access theme from any component
 */
export const useThemeContext = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
};
