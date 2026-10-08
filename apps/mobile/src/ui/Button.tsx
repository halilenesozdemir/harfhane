import { useEffect, type ReactNode } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../ThemeProvider';
import type { ThemeColors } from '../theme';
import { DEPTH, DISABLED_OPACITY, FONT_SIZE, RADIUS, SPACING } from './layout';
import { usePressDepth } from './usePressDepth';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary';

interface ButtonBaseProps {
  readonly label: string;
  readonly variant?: ButtonVariant;
  readonly icon?: ReactNode;
  readonly disabled?: boolean;
  readonly testID?: string;
}

export type ButtonProps = ButtonBaseProps &
  (
    | { readonly onPress: () => void; readonly pressed?: undefined }
    | {
        readonly onPress?: undefined;
        /** Drives the depth animation from a parent's own press state (CA2: a button-styled CTA inside a pressable Card is part of the card's target, not its own Pressable). */
        readonly pressed?: boolean;
      }
  );

const BUTTON_HEIGHT: Readonly<Record<ButtonVariant, number>> = { primary: 52, secondary: 52, tertiary: 48 };
const LABEL_FONT_SIZE: Readonly<Record<ButtonVariant, number>> = { primary: FONT_SIZE.bodyLarge, secondary: FONT_SIZE.bodyLarge, tertiary: FONT_SIZE.body };
const PRESSED_DEPTH = 1;

function getButtonLook(variant: ButtonVariant, colors: ThemeColors) {
  if (variant === 'primary') return { backgroundColor: colors.brand, color: colors.brandFg, depthColor: colors.brandDepth };
  if (variant === 'secondary') return { backgroundColor: colors.surface, color: colors.text, depthColor: colors.surfaceDepth, borderColor: colors.surfaceBorder };
  return { backgroundColor: 'transparent', color: colors.brand, depthColor: undefined };
}

/** Resets to resting on disable, and mirrors a decorative Button's external `pressed` prop (CA2). */
function useExternalPressState(props: ButtonProps, disabled: boolean, onPressIn: () => void, onPressOut: () => void) {
  useEffect(() => {
    if (disabled) onPressOut();
  }, [disabled, onPressOut]);

  useEffect(() => {
    if (props.onPress !== undefined) return;
    if (props.pressed) onPressIn();
    else onPressOut();
  }, [props.onPress, props.pressed, onPressIn, onPressOut]);
}

function renderFace(
  testID: string | undefined,
  variant: ButtonVariant,
  look: ReturnType<typeof getButtonLook>,
  faceHeight: number,
  translateY: Animated.Value,
  icon: ReactNode,
  label: string,
) {
  const { backgroundColor, color, borderColor } = look;
  return (
    <Animated.View
      testID={testID}
      style={[
        styles.face,
        { height: faceHeight, backgroundColor, transform: [{ translateY }] },
        variant === 'secondary' && { borderWidth: 1, borderColor },
      ]}
    >
      {icon}
      <Text style={[styles.label, { color, fontSize: LABEL_FONT_SIZE[variant] }]}>{label}</Text>
    </Animated.View>
  );
}

/**
 * The outer box has a fixed height (face + resting depth) that never
 * changes on press (D2/M3): a static back layer in the fill's `*Depth`
 * colour sits behind, and the face (bg + content) translates down over it
 * on the native driver, exposing less of the back layer while pressed.
 */
export function Button(props: ButtonProps) {
  const { label, variant = 'primary', icon, disabled = false, testID } = props;
  const { colors } = useTheme();
  // Depth is reserved by variant alone (D2): disabling never changes the outer
  // height, it only skips drawing the back layer below.
  const hasDepth = variant !== 'tertiary';
  const restingDepth = hasDepth ? DEPTH.md : 0;
  const pressedDepth = hasDepth ? PRESSED_DEPTH : 0;
  const { translateY, onPressIn, onPressOut } = usePressDepth({ restingDepth, pressedDepth });
  const look = getButtonLook(variant, colors);
  const faceHeight = BUTTON_HEIGHT[variant];
  useExternalPressState(props, disabled, onPressIn, onPressOut);

  const outerStyle = [styles.outer, { height: faceHeight + restingDepth }, disabled && styles.disabled];
  const backLayer =
    hasDepth && !disabled && look.depthColor ? (
      <View testID={testID ? `${testID}-back` : undefined} style={[styles.backLayer, { top: restingDepth, backgroundColor: look.depthColor }]} />
    ) : null;
  const face = renderFace(testID ? `${testID}-face` : undefined, variant, look, faceHeight, translateY, icon, label);

  if (props.onPress === undefined) {
    return (
      <View testID={testID} style={outerStyle} importantForAccessibility="no-hide-descendants">
        {backLayer}
        {face}
      </View>
    );
  }

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={props.onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={outerStyle}
    >
      {backLayer}
      {face}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outer: { borderRadius: RADIUS.md },
  backLayer: { position: 'absolute', left: 0, right: 0, bottom: 0, borderRadius: RADIUS.md },
  face: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.xl,
  },
  label: { fontWeight: '700' },
  disabled: { opacity: DISABLED_OPACITY },
});
