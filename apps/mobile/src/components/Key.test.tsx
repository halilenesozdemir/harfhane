import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { View } from 'react-native';
import { themes } from '@harfhane/ui-tokens';
import { Key, type KeyIconProps } from './Key';
import { flattenStyle, renderWithTheme } from '../test-utils/render-with-theme';

const KEY_ICON_SIZE = 18;

function TestIcon(props: KeyIconProps) {
  return <View testID="key-icon" {...props} />;
}

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

  it('should use dark tokens when the stored theme is dark', async () => {
    await renderWithTheme(<Key label="K" value="K" status="absent" accessibilityLabel="K" onPress={jest.fn()} />, { 'harfhane:theme': '"dark"' });
    await waitFor(() => expect(flattenStyle(screen.getByLabelText('K').props.style).backgroundColor).toBe(themes.dark.absent));
  });

  it('should use high-contrast tokens when high contrast is stored', async () => {
    await renderWithTheme(<Key label="K" value="K" status="correct" accessibilityLabel="K" onPress={jest.fn()} />, { 'harfhane:high-contrast': 'true' });
    await waitFor(() => expect(flattenStyle(screen.getByLabelText('K').props.style).backgroundColor).toBe(themes['high-contrast'].correct));
  });

  it('should share the row width instead of using a fixed width', async () => {
    await renderWithTheme(<Key label="K" value="K" status={null} accessibilityLabel="K" onPress={jest.fn()} />);
    const style = flattenStyle(screen.getByLabelText('K').props.style);
    expect(style.width).toBeUndefined();
    expect(style.flex).toBe(1);
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

  it('should render the label text when no icon is given', async () => {
    await renderWithTheme(<Key label="K" value="K" status={null} accessibilityLabel="K" onPress={() => undefined} />);
    expect(screen.getByText('K')).toBeTruthy();
  });

  it('should render the icon instead of the text label when an icon is given', async () => {
    await renderWithTheme(
      <Key label="⌫" value="BACKSPACE" status={null} accessibilityLabel="Sil" icon={TestIcon} onPress={() => undefined} />,
    );
    expect(screen.queryByText('⌫')).toBeNull();
    expect(screen.getByLabelText('Sil')).toBeTruthy();
  });

  it('should pass the key foreground color and the fixed icon size to a given icon', async () => {
    await renderWithTheme(
      <Key label="⌫" value="BACKSPACE" status={null} accessibilityLabel="Sil" icon={TestIcon} onPress={() => undefined} />,
    );
    const icon = screen.getByTestId('key-icon');
    expect(icon.props.color).toBe(themes.light.keyFg);
    expect(icon.props.size).toBe(KEY_ICON_SIZE);
  });
});
