import { screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { themes } from '@harfhane/ui-tokens';
import { TopBar } from './TopBar';
import { FONT_FAMILY_DISPLAY, TOP_BAR_HEIGHT, TOUCH_TARGET } from './layout';
import { flattenStyle, renderWithTheme } from '../test-utils/render-with-theme';

function icon(testID: string) {
  return <Text testID={testID}>icon</Text>;
}

describe('TopBar', () => {
  it('should be 64 dp tall with the bg background colour (B1)', async () => {
    await renderWithTheme(<TopBar title="Günlük" testID="bar" />);
    const style = flattenStyle(screen.getByTestId('bar').props.style);
    expect(style.height).toBe(TOP_BAR_HEIGHT);
    expect(style.backgroundColor).toBe(themes.light.bg);
  });

  it('should render the title in Baloo 2 at the titleSmall line height (B3/T5)', async () => {
    await renderWithTheme(<TopBar title="İstatistikler" />);
    const style = flattenStyle(screen.getByText('İstatistikler').props.style);
    expect(style.fontFamily).toBe(FONT_FAMILY_DISPLAY);
    expect(style.lineHeight).toBe(24);
  });

  it('should truncate the title to one line and let it shrink (T3)', async () => {
    await renderWithTheme(<TopBar title="İstatistikler" />);
    const title = screen.getByText('İstatistikler');
    expect(title.props.numberOfLines).toBe(1);
    expect(flattenStyle(title.props.style).flexShrink).toBe(1);
  });

  it('should expose the title with accessibilityRole header', async () => {
    await renderWithTheme(<TopBar title="İstatistikler" />);
    expect(screen.getByLabelText('İstatistikler').props.accessibilityRole).toBe('header');
  });

  it('should combine the title and chip into one header label without concatenating the string (B3)', async () => {
    await renderWithTheme(<TopBar title="Günlük" chip="5 harf" />);
    expect(screen.getByLabelText('Günlük, 5 harf')).toBeTruthy();
    expect(screen.getByText('Günlük')).toBeTruthy();
    expect(screen.getByText('5 harf')).toBeTruthy();
  });

  it('should use minHeight, not a fixed height, for the chip (so it can grow at larger font scales)', async () => {
    await renderWithTheme(<TopBar title="Günlük" chip="5 harf" />);
    const chipStyle = flattenStyle(screen.getByText('5 harf').parent?.props.style);
    expect(chipStyle.minHeight).toBeDefined();
    expect(chipStyle.height).toBeUndefined();
  });

  it('should render the given leading element', async () => {
    await renderWithTheme(<TopBar title="Günlük" leading={icon('back-icon')} />);
    expect(screen.getByTestId('back-icon')).toBeTruthy();
  });

  it('should keep the title centred with a spacer when there is no trailing action (B4)', async () => {
    await renderWithTheme(<TopBar title="Günlük" testID="bar" />);
    const bar = screen.getByTestId('bar');
    expect(bar.children.length).toBe(3);
  });

  it.each([0, 1, 2])(
    'should give the leading and trailing slots equal widths of at least 48 dp with %i trailing action(s), keeping the title centred (B3/B4)',
    async (count) => {
      const trailing = Array.from({ length: count }, (_, index) => icon(`action-${index}`));
      await renderWithTheme(<TopBar title="Günlük" leading={icon('back')} trailing={trailing} testID="bar" />);
      const [leadingSlot, , trailingSlot] = screen.getByTestId('bar').children as unknown as Array<{ props: { style: unknown } }>;
      const leadingWidth = flattenStyle(leadingSlot.props.style).width as number;
      const trailingWidth = flattenStyle(trailingSlot.props.style).width as number;
      expect(leadingWidth).toBe(trailingWidth);
      expect(leadingWidth).toBeGreaterThanOrEqual(TOUCH_TARGET);
    },
  );

  it('should allow an absent title on the home variant', async () => {
    await renderWithTheme(<TopBar variant="home" leading={icon('streak')} trailing={[icon('a'), icon('b'), icon('c')]} />);
    expect(screen.queryByRole('header')).toBeNull();
    expect(screen.getByTestId('streak')).toBeTruthy();
    expect(screen.getByTestId('a')).toBeTruthy();
    expect(screen.getByTestId('b')).toBeTruthy();
    expect(screen.getByTestId('c')).toBeTruthy();
  });

  it('should let the home leading slot grow past 48 dp wide for a streak chip', async () => {
    await renderWithTheme(<TopBar variant="home" leading={icon('streak')} testID="bar" />);
    const [leadingSlot] = screen.getByTestId('bar').children as unknown as Array<{ props: { style: unknown } }>;
    const style = flattenStyle(leadingSlot.props.style);
    expect(style.minWidth).toBe(TOUCH_TARGET);
    expect(style.width).toBeUndefined();
  });
});
