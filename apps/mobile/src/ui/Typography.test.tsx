import { screen } from '@testing-library/react-native';
import { themes } from '@harfhane/ui-tokens';
import { AppText } from './Typography';
import { FONT_FAMILY_DISPLAY, FONT_SIZE, LINE_HEIGHT } from './layout';
import { flattenStyle, renderWithTheme } from '../test-utils/render-with-theme';

describe('AppText', () => {
  it.each(['display', 'headline', 'title', 'titleSmall', 'bodyLarge', 'body', 'caption'] as const)(
    'should pair fontSize and lineHeight from the typography table for role %s',
    async (role) => {
      await renderWithTheme(<AppText role={role}>metin</AppText>);
      const style = flattenStyle(screen.getByText('metin').props.style);
      expect(style.fontSize).toBe(FONT_SIZE[role]);
      expect(style.lineHeight).toBe(LINE_HEIGHT[role]);
    },
  );

  it('should use Baloo 2 and no fontWeight for a display-font role (T1)', async () => {
    await renderWithTheme(<AppText role="title">İstatistikler</AppText>);
    const style = flattenStyle(screen.getByText('İstatistikler').props.style);
    expect(style.fontFamily).toBe(FONT_FAMILY_DISPLAY);
    expect(style.fontWeight).toBeUndefined();
  });

  it('should ignore an explicit weight on a display-font role, never combining it with the family (T1)', async () => {
    await renderWithTheme(
      <AppText role="headline" weight="700">
        Oyun bitti
      </AppText>,
    );
    const style = flattenStyle(screen.getByText('Oyun bitti').props.style);
    expect(style.fontFamily).toBe(FONT_FAMILY_DISPLAY);
    expect(style.fontWeight).toBeUndefined();
  });

  it('should apply an explicit weight on a body role', async () => {
    await renderWithTheme(
      <AppText role="body" weight="700">
        Oyun 12
      </AppText>,
    );
    const style = flattenStyle(screen.getByText('Oyun 12').props.style);
    expect(style.fontWeight).toBe('700');
    expect(style.fontFamily).toBeUndefined();
  });

  it('should default to the text token colour', async () => {
    await renderWithTheme(<AppText role="body">metin</AppText>);
    expect(flattenStyle(screen.getByText('metin').props.style).color).toBe(themes.light.text);
  });

  it('should use an explicit colour when given', async () => {
    await renderWithTheme(<AppText role="caption" color={themes.light.correctText}>Çözüldü</AppText>);
    expect(flattenStyle(screen.getByText('Çözüldü').props.style).color).toBe(themes.light.correctText);
  });
});
