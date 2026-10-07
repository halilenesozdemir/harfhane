import { act, fireEvent, screen } from '@testing-library/react-native';
import { themes } from '@harfhane/ui-tokens';
import { Switch } from 'react-native';
import { Keyboard } from './Keyboard';
import { flattenStyle, renderWithTheme } from '../test-utils/render-with-theme';
import { HAPTICS_ENABLED_KEY, useHapticsSettings } from '../lib/useHapticsSettings';

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
    setItem: (key: string, value: string) => {
      if (key === 'harfhane:haptics') storedHapticsValue.current = value;
      return Promise.resolve();
    },
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

  // Last: this test drives Settings' Switch and Keyboard's isHapticsEnabled prop from a
  // single real useHapticsSettings() instance, which leaves lingering async state that
  // breaks later tests' queries in this suite (a testing-library/react-native quirk) --
  // keeping it last avoids that without weakening what it proves.
  it('should stop triggering the key-tap haptic once the Titreşim switch is turned off (011-AE3)', async () => {
    // Self-proving: the switch and Keyboard's isHapticsEnabled prop share one real
    // useHapticsSettings() instance (the closest integration to SettingsScreen and Keyboard
    // sharing the real hook+store: Keyboard's own hook only re-reads storage on mount, so an
    // in-place toggle -- unlike a remount -- needs the lifted prop GameScreen will eventually
    // pass, per docs/backlog.md). If the hook's load never actually ran (e.g. its setState
    // were a no-op), isEnabled would stay false from the very start and the first assertion
    // below -- haptics firing while the switch is on -- would fail, so this can't pass by
    // the switch merely starting (and staying) "off".
    function Harness() {
      const { isEnabled, setEnabled } = useHapticsSettings();
      return (
        <>
          <Switch accessibilityLabel="Titreşim" value={isEnabled} onValueChange={setEnabled} />
          <Keyboard
            keyboardStatus={{}}
            onLetter={jest.fn()}
            onDelete={jest.fn()}
            onSubmit={jest.fn()}
            isHapticsEnabled={isEnabled}
          />
        </>
      );
    }

    await renderWithTheme(<Harness />);
    await act(async () => {
      await Promise.resolve();
    });

    fireEvent.press(screen.getByLabelText('A'));
    expect(mockPerformAndroidHapticsAsync).toHaveBeenCalledWith('keyboard-tap');

    mockPerformAndroidHapticsAsync.mockClear();
    await act(async () => {
      fireEvent(screen.getByLabelText('Titreşim'), 'valueChange', false);
    });

    fireEvent.press(screen.getByLabelText('A'));
    expect(mockPerformAndroidHapticsAsync).not.toHaveBeenCalled();
  });
});
