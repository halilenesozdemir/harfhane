import type { ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../ThemeProvider';
import { RADIUS, TOUCH_TARGET } from './layout';

export interface IconButtonProps {
  /** A sized, coloured Lucide icon element; this component only places it. */
  readonly icon: ReactNode;
  readonly accessibilityLabel: string;
  readonly onPress: () => void;
  readonly disabled?: boolean;
  readonly testID?: string;
}

/**
 * A 48 dp round tap target for a single Lucide icon (mobile-ui-standard.md
 * section 8/14: no depth edge, flat; the pressed state fills `surface`).
 */
export function IconButton({ icon, accessibilityLabel, onPress, disabled = false, testID }: IconButtonProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.target, pressed && { backgroundColor: colors.surface }, disabled && styles.disabled]}
    >
      {icon}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  target: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.5 },
});
