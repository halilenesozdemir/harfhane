import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import type { TileStatus } from '@harfhane/shared';
import { base } from '@harfhane/ui-tokens';
import { useTheme } from '../ThemeProvider';
import type { ThemeColors } from '../theme';
import { parsePx } from '../utils/px';

export interface KeyProps {
  readonly label: string;
  readonly value: string;
  readonly status: TileStatus;
  readonly accessibilityLabel: string;
  readonly isWide?: boolean;
  readonly onPress: (value: string) => void;
}

const KEY_HEIGHT = 46;
const KEY_WIDTH = 32;
const WIDE_KEY_WIDTH = 56;
const WIDE_KEY_PADDING = 4;
const KEY_FONT_SIZE = 14;
const KEY_DEPTH_HEIGHT = 3;
const KEY_PRESSED_DEPTH_HEIGHT = 1;
const KEY_PRESSED_TRANSLATE_Y = 2;

function getKeyColors(status: TileStatus, colors: ThemeColors) {
  if (status === 'correct') return { backgroundColor: colors.correct, color: colors.correctFg, depthColor: colors.correctDepth };
  if (status === 'present') return { backgroundColor: colors.present, color: colors.presentFg, depthColor: colors.presentDepth };
  if (status === 'absent') return { backgroundColor: colors.absent, color: colors.absentFg, depthColor: colors.absentDepth };
  return { backgroundColor: colors.keyBg, color: colors.keyFg, depthColor: colors.keyDepth };
}

export function Key({ label, value, status, accessibilityLabel, isWide = false, onPress }: KeyProps) {
  const { colors } = useTheme();
  const [isPressed, setIsPressed] = useState(false);
  const { backgroundColor, color, depthColor } = getKeyColors(status, colors);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      onPress={() => onPress(value)}
      style={[
        styles.key,
        isWide && styles.wideKey,
        {
          backgroundColor,
          borderBottomColor: depthColor,
          borderBottomWidth: isPressed ? KEY_PRESSED_DEPTH_HEIGHT : KEY_DEPTH_HEIGHT,
          transform: [{ translateY: isPressed ? KEY_PRESSED_TRANSLATE_Y : 0 }],
        },
      ]}
    >
      <Text style={[styles.label, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  key: {
    width: KEY_WIDTH,
    height: KEY_HEIGHT,
    borderRadius: parsePx(base.radiusKey),
    alignItems: 'center',
    justifyContent: 'center',
  },
  wideKey: { width: WIDE_KEY_WIDTH, paddingHorizontal: WIDE_KEY_PADDING },
  label: { fontSize: KEY_FONT_SIZE, fontWeight: '700' },
});
