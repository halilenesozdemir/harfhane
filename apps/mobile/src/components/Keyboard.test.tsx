import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { CornerDownLeft, Delete } from 'lucide-react-native';
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

interface SvgPathNode {
  readonly type: unknown;
  readonly props?: { readonly d?: string };
  readonly children?: readonly unknown[];
}

// Lucide icons resolve all the way down to RNSVGPath host nodes with a distinct `d`
// attribute per icon, which is how a testID query can tell CornerDownLeft apart from
// Delete (no icon-identity query exists on this RNTL version's lightweight instances).
function findSvgPathData(node: SvgPathNode): readonly string[] {
  const paths: string[] = [];
  if (node.type === 'RNSVGPath' && typeof node.props?.d === 'string') paths.push(node.props.d);
  for (const child of node.children ?? []) {
    if (typeof child === 'object' && child !== null) paths.push(...findSvgPathData(child as SvgPathNode));
  }
  return paths;
}

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
  // This test shares one real useHapticsSettings() instance between a Titreşim Switch and
  // Keyboard's isHapticsEnabled prop -- the closest integration to SettingsScreen and
  // Keyboard sharing the real hook+store. It stays untagged: the AE3 ("switched off in
  // Settings, pressing a key triggers no haptic") acceptance example is proven by the real
  // navigation path in App.test.tsx instead, since in production GameScreen passes no
  // isHapticsEnabled prop and Settings is a separate route -- this test only proves the prop
  // wiring, not that real path. It runs first to prove the suite is no longer order-dependent
  // now that every fireEvent/fireEvent.press call below is awaited (RNTL 14 returns promises
  // from both; a dangling one used to overlap with later `act()` calls in this file).
  it('should stop triggering the key-tap haptic once the Titreşim switch is turned off', async () => {
    // Self-proving: if the hook's load never actually ran (e.g. its setState were a no-op),
    // isEnabled would stay false from the very start and the first assertion below --
    // haptics firing while the switch is on -- would fail, so this can't pass by the switch
    // merely starting (and staying) "off".
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

    await fireEvent.press(screen.getByLabelText('A'));
    expect(mockPerformAndroidHapticsAsync).toHaveBeenCalledWith('keyboard-tap');

    mockPerformAndroidHapticsAsync.mockClear();
    await fireEvent(screen.getByLabelText('Titreşim'), 'valueChange', false);

    await fireEvent.press(screen.getByLabelText('A'));
    expect(mockPerformAndroidHapticsAsync).not.toHaveBeenCalled();
  });

  it('should call onLetter with İ when the İ key is pressed', async () => {
    const { onLetter } = await renderKeyboard();
    await fireEvent.press(screen.getByLabelText('İ'));
    expect(onLetter).toHaveBeenCalledWith('İ');
  });

  it('should call onLetter with I when the I key is pressed', async () => {
    const { onLetter } = await renderKeyboard();
    await fireEvent.press(screen.getByLabelText('I'));
    expect(onLetter).toHaveBeenCalledWith('I');
  });

  it('should call onDelete when the backspace key is pressed', async () => {
    const { onDelete } = await renderKeyboard();
    await fireEvent.press(screen.getByLabelText('Sil'));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('should call onSubmit when the enter key is pressed', async () => {
    const { onSubmit } = await renderKeyboard();
    await fireEvent.press(screen.getByLabelText('Gönder'));
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
    await fireEvent.press(screen.getByLabelText('A'));
    expect(mockPerformAndroidHapticsAsync).toHaveBeenCalledWith('keyboard-tap');
  });

  it('should not trigger a haptic on its own stored setting when off and no isHapticsEnabled prop is given', async () => {
    // Distinct from the prop-override tests below: this renders Keyboard the way it is used
    // standalone (no prop), so `isHapticsEnabled ?? ownHapticsSettings.isEnabled` must read
    // the own hook, not just fall through a `?? true` default (which a GameScreen caller
    // that always passes a defined boolean prop can no longer exercise).
    storedHapticsValue.current = 'false';
    await renderKeyboard();
    await fireEvent.press(screen.getByLabelText('A'));
    expect(mockPerformAndroidHapticsAsync).not.toHaveBeenCalled();
  });

  it('should prefer the isHapticsEnabled prop over its own stored setting when given', async () => {
    storedHapticsValue.current = 'true';
    await renderKeyboard({ isHapticsEnabled: false });
    await fireEvent.press(screen.getByLabelText('A'));
    expect(mockPerformAndroidHapticsAsync).not.toHaveBeenCalled();
  });

  it('should use the isHapticsEnabled prop to enable haptics even if storage says off', async () => {
    storedHapticsValue.current = 'false';
    await renderKeyboard({ isHapticsEnabled: true });
    await fireEvent.press(screen.getByLabelText('A'));
    expect(mockPerformAndroidHapticsAsync).toHaveBeenCalledWith('keyboard-tap');
  });

  it('should not trigger a haptic on key press when input is blocked (game over or submitting)', async () => {
    await renderKeyboard({ isInputBlocked: true });
    await fireEvent.press(screen.getByLabelText('A'));
    expect(mockPerformAndroidHapticsAsync).not.toHaveBeenCalled();
  });

  it('should still call onLetter when input is blocked (the reducer, not Keyboard, owns ignoring it)', async () => {
    const { onLetter } = await renderKeyboard({ isInputBlocked: true });
    await fireEvent.press(screen.getByLabelText('A'));
    expect(onLetter).toHaveBeenCalledWith('A');
  });

  it('should render the CornerDownLeft icon inside the Enter key and Delete inside the Backspace key', async () => {
    const [expectedEnterPath] = findSvgPathData((await render(<CornerDownLeft />)).toJSON() as SvgPathNode);
    const [expectedBackspacePath] = findSvgPathData((await render(<Delete />)).toJSON() as SvgPathNode);

    await renderKeyboard();
    const enterPaths = findSvgPathData(screen.getByTestId('key-ENTER') as unknown as SvgPathNode);
    const backspacePaths = findSvgPathData(screen.getByTestId('key-BACKSPACE') as unknown as SvgPathNode);

    expect(enterPaths).toContain(expectedEnterPath);
    expect(backspacePaths).toContain(expectedBackspacePath);
    expect(enterPaths).not.toContain(expectedBackspacePath);
  });

  it('should render a letter key as text, not an icon', async () => {
    await renderKeyboard();
    expect(screen.getByText('K')).toBeTruthy();
  });
});
