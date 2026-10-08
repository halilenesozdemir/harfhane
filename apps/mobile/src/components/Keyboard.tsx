import { useCallback } from 'react';
import type { ComponentType } from 'react';
import { StyleSheet, View } from 'react-native';
import { CornerDownLeft, Delete } from 'lucide-react-native';
import type { TileStatus } from '@harfhane/shared';
import { keyTap } from '../lib/haptics';
import { useHapticsSettings } from '../lib/useHapticsSettings';
import { Key, type KeyIconProps } from './Key';

export interface KeyboardProps {
  readonly keyboardStatus: Readonly<Record<string, TileStatus>>;
  readonly onLetter: (letter: string) => void;
  readonly onDelete: () => void;
  readonly onSubmit: () => void;
  /**
   * Overrides the "Titreşim" setting for the key-tap haptic (GameScreen passes `useGame()`'s
   * value); omitting it falls back to this component's own `useHapticsSettings()` call.
   */
  readonly isHapticsEnabled?: boolean;
  /** Suppresses the key-tap haptic for a letter or backspace press while a guess is being validated. */
  readonly isInputBlocked?: boolean;
  /**
   * Suppresses the key-tap haptic for an Enter press only — while validating, and through the
   * post-guess reveal window (M4), when GameScreen already turns the submit itself into a no-op.
   * Letters and backspace keep their normal haptic throughout that window (owner decision: typing
   * ahead must stay snappy even though Enter itself does nothing yet).
   */
  readonly isSubmitBlocked?: boolean;
}

const ENTER_KEY = 'ENTER';
const BACKSPACE_KEY = 'BACKSPACE';
const ENTER_ACCESSIBILITY_LABEL = 'Gönder';
const BACKSPACE_ACCESSIBILITY_LABEL = 'Sil';
const KEYBOARD_ROW_GAP = 6;
const KEYBOARD_KEY_GAP = 4;
const KEYBOARD_SIDE_PADDING = 4;

const KEY_ICONS: Readonly<Record<string, ComponentType<KeyIconProps>>> = {
  [ENTER_KEY]: CornerDownLeft,
  [BACKSPACE_KEY]: Delete,
};

const KEYBOARD_ROWS: readonly (readonly string[])[] = [
  ['E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'Ğ', 'Ü'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ş', 'İ'],
  [ENTER_KEY, 'Z', 'C', 'V', 'B', 'N', 'M', 'Ö', 'Ç', BACKSPACE_KEY],
];

function getKeyAccessibilityLabel(value: string): string {
  if (value === ENTER_KEY) return ENTER_ACCESSIBILITY_LABEL;
  if (value === BACKSPACE_KEY) return BACKSPACE_ACCESSIBILITY_LABEL;
  return value;
}

export function Keyboard({
  keyboardStatus,
  onLetter,
  onDelete,
  onSubmit,
  isHapticsEnabled,
  isInputBlocked = false,
  isSubmitBlocked = false,
}: KeyboardProps) {
  const ownHapticsSettings = useHapticsSettings();
  const resolvedHapticsEnabled = isHapticsEnabled ?? ownHapticsSettings.isEnabled;

  const handlePress = useCallback(
    (value: string) => {
      const isEnter = value === ENTER_KEY;
      const isBlocked = isEnter ? isSubmitBlocked : isInputBlocked;
      if (!isBlocked) void keyTap(resolvedHapticsEnabled);
      if (isEnter) return onSubmit();
      if (value === BACKSPACE_KEY) return onDelete();
      onLetter(value);
    },
    [isInputBlocked, isSubmitBlocked, resolvedHapticsEnabled, onDelete, onLetter, onSubmit],
  );

  return (
    <View style={styles.keyboard}>
      {KEYBOARD_ROWS.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((value) => (
            <Key
              key={value}
              testID={`key-${value}`}
              label={value}
              value={value}
              status={keyboardStatus[value] ?? null}
              accessibilityLabel={getKeyAccessibilityLabel(value)}
              isWide={value === ENTER_KEY || value === BACKSPACE_KEY}
              icon={KEY_ICONS[value]}
              onPress={handlePress}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  keyboard: { alignSelf: 'stretch', gap: KEYBOARD_ROW_GAP, paddingHorizontal: KEYBOARD_SIDE_PADDING },
  row: { flexDirection: 'row', justifyContent: 'center', gap: KEYBOARD_KEY_GAP },
});
