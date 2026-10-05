import { describe, expect, it } from 'vitest';
import { themes } from '@harfhane/ui-tokens';
import { getThemeColors } from './theme';

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
