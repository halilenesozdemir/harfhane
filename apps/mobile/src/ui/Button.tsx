import type { ReactNode } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '../ThemeProvider';
import type { ThemeColors } from '../theme';
import { DEPTH, FONT_SIZE, RADIUS, SPACING } from './layout';
import { usePressDepth } from './usePressDepth';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary';

export interface ButtonProps {
  readonly label: string;
  readonly onPress: () => void;
  readonly variant?: ButtonVariant;
  readonly icon?: ReactNode;
  readonly disabled?: boolean;
  readonly testID?: string;
}

const BUTTON_HEIGHT: Readonly<Record<ButtonVariant, number>> = { primary: 52, secondary: 52, tertiary: 48 };
const PRESSED_DEPTH = 1;

function getButtonLook(variant: ButtonVariant, colors: ThemeColors) {
  if (variant === 'primary') return { backgroundColor: colors.brand, color: colors.brandFg, depthColor: colors.brandDepth };
  if (variant === 'secondary') return { backgroundColor: colors.surface, color: colors.text, depthColor: colors.surfaceDepth, borderColor: colors.surfaceBorder };
  return { backgroundColor: 'transparent', color: colors.brand, depthColor: undefined };
}

export function Button({ label, onPress, variant = 'primary', icon, disabled = false, testID }: ButtonProps) {
  const { colors } = useTheme();
  const hasDepth = variant !== 'tertiary' && !disabled;
  const { depth, translateY, onPressIn, onPressOut } = usePressDepth({ restingDepth: hasDepth ? DEPTH.md : 0, pressedDepth: hasDepth ? PRESSED_DEPTH : 0 });
  const { backgroundColor, color, depthColor, borderColor } = getButtonLook(variant, colors);

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      onPressIn={hasDepth ? onPressIn : undefined}
      onPressOut={hasDepth ? onPressOut : undefined}
      style={[
        styles.button,
        { height: BUTTON_HEIGHT[variant], backgroundColor },
        variant === 'secondary' && { borderWidth: 1, borderColor },
        hasDepth && { borderBottomWidth: depth, borderBottomColor: depthColor },
        disabled && styles.disabled,
      ]}
    >
      <Animated.View style={[styles.content, { transform: [{ translateY }] }]}>
        {icon}
        <Text style={[styles.label, { color }]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.xl,
  },
  content: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  label: { fontSize: FONT_SIZE.bodyLarge, fontWeight: '700' },
  disabled: { opacity: 0.5 },
});
