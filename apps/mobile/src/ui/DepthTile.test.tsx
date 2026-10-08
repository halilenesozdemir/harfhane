import { configure, resetToDefaults, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { themes } from '@harfhane/ui-tokens';
import { DepthTile } from './DepthTile';
import { DEPTH, FONT_FAMILY_DISPLAY, FONT_SIZE, RADIUS, TILE_LETTER_MAX_FONT_SCALE } from './layout';
import { flattenStyle, renderWithTheme } from '../test-utils/render-with-theme';

describe('DepthTile', () => {
  // DepthTile is decorative (importantForAccessibility="no-hide-descendants"),
  // so every query here must see through that by default.
  beforeAll(() => configure({ defaultIncludeHiddenElements: true }));
  afterAll(() => resetToDefaults());

  it('should size the outer box as size + depth, and the face as size x size', async () => {
    await renderWithTheme(<DepthTile letter="H" fill={themes.light.correct} foreground={themes.light.correctFg} depthColor={themes.light.correctDepth} size={48} depth={DEPTH.lg} testID="tile" />);
    const outerStyle = flattenStyle(screen.getByTestId('tile').props.style);
    expect(outerStyle.width).toBe(48);
    expect(outerStyle.height).toBe(48 + DEPTH.lg);
  });

  it("should draw the letter in the fill's matching foreground, in Baloo 2 (C1)", async () => {
    await renderWithTheme(<DepthTile letter="H" fill={themes.light.correct} foreground={themes.light.correctFg} depthColor={themes.light.correctDepth} size={48} depth={DEPTH.lg} />);
    const style = flattenStyle(screen.getByText('H').props.style);
    expect(style.color).toBe(themes.light.correctFg);
    expect(style.fontFamily).toBe(FONT_FAMILY_DISPLAY);
  });

  it('should use a different foreground for a present-fill tile than for a correct-fill tile (C1)', async () => {
    await renderWithTheme(
      <>
        <DepthTile letter="H" fill={themes.light.correct} foreground={themes.light.correctFg} depthColor={themes.light.correctDepth} size={48} depth={DEPTH.lg} />
        <DepthTile letter="A" fill={themes.light.present} foreground={themes.light.presentFg} depthColor={themes.light.presentDepth} size={48} depth={DEPTH.lg} />
      </>,
    );
    const correctLetterColor = flattenStyle(screen.getByText('H').props.style).color;
    const presentLetterColor = flattenStyle(screen.getByText('A').props.style).color;
    expect(correctLetterColor).toBe(themes.light.correctFg);
    expect(presentLetterColor).toBe(themes.light.presentFg);
    expect(correctLetterColor).not.toBe(presentLetterColor);
  });

  it('should set an explicit lineHeight on the letter matching its font size so large system font scale does not overflow the tile', async () => {
    await renderWithTheme(<DepthTile letter="H" fill={themes.light.correct} foreground={themes.light.correctFg} depthColor={themes.light.correctDepth} size={48} depth={DEPTH.lg} letterFontSize={32} />);
    const style = flattenStyle(screen.getByText('H').props.style);
    expect(style.lineHeight).toBe(32);
  });

  it('should cap the letter font scale at TILE_LETTER_MAX_FONT_SCALE (T3)', async () => {
    await renderWithTheme(<DepthTile letter="H" fill={themes.light.correct} foreground={themes.light.correctFg} depthColor={themes.light.correctDepth} size={48} depth={DEPTH.lg} />);
    expect(screen.getByText('H').props.maxFontSizeMultiplier).toBe(TILE_LETTER_MAX_FONT_SCALE);
  });

  it('should default letterFontSize to FONT_SIZE.title when not given', async () => {
    await renderWithTheme(<DepthTile letter="H" fill={themes.light.correct} foreground={themes.light.correctFg} depthColor={themes.light.correctDepth} size={48} depth={DEPTH.lg} />);
    const style = flattenStyle(screen.getByText('H').props.style);
    expect(style.fontSize).toBe(FONT_SIZE.title);
  });

  it('should default the radius to RADIUS.md on both the face and the back layer when not given', async () => {
    await renderWithTheme(<DepthTile letter="H" fill={themes.light.correct} foreground={themes.light.correctFg} depthColor={themes.light.correctDepth} size={48} depth={DEPTH.lg} testID="tile" />);
    const outer = screen.getByTestId('tile');
    const back = outer.children[0] as unknown as { props: { style: unknown } };
    const face = outer.children[1] as unknown as { props: { style: unknown } };
    expect(flattenStyle(back.props.style).borderRadius).toBe(RADIUS.md);
    expect(flattenStyle(face.props.style).borderRadius).toBe(RADIUS.md);
  });

  it('should apply an explicit radius to the back layer too, not only the face', async () => {
    await renderWithTheme(<DepthTile letter="H" fill={themes.light.correct} foreground={themes.light.correctFg} depthColor={themes.light.correctDepth} size={120} depth={15} radius={30} testID="tile" />);
    const outer = screen.getByTestId('tile');
    const back = outer.children[0] as unknown as { props: { style: unknown } };
    expect(flattenStyle(back.props.style).borderRadius).toBe(30);
  });

  it('should render an icon instead of a letter when given one', async () => {
    await renderWithTheme(
      <DepthTile icon={<Text testID="icon">icon</Text>} fill={themes.light.correct} foreground={themes.light.correctFg} depthColor={themes.light.correctDepth} size={48} depth={DEPTH.sm} />,
    );
    expect(screen.getByTestId('icon')).toBeTruthy();
    expect(screen.queryByText('H')).toBeNull();
  });

  it('should default to RADIUS.md but accept an explicit radius for the face and back layer', async () => {
    const { rerender } = await renderWithTheme(
      <DepthTile letter="H" fill={themes.light.correct} foreground={themes.light.correctFg} depthColor={themes.light.correctDepth} size={120} depth={15} radius={30} testID="tile" />,
    );
    const outer = screen.getByTestId('tile');
    const face = outer.children[1] as unknown as { props: { style: unknown } };
    expect(flattenStyle(face.props.style).borderRadius).toBe(30);
    await rerender(<></>);
  });

  it('should be hidden from accessibility (decorative)', async () => {
    await renderWithTheme(<DepthTile letter="H" fill={themes.light.correct} foreground={themes.light.correctFg} depthColor={themes.light.correctDepth} size={48} depth={DEPTH.lg} testID="tile" />);
    expect(screen.getByTestId('tile').props.importantForAccessibility).toBe('no-hide-descendants');
  });
});
