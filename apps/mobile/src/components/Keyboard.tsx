import type { ComponentType } from 'react';
import { StyleSheet, View } from 'react-native';
import { CornerDownLeft, Delete } from 'lucide-react-native';
import type { TileStatus } from '@harfhane/shared';
import { Key, type KeyIconProps } from './Key';

export interface KeyboardProps {
  readonly keyboardStatus: Readonly<Record<string, TileStatus>>;
  readonly onLetter: (letter: string) => void;
  readonly onDelete: () => void;
  readonly onSubmit: () => void;
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

export function Keyboard({ keyboardStatus, onLetter, onDelete, onSubmit }: KeyboardProps) {
  function handlePress(value: string): void {
    if (value === ENTER_KEY) return onSubmit();
    if (value === BACKSPACE_KEY) return onDelete();
    onLetter(value);
  }

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
