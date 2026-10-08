import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../ThemeProvider';
import { CHIP_HEIGHT, FONT_SIZE, RADIUS, SPACING, TOUCH_TARGET } from './layout';

export type ChipProps =
  | {
      readonly variant: 'streak';
      readonly icon?: ReactNode;
      readonly label: string;
      readonly accessibilityLabel: string;
      readonly onPress: () => void;
      readonly testID?: string;
    }
  | {
      readonly variant: 'status';
      readonly icon?: ReactNode;
      readonly label: string;
      /** Colour for the icon and label; defaults to `textMuted` (e.g. `correctText` for a solved state). */
      readonly color?: string;
      readonly testID?: string;
    }
  | {
      readonly variant: 'length';
      readonly label: string;
      readonly selected: boolean;
      readonly accessibilityLabel: string;
      readonly onPress: () => void;
      readonly testID?: string;
    };

const STREAK_HIT_SLOP = { top: (TOUCH_TARGET - CHIP_HEIGHT.streak) / 2, bottom: (TOUCH_TARGET - CHIP_HEIGHT.streak) / 2, left: SPACING.xs, right: SPACING.xs };
const LENGTH_HIT_SLOP = { top: (TOUCH_TARGET - CHIP_HEIGHT.length) / 2, bottom: (TOUCH_TARGET - CHIP_HEIGHT.length) / 2, left: SPACING.xs, right: SPACING.xs };

/** The home top bar's streak chip (mobile-redesign-spec.md section B): a pressable pill, Flame icon + count. */
function StreakChip({ icon, label, accessibilityLabel, onPress, testID }: Extract<ChipProps, { variant: 'streak' }>) {
  const { colors } = useTheme();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      hitSlop={STREAK_HIT_SLOP}
      style={[styles.pill, { height: CHIP_HEIGHT.streak, backgroundColor: colors.surface }]}
    >
      {icon}
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
    </Pressable>
  );
}

/** A non-interactive status pill inside a mode card (e.g. "Çözüldü · 3/6", "04:12:09"); colour carries the game state. */
function StatusChip({ icon, label, color, testID }: Extract<ChipProps, { variant: 'status' }>) {
  const { colors } = useTheme();
  return (
    <View testID={testID} style={styles.row}>
      {icon}
      <Text style={[styles.label, { color: color ?? colors.textMuted }]}>{label}</Text>
    </View>
  );
}

/** A selectable word-length chip (A3: 40 dp visual height, `hitSlop` 4 to reach 48 dp). */
function LengthChip({ label, selected, accessibilityLabel, onPress, testID }: Extract<ChipProps, { variant: 'length' }>) {
  const { colors } = useTheme();
  const fill = selected ? colors.brand : colors.surface;
  const textColor = selected ? colors.brandFg : colors.text;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected }}
      onPress={onPress}
      hitSlop={LENGTH_HIT_SLOP}
      style={[styles.pill, { height: CHIP_HEIGHT.length, backgroundColor: fill }, !selected && { borderWidth: 1, borderColor: colors.surfaceBorder }]}
    >
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </Pressable>
  );
}

export function Chip(props: ChipProps) {
  if (props.variant === 'streak') return <StreakChip {...props} />;
  if (props.variant === 'status') return <StatusChip {...props} />;
  return <LengthChip {...props} />;
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  label: { fontSize: FONT_SIZE.caption, fontWeight: '700', fontVariant: ['tabular-nums'] },
});
