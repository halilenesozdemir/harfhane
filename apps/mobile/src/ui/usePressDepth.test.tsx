import { act, renderHook, waitFor } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import { usePressDepth } from './usePressDepth';

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

  it('should move the face instantly when reduce motion is on', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    const { result } = await renderHook(() => usePressDepth({ restingDepth: 4, pressedDepth: 1 }));
    await waitFor(() => expect(result.current.translateY).toBeDefined());

    await act(async () => result.current.onPressIn());

    expect(result.current.translateY).toHaveProperty('__getValue');
    expect((result.current.translateY as unknown as { __getValue: () => number }).__getValue()).toBe(3);
  });
});
