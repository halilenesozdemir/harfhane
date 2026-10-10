import type { ReactNode } from 'react';
import { Animated } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import { base, themes } from '@harfhane/ui-tokens';
import { Tile } from './Tile';
import { ThemeProvider } from '../ThemeProvider';
import { createMemoryStore, flattenStyle } from '../test-utils/render-with-theme';
import { parseMs } from '../utils/ms';

const FLIP_MS = parseMs(base.motionFlip);
const POP_MS = parseMs(base.motionPop);

function wrapper({ children }: { children: ReactNode }) {
  return <ThemeProvider store={createMemoryStore()}>{children}</ThemeProvider>;
}

async function renderTile(element: Parameters<typeof render>[0]) {
  return render(element, { wrapper });
}

function isFlipTimingCall(call: unknown[]): boolean {
  const config = call[1] as { duration?: number } | undefined;
  return config?.duration === FLIP_MS;
}

describe('Tile animations', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('should keep the pre-flip appearance until the midpoint, then switch to the evaluated colour', async () => {
    await renderTile(<Tile letter="K" status="correct" isFilled isRevealing revealDelayMs={0} />);
    const tile = screen.getByLabelText('K, doğru yerde');
    expect(flattenStyle(tile.props.style).backgroundColor).not.toBe(themes.light.correct);
    await act(async () => {
      jest.advanceTimersByTime(250);
    });
    expect(flattenStyle(tile.props.style).backgroundColor).toBe(themes.light.correct);
  });

  it('should respect a later column stagger delay before switching colour', async () => {
    await renderTile(<Tile letter="K" status="correct" isFilled isRevealing revealDelayMs={100} />);
    const tile = screen.getByLabelText('K, doğru yerde');
    await act(async () => {
      jest.advanceTimersByTime(250);
    });
    // Without the delay added, 250ms would already be past the (0 + 250) midpoint.
    expect(flattenStyle(tile.props.style).backgroundColor).not.toBe(themes.light.correct);
    await act(async () => {
      jest.advanceTimersByTime(100);
    });
    expect(flattenStyle(tile.props.style).backgroundColor).toBe(themes.light.correct);
  });

  it('should show the evaluated colours immediately and start no flip timing animation when reduce motion is enabled (011-AE2)', async () => {
    const timingSpy = jest.spyOn(Animated, 'timing');
    await renderTile(<Tile letter="K" status="correct" isFilled isRevealing revealDelayMs={100} reduceMotion />);
    const tile = screen.getByLabelText('K, doğru yerde');
    expect(flattenStyle(tile.props.style).backgroundColor).toBe(themes.light.correct);
    expect(timingSpy.mock.calls.some(isFlipTimingCall)).toBe(false);
  });

  it('should reveal the colour immediately when reduce motion turns on mid-flip, instead of leaving the tile neutral forever', async () => {
    const { rerender } = await renderTile(<Tile letter="K" status="correct" isFilled isRevealing revealDelayMs={0} reduceMotion={false} />);
    const tile = screen.getByLabelText('K, doğru yerde');
    // Still pre-midpoint — the colour has not switched yet.
    expect(flattenStyle(tile.props.style).backgroundColor).not.toBe(themes.light.correct);

    await act(async () => {
      await rerender(<Tile letter="K" status="correct" isFilled isRevealing revealDelayMs={0} reduceMotion />);
    });
    expect(flattenStyle(tile.props.style).backgroundColor).toBe(themes.light.correct);

    // The now-cancelled midpoint timer must not do anything odd once it would have fired.
    await act(async () => {
      jest.advanceTimersByTime(250);
    });
    expect(flattenStyle(tile.props.style).backgroundColor).toBe(themes.light.correct);
  });

  it('should use a caller-supplied flipDurationMs for the flip animation instead of the shared motion-flip token', async () => {
    const timingSpy = jest.spyOn(Animated, 'timing');
    await renderTile(<Tile letter="K" status="correct" isFilled isRevealing revealDelayMs={0} flipDurationMs={350} />);
    const flipCall = timingSpy.mock.calls.find((call) => (call[1] as { duration?: number })?.duration === 350);
    expect(flipCall).toBeTruthy();
    expect(timingSpy.mock.calls.some(isFlipTimingCall)).toBe(false);
  });

  it('should switch to the evaluated colour at the midpoint of a caller-supplied flipDurationMs, not the shared motion-flip midpoint', async () => {
    await renderTile(<Tile letter="K" status="correct" isFilled isRevealing revealDelayMs={0} flipDurationMs={350} />);
    const tile = screen.getByLabelText('K, doğru yerde');
    await act(async () => {
      jest.advanceTimersByTime(174);
    });
    expect(flattenStyle(tile.props.style).backgroundColor).not.toBe(themes.light.correct);
    await act(async () => {
      jest.advanceTimersByTime(1);
    });
    expect(flattenStyle(tile.props.style).backgroundColor).toBe(themes.light.correct);
  });

  it('should pass the per-tile stagger delay to the flip animation, not a fixed 0', async () => {
    const timingSpy = jest.spyOn(Animated, 'timing');
    await renderTile(<Tile letter="K" status="correct" isFilled isRevealing revealDelayMs={300} />);
    const flipCall = timingSpy.mock.calls.find(isFlipTimingCall);
    expect(flipCall?.[1]).toMatchObject({ delay: 300 });
  });

  it('should pop the tile when a letter fills it, not when it is a hint placeholder', async () => {
    const timingSpy = jest.spyOn(Animated, 'timing');
    const { rerender } = await renderTile(<Tile letter="" status={null} isFilled={false} />);
    await act(async () => {
      await rerender(<Tile letter="K" status={null} isFilled isHint={false} />);
    });
    const popCall = timingSpy.mock.calls.find((call) => (call[1] as { duration?: number })?.duration === POP_MS / 2);
    expect(popCall).toBeTruthy();
  });

  it('should not pop a hint placeholder tile', async () => {
    const timingSpy = jest.spyOn(Animated, 'timing');
    await renderTile(<Tile letter="L" status={null} isFilled={false} isHint />);
    const popCall = timingSpy.mock.calls.find((call) => (call[1] as { duration?: number })?.duration === POP_MS / 2);
    expect(popCall).toBeUndefined();
  });

  it('should scale the tile box and letter size from the size prop', async () => {
    await renderTile(<Tile letter="K" status={null} isFilled size={48} />);
    const tile = screen.getByLabelText('K');
    const style = flattenStyle(tile.props.style);
    expect(style.width).toBe(48);
    expect(style.height).toBe(48);
    expect(flattenStyle(screen.getByText('K').props.style).fontSize).toBe(24);
  });

  it('should cap how far the letter grows with the OS font-size setting', async () => {
    await renderTile(<Tile letter="K" status={null} isFilled />);
    expect(screen.getByText('K').props.maxFontSizeMultiplier).toBe(1.2);
  });

  it('should not switch colour early when revealing is false', async () => {
    await renderTile(<Tile letter="K" status="correct" isFilled isRevealing={false} />);
    const tile = screen.getByLabelText('K, doğru yerde');
    expect(flattenStyle(tile.props.style).backgroundColor).toBe(themes.light.correct);
  });
});
