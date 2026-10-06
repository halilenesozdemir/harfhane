import { act, fireEvent, screen } from '@testing-library/react-native';
import { themes } from '@harfhane/ui-tokens';
import { Keyboard } from './Keyboard';
import { flattenStyle, renderWithTheme } from '../test-utils/render-with-theme';
import { HAPTICS_ENABLED_KEY } from '../lib/useHapticsSettings';

const mockPerformAndroidHapticsAsync = jest.fn().mockResolvedValue(undefined);
jest.mock('expo-haptics', () => ({
  AndroidHaptics: { Keyboard_Tap: 'keyboard-tap', Confirm: 'confirm', Reject: 'reject' },
  performAndroidHapticsAsync: (...args: unknown[]) => mockPerformAndroidHapticsAsync(...args),
}));

// jest.mock factories cannot close over imported identifiers, so the key is duplicated
// here and matched against the real HAPTICS_ENABLED_KEY import in a dedicated test.
const storedHapticsValue: { current: string | null } = { current: null };
jest.mock('../game/device-store', () => ({
  deviceStore: {
    getItem: (key: string) => Promise.resolve(key === 'harfhane:haptics' ? storedHapticsValue.current : null),
    setItem: () => Promise.resolve(),
  },
}));

beforeEach(() => {
  mockPerformAndroidHapticsAsync.mockClear();
  storedHapticsValue.current = null;
});

async function renderKeyboard(keyboardStatus: Record<string, 'correct' | 'present' | 'absent' | null> = {}) {
  const onLetter = jest.fn();
  const onDelete = jest.fn();
  const onSubmit = jest.fn();
  await renderWithTheme(
    <Keyboard keyboardStatus={keyboardStatus} onLetter={onLetter} onDelete={onDelete} onSubmit={onSubmit} />,
  );
  return { onLetter, onDelete, onSubmit };
}

describe('Keyboard', () => {
  it('should call onLetter with İ when the İ key is pressed', async () => {
    const { onLetter } = await renderKeyboard();
    fireEvent.press(screen.getByLabelText('İ'));
    expect(onLetter).toHaveBeenCalledWith('İ');
  });

  it('should call onLetter with I when the I key is pressed', async () => {
    const { onLetter } = await renderKeyboard();
    fireEvent.press(screen.getByLabelText('I'));
    expect(onLetter).toHaveBeenCalledWith('I');
  });

  it('should call onDelete when the backspace key is pressed', async () => {
    const { onDelete } = await renderKeyboard();
    fireEvent.press(screen.getByLabelText('Sil'));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('should call onSubmit when the enter key is pressed', async () => {
    const { onSubmit } = await renderKeyboard();
    fireEvent.press(screen.getByLabelText('Gönder'));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('should reflect keyboardStatus precedence on key color', async () => {
    await renderKeyboard({ A: 'correct' });
    const style = flattenStyle(screen.getByLabelText('A').props.style);
    expect(style.backgroundColor).toBe(themes.light.correct);
  });

  it('should use the default key color when a letter has no status', async () => {
    await renderKeyboard();
    const style = flattenStyle(screen.getByLabelText('A').props.style);
    expect(style.backgroundColor).toBe(themes.light.keyBg);
  });

  it('should expose a stable testID per key for Maestro flows', async () => {
    await renderKeyboard();
    expect(screen.getByTestId('key-A')).toBeTruthy();
    expect(screen.getByTestId('key-ENTER')).toBeTruthy();
    expect(screen.getByTestId('key-BACKSPACE')).toBeTruthy();
  });

  it('should match the mocked device-store key with the real haptics settings key', () => {
    expect(HAPTICS_ENABLED_KEY).toBe('harfhane:haptics');
  });

  it('should trigger a haptic on key press when haptics are enabled', async () => {
    await renderKeyboard();
    fireEvent.press(screen.getByLabelText('A'));
    expect(mockPerformAndroidHapticsAsync).toHaveBeenCalledWith('keyboard-tap');
  });

  it('should not trigger a haptic on key press when haptics are switched off (011-AE3)', async () => {
    storedHapticsValue.current = 'false';
    await renderKeyboard();
    await act(async () => {
      await Promise.resolve();
    });
    fireEvent.press(screen.getByLabelText('A'));
    expect(mockPerformAndroidHapticsAsync).not.toHaveBeenCalled();
  });
});
