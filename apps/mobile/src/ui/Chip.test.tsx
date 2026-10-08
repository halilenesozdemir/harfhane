import { fireEvent, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { themes } from '@harfhane/ui-tokens';
import { Chip } from './Chip';
import { CHIP_HEIGHT, TOUCH_TARGET } from './layout';
import { flattenStyle, renderWithTheme } from '../test-utils/render-with-theme';

function sumHitSlop(hitSlop: { top?: number; bottom?: number } | undefined, visualHeight: number): number {
  return visualHeight + (hitSlop?.top ?? 0) + (hitSlop?.bottom ?? 0);
}

describe('Chip', () => {
  describe('streak variant', () => {
    it('should use the surface fill in a full pill shape', async () => {
      await renderWithTheme(<Chip variant="streak" label="3" accessibilityLabel="5 harf, 3 günlük seri" onPress={() => undefined} testID="streak" />);
      const style = flattenStyle(screen.getByTestId('streak').props.style);
      expect(style.backgroundColor).toBe(themes.light.surface);
      expect(style.height).toBe(CHIP_HEIGHT.streak);
    });

    it('should reach a 48 dp hit area via hitSlop on a 32 dp visual pill (A1/A3)', async () => {
      await renderWithTheme(<Chip variant="streak" label="3" accessibilityLabel="5 harf, 3 günlük seri" onPress={() => undefined} testID="streak" />);
      const target = screen.getByTestId('streak');
      expect(sumHitSlop(target.props.hitSlop, CHIP_HEIGHT.streak)).toBeGreaterThanOrEqual(TOUCH_TARGET);
    });

    it('should call onPress when tapped', async () => {
      const onPress = jest.fn();
      await renderWithTheme(<Chip variant="streak" label="3" accessibilityLabel="5 harf, 3 günlük seri" onPress={onPress} />);
      fireEvent.press(screen.getByLabelText('5 harf, 3 günlük seri'));
      expect(onPress).toHaveBeenCalledTimes(1);
    });
  });

  describe('status variant', () => {
    it('should colour the label with the given colour, not a default, when one is given', async () => {
      await renderWithTheme(<Chip variant="status" label="Çözüldü · 3/6" icon={<Text>icon</Text>} color={themes.light.correctText} />);
      const style = flattenStyle(screen.getByText('Çözüldü · 3/6').props.style);
      expect(style.color).toBe(themes.light.correctText);
    });

    it('should fall back to textMuted when no colour is given', async () => {
      await renderWithTheme(<Chip variant="status" label="04:12:09" />);
      const style = flattenStyle(screen.getByText('04:12:09').props.style);
      expect(style.color).toBe(themes.light.textMuted);
    });

    it('should not be a button (no press interaction)', async () => {
      await renderWithTheme(<Chip variant="status" label="04:12:09" testID="status" />);
      expect(screen.getByTestId('status').props.accessibilityRole).toBeUndefined();
    });
  });

  describe('length variant', () => {
    it('should use the brand fill and brandFg text when selected', async () => {
      await renderWithTheme(<Chip variant="length" label="5 harf" selected accessibilityLabel="5 harf" onPress={() => undefined} testID="length" />);
      const style = flattenStyle(screen.getByTestId('length').props.style);
      const labelStyle = flattenStyle(screen.getByText('5 harf').props.style);
      expect(style.backgroundColor).toBe(themes.light.brand);
      expect(labelStyle.color).toBe(themes.light.brandFg);
    });

    it('should use the surface fill with a border and text colour when not selected', async () => {
      await renderWithTheme(<Chip variant="length" label="4 harf" selected={false} accessibilityLabel="4 harf" onPress={() => undefined} testID="length" />);
      const style = flattenStyle(screen.getByTestId('length').props.style);
      expect(style.backgroundColor).toBe(themes.light.surface);
      expect(style.borderColor).toBe(themes.light.surfaceBorder);
    });

    it('should set accessibilityState.selected', async () => {
      await renderWithTheme(<Chip variant="length" label="5 harf" selected accessibilityLabel="5 harf" onPress={() => undefined} testID="length" />);
      expect(screen.getByTestId('length').props.accessibilityState).toEqual({ selected: true });
    });

    it('should reach a 48 dp hit area via hitSlop on a 40 dp visual chip (A3)', async () => {
      await renderWithTheme(<Chip variant="length" label="5 harf" selected={false} accessibilityLabel="5 harf" onPress={() => undefined} testID="length" />);
      const target = screen.getByTestId('length');
      expect(sumHitSlop(target.props.hitSlop, CHIP_HEIGHT.length)).toBeGreaterThanOrEqual(TOUCH_TARGET);
    });

    it('should call onPress when tapped', async () => {
      const onPress = jest.fn();
      await renderWithTheme(<Chip variant="length" label="5 harf" selected={false} accessibilityLabel="5 harf" onPress={onPress} />);
      fireEvent.press(screen.getByLabelText('5 harf'));
      expect(onPress).toHaveBeenCalledTimes(1);
    });
  });
});
