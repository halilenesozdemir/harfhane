import { act, cleanup, renderHook } from '@testing-library/react-native';
import { TOTAL_INTRO_MS, useLaunchIntroPhases } from './useLaunchIntroPhases';

// Owner decision 2026-10-09 (follow-up): the intro must land at ~2.3s total, not drift back
// toward the pre-follow-up ~3.1s.
const TOTAL_INTRO_TOLERANCE_MS = 100;

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

  it('should land the total intro duration at about 2.3s, not drift back toward the old ~3.1s', async () => {
    const onDone = jest.fn();
    const { result } = await renderHook(() => useLaunchIntroPhases(false, onDone));

    expect(TOTAL_INTRO_MS).toBeGreaterThan(2300 - TOTAL_INTRO_TOLERANCE_MS);
    expect(TOTAL_INTRO_MS).toBeLessThan(2300 + TOTAL_INTRO_TOLERANCE_MS);

    await advance(TOTAL_INTRO_MS - TOTAL_INTRO_TOLERANCE_MS);
    expect(result.current.phase).not.toBe('done');

    await advance(TOTAL_INTRO_TOLERANCE_MS);
    expect(result.current.phase).toBe('done');
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
