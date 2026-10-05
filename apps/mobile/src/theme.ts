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
