import { act, renderHook, waitFor } from '@testing-library/react-native';
import { AccessibilityInfo, Animated } from 'react-native';
import { base } from '@harfhane/ui-tokens';
import { parseMs } from '../utils/ms';
import { usePressDepth } from './usePressDepth';

const PRESS_ANIMATION_MS = parseMs(base.motionFast);

describe('usePressDepth', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should lower the depth to the pressed value while pressed', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
    const { result } = await renderHook(() => usePressDepth({ restingDepth: 4, pressedDepth: 1 }));

    await act(async () => result.current.onPressIn());

    expect(result.current.isPressed).toBe(true);
    expect(result.current.depth).toBe(1);
  });

  it('should restore the resting depth on release', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
    const { result } = await renderHook(() => usePressDepth({ restingDepth: 4, pressedDepth: 1 }));

    await act(async () => result.current.onPressIn());
    await act(async () => result.current.onPressOut());

    expect(result.current.isPressed).toBe(false);
    expect(result.current.depth).toBe(4);
  });

  it('should animate the face to the pressed offset over the motion-fast token duration on the native driver', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
    const timingSpy = jest.spyOn(Animated, 'timing');
    const { result } = await renderHook(() => usePressDepth({ restingDepth: 4, pressedDepth: 1 }));

    await act(async () => result.current.onPressIn());

    expect(timingSpy).toHaveBeenCalledWith(result.current.translateY, {
      toValue: 3,
      duration: PRESS_ANIMATION_MS,
      useNativeDriver: true,
    });
  });

  it('should move the face instantly, without animating, when reduce motion is on', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    const timingSpy = jest.spyOn(Animated, 'timing');
    const { result } = await renderHook(() => usePressDepth({ restingDepth: 4, pressedDepth: 1 }));
    await waitFor(() => expect(AccessibilityInfo.isReduceMotionEnabled).toHaveBeenCalled());

    await act(async () => result.current.onPressIn());

    expect(timingSpy).not.toHaveBeenCalled();
    expect((result.current.translateY as unknown as { __getValue: () => number }).__getValue()).toBe(3);
  });
});
