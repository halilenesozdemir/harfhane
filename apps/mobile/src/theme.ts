import { themes } from '@harfhane/ui-tokens';

export type ColorScheme = 'light' | 'dark';
export type ThemeColors = { readonly [Name in keyof typeof themes.light]: string };

export interface ThemeOptions {
  readonly scheme: ColorScheme;
  readonly isHighContrast: boolean;
}

export function getThemeColors({ scheme, isHighContrast }: ThemeOptions): ThemeColors {
  const schemeColors = themes[scheme];
  if (!isHighContrast) return schemeColors;
  const darkOverlay = scheme === 'dark' ? themes['dark-high-contrast'] : {};
  return { ...schemeColors, ...themes['high-contrast'], ...darkOverlay };
}

export type ThemePreference = ColorScheme | 'system';

export const THEME_PREFERENCE_KEY = 'harfhane:theme';
export const HIGH_CONTRAST_KEY = 'harfhane:high-contrast';

const THEME_PREFERENCES: readonly ThemePreference[] = ['light', 'dark', 'system'];

export function resolveScheme(preference: ThemePreference, systemScheme: string | null | undefined): ColorScheme {
  if (preference !== 'system') return preference;
  return systemScheme === 'dark' ? 'dark' : 'light';
}

export function parsePreference(raw: string | null): ThemePreference {
  const value = raw === null ? null : safeParse(raw);
  return THEME_PREFERENCES.find((preference) => preference === value) ?? 'system';
}

export function parseHighContrast(raw: string | null): boolean {
  return raw !== null && safeParse(raw) === true;
}

function safeParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
