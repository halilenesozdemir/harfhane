import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Mirrors the system reduce-motion setting (mobile-ui-standard.md M2). Every
 * non-essential animation in `ui/` checks this before starting a transition.
 */
export function useReduceMotion(): boolean {
  const [isReduceMotionEnabled, setIsReduceMotionEnabled] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (isCurrent) setIsReduceMotionEnabled(value);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setIsReduceMotionEnabled);
    return () => {
      isCurrent = false;
      subscription.remove();
    };
  }, []);

  return isReduceMotionEnabled;
}
