import type { ReactNode } from 'react';
import { Animated, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../ThemeProvider';
import { DEPTH, RADIUS, SPACING } from './layout';
import { usePressDepth } from './usePressDepth';

interface CardBaseProps {
  readonly children: ReactNode;
  readonly padding?: number;
  readonly testID?: string;
  // Layout-only overrides for the face (e.g. a grid cell's width/minHeight);
  // never used to change colors or borders, which stay theme-driven above.
  readonly style?: StyleProp<ViewStyle>;
}

export type CardProps = CardBaseProps &
  (
    | { readonly onPress: () => void; readonly accessibilityLabel: string }
    | { readonly onPress?: undefined; readonly accessibilityLabel?: undefined }
  );

const PRESSED_DEPTH = 1;

function renderFace(
  testID: string | undefined,
  padding: number,
  backgroundColor: string,
  borderColor: string,
  translateY: Animated.Value,
  children: ReactNode,
  style?: StyleProp<ViewStyle>,
) {
  return (
    <Animated.View testID={testID} style={[styles.face, { padding, backgroundColor, borderColor, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}

/**
 * `DepthSurface`: a `surface` card with a 1 dp border, depth only when the
 * whole card is a single pressable target (mobile-ui-standard.md CA1-CA2).
 * A pressable card reserves the resting depth as outer padding (constant
 * total height, D2/M3): a static back layer in `surfaceDepth` sits behind,
 * and the face translates down over it on the native driver when pressed.
 */
export function Card(props: CardProps) {
  const { children, padding = SPACING.lg, testID, style } = props;
  const { colors } = useTheme();
  const isPressable = props.onPress !== undefined;
  const restingDepth = isPressable ? DEPTH.md : 0;
  const pressedDepth = isPressable ? PRESSED_DEPTH : 0;
  const { translateY, onPressIn, onPressOut } = usePressDepth({ restingDepth, pressedDepth });

  if (!isPressable) {
    return renderFace(testID, padding, colors.surface, colors.surfaceBorder, translateY, children, style);
  }

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={props.accessibilityLabel}
      onPress={props.onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={{ paddingBottom: restingDepth }}
    >
      <View testID={testID ? `${testID}-back` : undefined} style={[styles.backLayer, { top: restingDepth, backgroundColor: colors.surfaceDepth }]} />
      {renderFace(testID ? `${testID}-face` : undefined, padding, colors.surface, colors.surfaceBorder, translateY, children, style)}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backLayer: { position: 'absolute', left: 0, right: 0, bottom: 0, borderRadius: RADIUS.lg },
  face: { borderRadius: RADIUS.lg, borderWidth: 1 },
});
