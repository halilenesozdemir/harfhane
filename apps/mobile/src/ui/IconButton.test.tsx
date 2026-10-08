import { fireEvent, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { IconButton } from './IconButton';
import { TOUCH_TARGET } from './layout';
import { flattenStyle, renderWithTheme } from '../test-utils/render-with-theme';

describe('IconButton', () => {
  it('should have accessibilityRole button and the given label', async () => {
    await renderWithTheme(<IconButton icon={<Text>i</Text>} accessibilityLabel="Geri" onPress={() => undefined} />);
    const target = screen.getByLabelText('Geri');
    expect(target.props.accessibilityRole).toBe('button');
  });

  it('should have a hit area of at least 48 dp (A1)', async () => {
    await renderWithTheme(<IconButton icon={<Text>i</Text>} accessibilityLabel="Geri" onPress={() => undefined} />);
    const style = flattenStyle(screen.getByLabelText('Geri').props.style);
    expect(style.width).toBeGreaterThanOrEqual(TOUCH_TARGET);
    expect(style.height).toBeGreaterThanOrEqual(TOUCH_TARGET);
  });

  it('should call onPress when pressed', async () => {
    const onPress = jest.fn();
    await renderWithTheme(<IconButton icon={<Text>i</Text>} accessibilityLabel="Geri" onPress={onPress} />);
    fireEvent.press(screen.getByLabelText('Geri'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('should not call onPress when disabled', async () => {
    const onPress = jest.fn();
    await renderWithTheme(<IconButton icon={<Text>i</Text>} accessibilityLabel="Geri" onPress={onPress} disabled />);
    fireEvent.press(screen.getByLabelText('Geri'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('should mark the disabled state for assistive technology', async () => {
    await renderWithTheme(<IconButton icon={<Text>i</Text>} accessibilityLabel="Geri" onPress={() => undefined} disabled />);
    expect(screen.getByLabelText('Geri').props.accessibilityState).toEqual({ disabled: true });
  });
});
