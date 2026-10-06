import { act, fireEvent, screen } from '@testing-library/react-native';
import { CornerDownLeft, Delete } from 'lucide-react-native';
import { themes } from '@harfhane/ui-tokens';
import { KEY_ICONS, Keyboard } from './Keyboard';
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

interface RenderKeyboardOptions {
  readonly keyboardStatus?: Record<string, 'correct' | 'present' | 'absent' | null>;
  readonly isHapticsEnabled?: boolean;
  readonly isInputBlocked?: boolean;
}

async function renderKeyboard({ keyboardStatus = {}, isHapticsEnabled, isInputBlocked }: RenderKeyboardOptions = {}) {
  const onLetter = jest.fn();
  const onDelete = jest.fn();
  const onSubmit = jest.fn();
  await renderWithTheme(
    <Keyboard
      keyboardStatus={keyboardStatus}
      onLetter={onLetter}
      onDelete={onDelete}
      onSubmit={onSubmit}
      isHapticsEnabled={isHapticsEnabled}
      isInputBlocked={isInputBlocked}
    />,
  );
  // Flushes the own-hook's AsyncStorage load, which otherwise reports haptics as off
  // (the safe default before the stored value arrives) regardless of what's mocked.
  await act(async () => {
    await Promise.resolve();
  });
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
    await renderKeyboard({ keyboardStatus: { A: 'correct' } });
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
    fireEvent.press(screen.getByLabelText('A'));
    expect(mockPerformAndroidHapticsAsync).not.toHaveBeenCalled();
  });

  it('should prefer the isHapticsEnabled prop over its own stored setting when given', async () => {
    storedHapticsValue.current = 'true';
    await renderKeyboard({ isHapticsEnabled: false });
    fireEvent.press(screen.getByLabelText('A'));
    expect(mockPerformAndroidHapticsAsync).not.toHaveBeenCalled();
  });

  it('should use the isHapticsEnabled prop to enable haptics even if storage says off', async () => {
    storedHapticsValue.current = 'false';
    await renderKeyboard({ isHapticsEnabled: true });
    fireEvent.press(screen.getByLabelText('A'));
    expect(mockPerformAndroidHapticsAsync).toHaveBeenCalledWith('keyboard-tap');
  });

  it('should not trigger a haptic on key press when input is blocked (game over or submitting)', async () => {
    await renderKeyboard({ isInputBlocked: true });
    fireEvent.press(screen.getByLabelText('A'));
    expect(mockPerformAndroidHapticsAsync).not.toHaveBeenCalled();
  });

  it('should still call onLetter when input is blocked (the reducer, not Keyboard, owns ignoring it)', async () => {
    const { onLetter } = await renderKeyboard({ isInputBlocked: true });
    fireEvent.press(screen.getByLabelText('A'));
    expect(onLetter).toHaveBeenCalledWith('A');
  });

  it('should render CornerDownLeft for Enter and Delete for Backspace', () => {
    expect(KEY_ICONS.ENTER).toBe(CornerDownLeft);
    expect(KEY_ICONS.BACKSPACE).toBe(Delete);
  });

  it('should expose an icon testID for Enter and Backspace', async () => {
    await renderKeyboard();
    expect(screen.getByTestId('key-ENTER-icon', { includeHiddenElements: true })).toBeTruthy();
    expect(screen.getByTestId('key-BACKSPACE-icon', { includeHiddenElements: true })).toBeTruthy();
  });
});
