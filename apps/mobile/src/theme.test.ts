import { describe, expect, it } from 'vitest';
import { themes } from '@harfhane/ui-tokens';
import { getThemeColors, parseHighContrast, parsePreference, resolveScheme } from './theme';

describe('getThemeColors', () => {
  it('should return the light tokens when the scheme is light', () => {
    expect(getThemeColors({ scheme: 'light', isHighContrast: false })).toEqual(themes.light);
  });

  it('should return the dark tokens when the scheme is dark', () => {
    expect(getThemeColors({ scheme: 'dark', isHighContrast: false }).bg).toBe(themes.dark.bg);
  });

  it('should overlay high-contrast tile colors on light when high contrast is on', () => {
    const colors = getThemeColors({ scheme: 'light', isHighContrast: true });
    expect(colors.correct).toBe(themes['high-contrast'].correct);
    expect(colors.bg).toBe(themes.light.bg);
  });

  it('should apply the dark high-contrast text colors last when dark and high contrast are on', () => {
    const colors = getThemeColors({ scheme: 'dark', isHighContrast: true });
    expect(colors.correctText).toBe(themes['dark-high-contrast'].correctText);
    expect(colors.correct).toBe(themes['high-contrast'].correct);
    expect(colors.bg).toBe(themes.dark.bg);
  });
});

describe('resolveScheme', () => {
  it('should follow the system scheme when the preference is system', () => {
    expect(resolveScheme('system', 'dark')).toBe('dark');
    expect(resolveScheme('system', null)).toBe('light');
  });

  it('should ignore the system scheme when a scheme is chosen', () => {
    expect(resolveScheme('light', 'dark')).toBe('light');
  });
});

describe('stored theme values', () => {
  it('should read the web JSON format when a preference is stored', () => {
    expect(parsePreference('"dark"')).toBe('dark');
    expect(parseHighContrast('true')).toBe(true);
  });

  it('should fall back to defaults when nothing valid is stored', () => {
    expect(parsePreference(null)).toBe('system');
    expect(parsePreference('"sepia"')).toBe('system');
    expect(parsePreference('{')).toBe('system');
    expect(parseHighContrast('"yes"')).toBe(false);
  });
});
