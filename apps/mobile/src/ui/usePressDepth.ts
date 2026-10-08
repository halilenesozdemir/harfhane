import { useCallback, useState } from 'react';
import { Animated } from 'react-native';
import { base } from '@harfhane/ui-tokens';
import { parseMs } from '../utils/ms';
import { useReduceMotion } from './motion/useReduceMotion';

const PRESS_ANIMATION_MS = parseMs(base.motionFast);

export interface UsePressDepthOptions {
  /** Bottom depth-edge height (dp) at rest, e.g. `DEPTH.md`. */
  readonly restingDepth: number;
  /** Bottom depth-edge height (dp) while pressed; the face moves down by the difference (D2). */
  readonly pressedDepth: number;
}

export interface PressDepthState {
  readonly isPressed: boolean;
  /** Current bottom depth-edge height; swap into `borderBottomWidth`. */
  readonly depth: number;
  /** Native-driver transform; spread into a style's `transform` array. */
  readonly translateY: Animated.Value;
  readonly onPressIn: () => void;
  readonly onPressOut: () => void;
}

/**
 * Tactile press feedback for the playful 3D depth look (mobile-ui-standard.md
 * section 5): the face lowers by the lost depth on press, animated on the
 * native driver, instant when the system reduce-motion setting is on (M2, M3).
 */
export function usePressDepth({ restingDepth, pressedDepth }: UsePressDepthOptions): PressDepthState {
  const isReduceMotionEnabled = useReduceMotion();
  const [isPressed, setIsPressed] = useState(false);
  const [translateY] = useState(() => new Animated.Value(0));
  const pressedTranslateY = restingDepth - pressedDepth;

  const animateTo = useCallback(
    (value: number) => {
      if (isReduceMotionEnabled) {
        translateY.setValue(value);
        return;
      }
      Animated.timing(translateY, { toValue: value, duration: PRESS_ANIMATION_MS, useNativeDriver: true }).start();
    },
    [translateY, isReduceMotionEnabled],
  );

  const onPressIn = useCallback(() => {
    setIsPressed(true);
    animateTo(pressedTranslateY);
  }, [animateTo, pressedTranslateY]);

  const onPressOut = useCallback(() => {
    setIsPressed(false);
    animateTo(0);
  }, [animateTo]);

  return { isPressed, depth: isPressed ? pressedDepth : restingDepth, translateY, onPressIn, onPressOut };
}
