import { act, cleanup, renderHook, waitFor } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import type { EmitterSubscription } from 'react-native';
import { useReduceMotion } from './useReduceMotion';

function fakeSubscription(remove: () => void): EmitterSubscription {
  return { remove } as unknown as EmitterSubscription;
}

describe('useReduceMotion', () => {
  afterEach(async () => {
    await cleanup();
    jest.restoreAllMocks();
  });

  it('should be false before the system setting resolves', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockReturnValue(new Promise(() => undefined));
    const { result } = await renderHook(() => useReduceMotion());
    expect(result.current).toBe(false);
  });

  it('should become true once the system setting resolves as enabled', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    const { result } = await renderHook(() => useReduceMotion());
    await waitFor(() => expect(result.current).toBe(true));
  });

  it('should update when the system setting changes after mount', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
    let changeHandler: ((enabled: boolean) => void) | undefined;
    jest.spyOn(AccessibilityInfo, 'addEventListener').mockImplementation((_event, handler) => {
      changeHandler = handler as unknown as (enabled: boolean) => void;
      return fakeSubscription(jest.fn());
    });
    const { result } = await renderHook(() => useReduceMotion());
    await waitFor(() => expect(result.current).toBe(false));
    await act(async () => {
      changeHandler?.(true);
    });
    expect(result.current).toBe(true);
  });

  it('should remove the change listener on unmount', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
    const remove = jest.fn();
    jest.spyOn(AccessibilityInfo, 'addEventListener').mockReturnValue(fakeSubscription(remove));
    const { unmount } = await renderHook(() => useReduceMotion());
    await unmount();
    expect(remove).toHaveBeenCalledTimes(1);
  });
});
