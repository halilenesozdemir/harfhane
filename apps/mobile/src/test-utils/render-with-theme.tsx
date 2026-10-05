import { render } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { ThemeProvider } from '../ThemeProvider';
import type { KeyValueStore } from '../game/game-storage';

export function createMemoryStore(): KeyValueStore {
  const entries = new Map<string, string>();
  return {
    getItem: async (key) => entries.get(key) ?? null,
    setItem: async (key, value) => {
      entries.set(key, value);
    },
  };
}

export async function renderWithTheme(element: ReactElement) {
  return render(
    <ThemeProvider store={createMemoryStore()} waitForStoredTheme={false}>
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
