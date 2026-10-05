import { act, fireEvent, screen } from '@testing-library/react-native';
import { themes } from '@harfhane/ui-tokens';
import { Text } from 'react-native';
import { SettingsScreen } from './SettingsScreen';
import { useTheme } from '../ThemeProvider';
import { renderWithTheme } from '../test-utils/render-with-theme';

function ColorProbe() {
  const { colors } = useTheme();
  return <Text testID="probe-bg">{colors.bg}</Text>;
}

describe('SettingsScreen', () => {
  it('should render the Turkish theme and contrast controls', async () => {
    await renderWithTheme(<SettingsScreen onClose={() => undefined} />);
    expect(screen.getByText('Ayarlar')).toBeTruthy();
    expect(screen.getByLabelText('Koyu Tema')).toBeTruthy();
    expect(screen.getByLabelText('Yüksek kontrast')).toBeTruthy();
  });

  it('should switch the active theme colors when the dark segment is pressed', async () => {
    await renderWithTheme(
      <>
        <SettingsScreen onClose={() => undefined} />
        <ColorProbe />
      </>,
    );
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Koyu Tema'));
    });
    expect(screen.getByTestId('probe-bg').props.children).toBe(themes.dark.bg);
  });

  it('should call onClose when the close button is pressed', async () => {
    const onClose = jest.fn();
    await renderWithTheme(<SettingsScreen onClose={onClose} />);
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Kapat'));
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
