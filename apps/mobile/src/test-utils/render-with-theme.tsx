import { render } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { ThemeProvider } from '../ThemeProvider';
import type { KeyValueStore } from '../game/game-storage';

export function createMemoryStore(initial: Readonly<Record<string, string>> = {}): KeyValueStore {
  const entries = new Map(Object.entries(initial));
  return {
    getItem: async (key) => entries.get(key) ?? null,
    setItem: async (key, value) => {
      entries.set(key, value);
    },
  };
}

export async function renderWithTheme(element: ReactElement, storedTheme: Readonly<Record<string, string>> = {}) {
  return render(
    <ThemeProvider store={createMemoryStore(storedTheme)} waitForStoredTheme={Object.keys(storedTheme).length > 0}>
      {element}
    </ThemeProvider>,
  );
}

export function flattenStyle(style: unknown): Record<string, unknown> {
  if (Array.isArray(style)) {
    return style.reduce<Record<string, unknown>>((acc, entry) => ({ ...acc, ...flattenStyle(entry) }), {});
  }
  return (style as Record<string, unknown> | undefined) ?? {};
}
