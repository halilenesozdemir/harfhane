import type { ReactNode } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../ThemeProvider';
import { DEPTH, RADIUS, SPACING } from './layout';
import { usePressDepth } from './usePressDepth';

export interface CardProps {
  readonly children: ReactNode;
  /** Makes the whole card one pressable target (CA2); omit for a static card (D3). */
  readonly onPress?: () => void;
  /** Required when `onPress` is set; states the card's content and state (CA2). */
  readonly accessibilityLabel?: string;
  readonly padding?: number;
  readonly testID?: string;
}

const PRESSED_DEPTH = 1;

/**
 * `DepthSurface`: a `surface` card with a 1 dp border, depth only when the
 * whole card is a single pressable target (mobile-ui-standard.md CA1-CA2).
 */
export function Card({ children, onPress, accessibilityLabel, padding = SPACING.lg, testID }: CardProps) {
  const { colors } = useTheme();
  const isPressable = Boolean(onPress);
  const { depth, translateY, onPressIn, onPressOut } = usePressDepth({ restingDepth: isPressable ? DEPTH.md : 0, pressedDepth: isPressable ? PRESSED_DEPTH : 0 });
  const boxStyle = [
    styles.card,
    { padding, backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
    isPressable && { borderBottomWidth: depth, borderBottomColor: colors.surfaceDepth },
  ];

  if (!isPressable) {
    return <View testID={testID} style={boxStyle}>{children}</View>;
  }

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={boxStyle}
    >
      <Animated.View style={{ transform: [{ translateY }] }}>{children}</Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: RADIUS.lg, borderWidth: 1 },
});
