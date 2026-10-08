import { configure, resetToDefaults, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { themes } from '@harfhane/ui-tokens';
import { DepthTile } from './DepthTile';
import { DEPTH, FONT_FAMILY_DISPLAY, FONT_SIZE, RADIUS, TILE_LETTER_MAX_FONT_SCALE } from './layout';
import { flattenStyle, renderWithTheme } from '../test-utils/render-with-theme';

describe('DepthTile', () => {
  // Decorative (importantForAccessibility="no-hide-descendants"): see through it by default.
  beforeAll(() => configure({ defaultIncludeHiddenElements: true }));
  afterAll(() => resetToDefaults());

  it('should size the outer box as size + depth, and the face as size x size', async () => {
    await renderWithTheme(<DepthTile letter="H" fill={themes.light.correct} foreground={themes.light.correctFg} depthColor={themes.light.correctDepth} size={48} depth={DEPTH.lg} testID="tile" />);
    const outer = screen.getByTestId('tile');
    const outerStyle = flattenStyle(outer.props.style);
    expect(outerStyle.width).toBe(48);
    expect(outerStyle.height).toBe(48 + DEPTH.lg);

    const back = outer.children[0] as unknown as { props: { style: unknown } };
    const face = outer.children[1] as unknown as { props: { style: unknown } };
    expect(flattenStyle(back.props.style).backgroundColor).toBe(themes.light.correctDepth);
    const faceStyle = flattenStyle(face.props.style);
    expect(faceStyle.backgroundColor).toBe(themes.light.correct);
    expect(faceStyle.height).toBe(48);
  });

  it("should draw the letter in the fill's matching foreground, in Baloo 2, capped at TILE_LETTER_MAX_FONT_SCALE (C1/T3)", async () => {
    await renderWithTheme(<DepthTile letter="H" fill={themes.light.correct} foreground={themes.light.correctFg} depthColor={themes.light.correctDepth} size={48} depth={DEPTH.lg} />);
    const letter = screen.getByText('H');
    const style = flattenStyle(letter.props.style);
    expect(style.color).toBe(themes.light.correctFg);
    expect(style.fontFamily).toBe(FONT_FAMILY_DISPLAY);
    expect(letter.props.maxFontSizeMultiplier).toBe(TILE_LETTER_MAX_FONT_SCALE);
  });

  it('should use a different foreground for a present-fill tile than for a correct-fill tile (C1)', async () => {
    await renderWithTheme(<>
      <DepthTile letter="H" fill={themes.light.correct} foreground={themes.light.correctFg} depthColor={themes.light.correctDepth} size={48} depth={DEPTH.lg} />
      <DepthTile letter="A" fill={themes.light.present} foreground={themes.light.presentFg} depthColor={themes.light.presentDepth} size={48} depth={DEPTH.lg} />
    </>);
    const correctLetterColor = flattenStyle(screen.getByText('H').props.style).color;
    const presentLetterColor = flattenStyle(screen.getByText('A').props.style).color;
    expect(correctLetterColor).toBe(themes.light.correctFg);
    expect(presentLetterColor).toBe(themes.light.presentFg);
    expect(correctLetterColor).not.toBe(presentLetterColor);
  });

  it('should set the lineHeight from the typography table for a display-sized letter (40), not the font size itself (T5)', async () => {
    await renderWithTheme(<DepthTile letter="H" fill={themes.light.correct} foreground={themes.light.correctFg} depthColor={themes.light.correctDepth} size={48} depth={DEPTH.lg} letterFontSize={32} />);
    expect(flattenStyle(screen.getByText('H').props.style).lineHeight).toBe(40);
  });

  it('should default letterFontSize to FONT_SIZE.title (20) and its lineHeight to 26 from the table (T5)', async () => {
    await renderWithTheme(<DepthTile letter="H" fill={themes.light.correct} foreground={themes.light.correctFg} depthColor={themes.light.correctDepth} size={48} depth={DEPTH.lg} />);
    const style = flattenStyle(screen.getByText('H').props.style);
    expect(style.fontSize).toBe(FONT_SIZE.title);
    expect(style.lineHeight).toBe(26);
  });

  it('should default the radius to RADIUS.md on both the face and the back layer when not given', async () => {
    await renderWithTheme(<DepthTile letter="H" fill={themes.light.correct} foreground={themes.light.correctFg} depthColor={themes.light.correctDepth} size={48} depth={DEPTH.lg} testID="tile" />);
    const outer = screen.getByTestId('tile');
    const back = outer.children[0] as unknown as { props: { style: unknown } };
    const face = outer.children[1] as unknown as { props: { style: unknown } };
    expect(flattenStyle(back.props.style).borderRadius).toBe(RADIUS.md);
    expect(flattenStyle(face.props.style).borderRadius).toBe(RADIUS.md);
  });

  it('should apply an explicit radius to both the face and the back layer, not only one of them', async () => {
    await renderWithTheme(<DepthTile letter="H" fill={themes.light.correct} foreground={themes.light.correctFg} depthColor={themes.light.correctDepth} size={120} depth={15} radius={30} testID="tile" />);
    const outer = screen.getByTestId('tile');
    const back = outer.children[0] as unknown as { props: { style: unknown } };
    const face = outer.children[1] as unknown as { props: { style: unknown } };
    expect(flattenStyle(back.props.style).borderRadius).toBe(30);
    expect(flattenStyle(face.props.style).borderRadius).toBe(30);
  });

  it('should render an icon instead of a letter when given one', async () => {
    await renderWithTheme(<DepthTile icon={<Text testID="icon">icon</Text>} fill={themes.light.correct} foreground={themes.light.correctFg} depthColor={themes.light.correctDepth} size={48} depth={DEPTH.sm} />);
    expect(screen.getByTestId('icon')).toBeTruthy();
    expect(screen.queryByText('H')).toBeNull();
  });

  it('should be hidden from accessibility (decorative)', async () => {
    await renderWithTheme(<DepthTile letter="H" fill={themes.light.correct} foreground={themes.light.correctFg} depthColor={themes.light.correctDepth} size={48} depth={DEPTH.lg} testID="tile" />);
    expect(screen.getByTestId('tile').props.importantForAccessibility).toBe('no-hide-descendants');
  });
});
