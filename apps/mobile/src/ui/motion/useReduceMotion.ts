import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

const REDUCE_MOTION_EVENT = 'reduceMotionChanged';

// Every animated tile checks this before touching `Animated` so the whole board degrades to a
// static, instant reveal when the player's system setting asks for less motion (AE2).
export function useReduceMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (isCurrent) setReduceMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener(REDUCE_MOTION_EVENT, setReduceMotion);
    return () => {
      isCurrent = false;
      subscription.remove();
    };
  }, []);

  return reduceMotion;
}
