import { useCallback } from 'react';
import type { ComponentType } from 'react';
import { StyleSheet, View } from 'react-native';
import { CornerDownLeft, Delete } from 'lucide-react-native';
import type { TileStatus } from '@harfhane/shared';
import { keyTap } from '../lib/haptics';
import { useHapticsSettings } from '../lib/useHapticsSettings';
import { Key } from './Key';
import type { KeyIconProps } from './Key';

export interface KeyboardProps {
  readonly keyboardStatus: Readonly<Record<string, TileStatus>>;
  readonly onLetter: (letter: string) => void;
  readonly onDelete: () => void;
  readonly onSubmit: () => void;
  /**
   * Overrides the "Titreşim" setting for the key-tap haptic. Pass `useGame()`'s
   * `isHapticsEnabled` once the parent screen reads it; omitting it falls back to this
   * component's own `useHapticsSettings()` call so it still works stand-alone.
   */
  readonly isHapticsEnabled?: boolean;
  /** Suppresses the key-tap haptic once the game is over or a guess is in flight. */
  readonly isInputBlocked?: boolean;
}

const ENTER_KEY = 'ENTER';
const BACKSPACE_KEY = 'BACKSPACE';
const ENTER_ACCESSIBILITY_LABEL = 'Gönder';
const BACKSPACE_ACCESSIBILITY_LABEL = 'Sil';
const KEYBOARD_ROW_GAP = 6;
const KEYBOARD_KEY_GAP = 4;
const KEYBOARD_SIDE_PADDING = 4;

export const KEY_ICONS: Readonly<Record<string, ComponentType<KeyIconProps>>> = {
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
}: KeyboardProps) {
  const ownHapticsSettings = useHapticsSettings();
  const resolvedHapticsEnabled = isHapticsEnabled ?? ownHapticsSettings.isEnabled;

  const handlePress = useCallback(
    (value: string) => {
      if (!isInputBlocked) void keyTap(resolvedHapticsEnabled);
      if (value === ENTER_KEY) return onSubmit();
      if (value === BACKSPACE_KEY) return onDelete();
      onLetter(value);
    },
    [isInputBlocked, resolvedHapticsEnabled, onDelete, onLetter, onSubmit],
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
