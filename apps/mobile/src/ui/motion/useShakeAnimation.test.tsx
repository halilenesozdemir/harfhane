import { act, renderHook } from '@testing-library/react-native';
import { Animated } from 'react-native';
import { useShakeAnimation } from './useShakeAnimation';

describe('useShakeAnimation', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should start a shake sequence when shake becomes true without reduce motion', async () => {
    const sequenceSpy = jest.spyOn(Animated, 'sequence');
    const { rerender } = await renderHook(({ shake, reduceMotion }: { shake: boolean; reduceMotion: boolean }) => useShakeAnimation(shake, reduceMotion), {
      initialProps: { shake: false, reduceMotion: false },
    });
    expect(sequenceSpy).not.toHaveBeenCalled();
    await act(async () => rerender({ shake: true, reduceMotion: false }));
    expect(sequenceSpy).toHaveBeenCalledTimes(1);
  });

  it('should not start a shake sequence when reduce motion is enabled', async () => {
    const sequenceSpy = jest.spyOn(Animated, 'sequence');
    const { rerender } = await renderHook(({ shake, reduceMotion }: { shake: boolean; reduceMotion: boolean }) => useShakeAnimation(shake, reduceMotion), {
      initialProps: { shake: false, reduceMotion: true },
    });
    await act(async () => rerender({ shake: true, reduceMotion: true }));
    expect(sequenceSpy).not.toHaveBeenCalled();
  });
});
