import { fireEvent, screen } from '@testing-library/react-native';
import { themes } from '@harfhane/ui-tokens';
import { Key } from './Key';
import { flattenStyle, renderWithTheme } from '../test-utils/render-with-theme';

describe('Key', () => {
  it('should use the correct token color when status is correct', async () => {
    await renderWithTheme(<Key label="K" value="K" status="correct" accessibilityLabel="K" onPress={() => undefined} />);
    const style = flattenStyle(screen.getByLabelText('K').props.style);
    expect(style.backgroundColor).toBe(themes.light.correct);
  });

  it('should use the key background token color when there is no status', async () => {
    await renderWithTheme(<Key label="K" value="K" status={null} accessibilityLabel="K" onPress={() => undefined} />);
    const style = flattenStyle(screen.getByLabelText('K').props.style);
    expect(style.backgroundColor).toBe(themes.light.keyBg);
  });

  it('should have accessibilityRole button', async () => {
    await renderWithTheme(<Key label="K" value="K" status={null} accessibilityLabel="K" onPress={() => undefined} />);
    expect(screen.getByLabelText('K').props.accessibilityRole).toBe('button');
  });

  it('should call onPress with its value when pressed', async () => {
    const onPress = jest.fn();
    await renderWithTheme(<Key label="K" value="K" status={null} accessibilityLabel="K" onPress={onPress} />);
    fireEvent.press(screen.getByLabelText('K'));
    expect(onPress).toHaveBeenCalledWith('K');
  });
});
