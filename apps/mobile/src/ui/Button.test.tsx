import { fireEvent, screen } from '@testing-library/react-native';
import { themes } from '@harfhane/ui-tokens';
import { Button } from './Button';
import { flattenStyle, renderWithTheme } from '../test-utils/render-with-theme';

describe('Button', () => {
  it('should use the brand fill for the primary variant', async () => {
    await renderWithTheme(<Button label="Oyna" onPress={() => undefined} />);
    const style = flattenStyle(screen.getByLabelText('Oyna').props.style);
    expect(style.backgroundColor).toBe(themes.light.brand);
  });

  it('should use the surface fill with a border for the secondary variant', async () => {
    await renderWithTheme(<Button label="Yeni kelime" onPress={() => undefined} variant="secondary" />);
    const style = flattenStyle(screen.getByLabelText('Yeni kelime').props.style);
    expect(style.backgroundColor).toBe(themes.light.surface);
    expect(style.borderColor).toBe(themes.light.surfaceBorder);
  });

  it('should have no depth edge for the tertiary variant', async () => {
    await renderWithTheme(<Button label="Tümünü gör" onPress={() => undefined} variant="tertiary" />);
    const style = flattenStyle(screen.getByLabelText('Tümünü gör').props.style);
    expect(style.borderBottomWidth).toBeUndefined();
  });

  it('should call onPress when pressed', async () => {
    const onPress = jest.fn();
    await renderWithTheme(<Button label="Oyna" onPress={onPress} />);
    fireEvent.press(screen.getByLabelText('Oyna'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('should lower opacity and drop the depth edge when disabled (K3)', async () => {
    await renderWithTheme(<Button label="Oyna" onPress={() => undefined} disabled />);
    const target = screen.getByLabelText('Oyna');
    const style = flattenStyle(target.props.style);
    expect(target.props.accessibilityState).toEqual({ disabled: true });
    expect(style.opacity).toBe(0.5);
    expect(style.borderBottomWidth).toBeUndefined();
  });

  it('should not call onPress when disabled', async () => {
    const onPress = jest.fn();
    await renderWithTheme(<Button label="Oyna" onPress={onPress} disabled />);
    fireEvent.press(screen.getByLabelText('Oyna'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
