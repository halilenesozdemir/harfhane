import type { ReactNode } from 'react';
import { Animated, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { useTheme } from '../ThemeProvider';
import { DEPTH, RADIUS, SPACING } from './layout';
import { usePressDepth } from './usePressDepth';

/**
 * Layout-only overrides for a Card (e.g. a grid cell's width/minHeight): never a color,
 * border or transform key, so a caller cannot override the theme-driven face or break
 * press depth (CA1-CA2, D2).
 */
export type CardLayoutStyle = Pick<
  ViewStyle,
  'width' | 'minHeight' | 'flexBasis' | 'flexGrow' | 'alignItems' | 'justifyContent' | 'alignSelf'
>;

/**
 * A pressable card's style goes on the outer wrapper (so percentage widths resolve against the
 * parent); minHeight or alignment there would stretch or misalign the back layer under the face.
 */
export type PressableCardLayoutStyle = Pick<ViewStyle, 'width' | 'flexBasis' | 'flexGrow' | 'alignSelf'>;

interface CardBaseProps {
  readonly children: ReactNode;
  readonly padding?: number;
  readonly testID?: string;
}

export type CardProps = CardBaseProps &
  (
    | { readonly onPress: () => void; readonly accessibilityLabel: string; readonly style?: PressableCardLayoutStyle }
    | { readonly onPress?: undefined; readonly accessibilityLabel?: undefined; readonly style?: CardLayoutStyle }
  );

const PRESSED_DEPTH = 1;

function renderFace(
  testID: string | undefined,
  padding: number,
  backgroundColor: string,
  borderColor: string,
  translateY: Animated.Value,
  children: ReactNode,
  style?: CardLayoutStyle,
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
    // `style` lands on this outer wrapper, not the face: a percentage width set on the face
    // would resolve against the face's own auto-sized parent (this Pressable) instead of the
    // flex container the Card sits in, so a percentage width would be unresolvable.
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={props.accessibilityLabel}
      onPress={props.onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={[{ paddingBottom: restingDepth }, style]}
    >
      <View testID={testID ? `${testID}-back` : undefined} style={[styles.backLayer, { top: restingDepth, backgroundColor: colors.surfaceDepth }]} />
      {renderFace(testID ? `${testID}-face` : undefined, padding, colors.surface, colors.surfaceBorder, translateY, children)}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backLayer: { position: 'absolute', left: 0, right: 0, bottom: 0, borderRadius: RADIUS.lg },
  face: { borderRadius: RADIUS.lg, borderWidth: 1 },
});
