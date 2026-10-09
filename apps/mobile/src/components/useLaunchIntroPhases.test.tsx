import { act, cleanup, renderHook } from '@testing-library/react-native';
import { useLaunchIntroPhases } from './useLaunchIntroPhases';

async function advance(ms: number) {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
}

describe('useLaunchIntroPhases', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(async () => {
    await cleanup();
    jest.useRealTimers();
  });

  it('should start at mark, move to tiles with row2Celebrate still off, then finish exactly once with it on', async () => {
    const onDone = jest.fn();
    const { result } = await renderHook(() => useLaunchIntroPhases(false, onDone));
    expect(result.current.phase).toBe('mark');

    await advance(250);
    expect(result.current.phase).toBe('tiles');
    expect(result.current.row2Celebrate).toBe(false);

    await advance(10_000);
    expect(result.current.phase).toBe('done');
    expect(result.current.row2Celebrate).toBe(true);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('should finish immediately and ignore any still-pending timers when skip is called mid-sequence', async () => {
    const onDone = jest.fn();
    const { result } = await renderHook(() => useLaunchIntroPhases(false, onDone));
    await advance(250);

    await act(async () => result.current.skip());
    expect(result.current.phase).toBe('done');
    expect(onDone).toHaveBeenCalledTimes(1);

    await advance(10_000);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('should finish immediately and call onDone exactly once when reduce motion is already on', async () => {
    const onDone = jest.fn();
    const { result } = await renderHook(() => useLaunchIntroPhases(true, onDone));
    expect(result.current.phase).toBe('done');
    expect(onDone).toHaveBeenCalledTimes(1);

    await advance(10_000);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('should finish and call onDone exactly once if reduce motion turns on mid-sequence', async () => {
    const onDone = jest.fn();
    const { result, rerender } = await renderHook(
      ({ reduceMotion }: { reduceMotion: boolean }) => useLaunchIntroPhases(reduceMotion, onDone),
      { initialProps: { reduceMotion: false } },
    );
    await advance(250);
    expect(result.current.phase).toBe('tiles');

    await act(async () => {
      await rerender({ reduceMotion: true });
    });
    expect(result.current.phase).toBe('done');
    expect(onDone).toHaveBeenCalledTimes(1);

    await advance(10_000);
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
