import { useEffect, useState } from 'react';
import { Animated } from 'react-native';
import { base } from '@harfhane/ui-tokens';
import { parseMs } from '../../utils/ms';

const SHAKE_MS = parseMs(base.motionShake);
const SHAKE_OFFSET = 5;
// Mirrors the web shake keyframes (10%, 30%, 50%, 70%, 90% at -5px; 20%, 40%, 60%, 80% at +5px).
const SHAKE_STEPS = [0, -1, 1, -1, 1, -1, 1, -1, 1, 0].map((sign) => sign * SHAKE_OFFSET);
const STEP_MS = SHAKE_MS / (SHAKE_STEPS.length - 1);

// A rejected guess shakes its row; reduce motion (R2) skips the shake entirely.
export function useShakeAnimation(shake: boolean, reduceMotion: boolean): Animated.Value {
  const [translateX] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (!shake || reduceMotion) return;
    translateX.setValue(0);
    Animated.sequence(
      SHAKE_STEPS.slice(1).map((toValue) => Animated.timing(translateX, { toValue, duration: STEP_MS, useNativeDriver: true })),
    ).start();
  }, [shake, reduceMotion, translateX]);
  return translateX;
}
