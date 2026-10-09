import { act, fireEvent, screen } from '@testing-library/react-native';
import { themes } from '@harfhane/ui-tokens';
import { Text } from 'react-native';
import { SettingsScreen } from './SettingsScreen';
import { useTheme } from '../ThemeProvider';
import { renderWithTheme, flattenStyle } from '../test-utils/render-with-theme';
import { deviceStore } from '../game/device-store';
import { TOUCH_TARGET } from '../ui/layout';

const mockExpoConfig: { version?: string } = { version: '1.2.3' };
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    get expoConfig() {
      return mockExpoConfig;
    },
  },
}));

const mockHapticsStore = new Map<string, string>();
jest.mock('../game/device-store', () => ({
  deviceStore: {
    getItem: (key: string) => Promise.resolve(mockHapticsStore.get(key) ?? null),
    setItem: (key: string, value: string) => {
      mockHapticsStore.set(key, value);
      return Promise.resolve();
    },
  },
}));

function ColorProbe() {
  const { colors } = useTheme();
  return <Text testID="probe-bg">{colors.bg}</Text>;
}

describe('SettingsScreen', () => {
  beforeEach(() => {
    mockHapticsStore.clear();
  });

  it('should render the Turkish theme and contrast controls', async () => {
    await renderWithTheme(<SettingsScreen onClose={() => undefined} />);
    expect(screen.getByText('Ayarlar')).toBeTruthy();
    expect(screen.getByLabelText('Koyu Tema')).toBeTruthy();
    expect(screen.getByLabelText('Yüksek kontrast')).toBeTruthy();
  });

  it('should show the high-contrast supporting line as its own text, not appended to the label', async () => {
    await renderWithTheme(<SettingsScreen onClose={() => undefined} />);
    expect(screen.getByText('Yüksek kontrast')).toBeTruthy();
    expect(screen.getByText('Renk körlüğü dostu renkler')).toBeTruthy();
  });

  it('should switch the active theme colors when the dark segment is pressed', async () => {
    await renderWithTheme(
      <>
        <SettingsScreen onClose={() => undefined} />
        <ColorProbe />
      </>,
    );
    await fireEvent.press(screen.getByLabelText('Koyu Tema'));
    expect(screen.getByTestId('probe-bg').props.children).toBe(themes.dark.bg);
  });

  it('should call onClose when the top bar back button is pressed', async () => {
    const onClose = jest.fn();
    await renderWithTheme(<SettingsScreen onClose={onClose} />);
    await fireEvent.press(screen.getByLabelText('Geri'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should show the app version when the Expo config has one', async () => {
    mockExpoConfig.version = '1.2.3';
    await renderWithTheme(<SettingsScreen onClose={() => undefined} />);
    expect(screen.getByText('Sürüm 1.2.3')).toBeTruthy();
  });

  it('should hide the version line when the Expo config has no version', async () => {
    mockExpoConfig.version = undefined;
    await renderWithTheme(<SettingsScreen onClose={() => undefined} />);
    expect(screen.queryByText(/^Sürüm/)).toBeNull();
  });

  it('should show the haptics switch on by default', async () => {
    await renderWithTheme(<SettingsScreen onClose={() => undefined} />);
    expect(screen.getByLabelText('Titreşim').props.value).toBe(true);
  });

  it('should persist turning the haptics switch off', async () => {
    await renderWithTheme(<SettingsScreen onClose={() => undefined} />);
    await fireEvent(screen.getByLabelText('Titreşim'), 'valueChange', false);
    expect(screen.getByLabelText('Titreşim').props.value).toBe(false);
    expect(mockHapticsStore.get('harfhane:haptics')).toBe('false');
  });

  it('should give an inactive theme option a visible border instead of blending into the card bg', async () => {
    await renderWithTheme(<SettingsScreen onClose={() => undefined} />);
    const inactiveOption = flattenStyle(screen.getByLabelText('Koyu Tema').props.style);
    expect(inactiveOption.borderWidth).toBeGreaterThan(0);
    expect(inactiveOption.borderColor).toBeTruthy();
    expect(inactiveOption.borderColor).not.toBe(inactiveOption.backgroundColor);
  });

  it('should keep each theme option at least 48 dp tall to meet the touch target (011-A1)', async () => {
    await renderWithTheme(<SettingsScreen onClose={() => undefined} />);
    const option = flattenStyle(screen.getByLabelText('Koyu Tema').props.style);
    expect(option.minHeight).toBe(TOUCH_TARGET);
  });

  it('should not draw a top border on the first settings row (the Tema row)', async () => {
    await renderWithTheme(<SettingsScreen onClose={() => undefined} />);
    const firstRowText = screen.getByText('Tema');
    const row = flattenStyle(firstRowText.parent?.parent?.props.style);
    expect(row.borderTopWidth).toBeUndefined();
  });

  it('should draw a top border on a non-first settings row', async () => {
    await renderWithTheme(<SettingsScreen onClose={() => undefined} />);
    const hapticsRowText = screen.getByText('Titreşim');
    const row = flattenStyle(hapticsRowText.parent?.parent?.props.style);
    expect(row.borderTopWidth).toBe(1);
  });

  it('should disable the haptics switch until the stored value loads', async () => {
    let resolveGetItem!: (value: string | null) => void;
    const getItemSpy = jest
      .spyOn(deviceStore, 'getItem')
      .mockReturnValueOnce(new Promise((resolve) => { resolveGetItem = resolve; }));
    await renderWithTheme(<SettingsScreen onClose={() => undefined} />);
    expect(screen.getByLabelText('Titreşim').props.disabled).toBe(true);
    await act(async () => {
      resolveGetItem(null);
      await Promise.resolve();
    });
    expect(screen.getByLabelText('Titreşim').props.disabled).toBe(false);
    getItemSpy.mockRestore();
  });
});
