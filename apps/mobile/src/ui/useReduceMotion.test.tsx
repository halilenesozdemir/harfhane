import { act, renderHook, waitFor } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import { useReduceMotion } from './useReduceMotion';

describe('useReduceMotion', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return false when the system reports reduce motion off', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
    const { result } = await renderHook(() => useReduceMotion());
    await waitFor(() => expect(result.current).toBe(false));
  });

  it('should return true when the system reports reduce motion on', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    const { result } = await renderHook(() => useReduceMotion());
    await waitFor(() => expect(result.current).toBe(true));
  });

  it('should update when the reduceMotionChanged event fires', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
    let changeHandler: ((isEnabled: boolean) => void) | undefined;
    const addEventListenerSpy = jest.spyOn(AccessibilityInfo, 'addEventListener') as unknown as jest.SpyInstance<
      ReturnType<typeof AccessibilityInfo.addEventListener>,
      [string, (isEnabled: boolean) => void]
    >;
    addEventListenerSpy.mockImplementation((event, handler) => {
      if (event === 'reduceMotionChanged') changeHandler = handler;
      return { remove: jest.fn() } as unknown as ReturnType<typeof AccessibilityInfo.addEventListener>;
    });
    const { result } = await renderHook(() => useReduceMotion());
    await waitFor(() => expect(result.current).toBe(false));

    await act(async () => changeHandler?.(true));

    await waitFor(() => expect(result.current).toBe(true));
  });
});
