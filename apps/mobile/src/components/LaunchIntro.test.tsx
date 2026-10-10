import { act, cleanup, fireEvent, render, screen } from '@testing-library/react-native';
import { AccessibilityInfo, Animated } from 'react-native';
import type { ComponentProps } from 'react';
import { LaunchIntro } from './LaunchIntro';
import type { Tile } from './Tile';
import { LAUNCH_INTRO_TIMING, TOTAL_INTRO_MS } from './useLaunchIntroPhases';
import { flattenStyle } from '../test-utils/render-with-theme';

type TileProps = ComponentProps<typeof Tile>;

// Records every Tile render's props (rendering the real Tile) so the intro's wiring of timing and
// celebration into each row is checked, not just the phase hook's own clock.
const mockTileRenders: TileProps[] = [];
jest.mock('./Tile', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const actual = jest.requireActual<typeof import('./Tile')>('./Tile');
  return {
    ...actual,
    Tile: (props: TileProps) => {
      mockTileRenders.push(props);
      return React.createElement(actual.Tile, props);
    },
  };
});

const TILES_PER_ROW = 4;
const OWNER_INTRO_FLIP_MS = 350;
const SAMPLE_STEP_MS = 20;

function latestRows(): { readonly row1: readonly TileProps[]; readonly row2: readonly TileProps[] } {
  const last = mockTileRenders.slice(-2 * TILES_PER_ROW);
  return { row1: last.slice(0, TILES_PER_ROW), row2: last.slice(TILES_PER_ROW) };
}


describe('LaunchIntro', () => {
  beforeEach(() => {
    mockTileRenders.length = 0;
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
    jest.useFakeTimers();
  });

  afterEach(async () => {
    await cleanup();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('should expose a single accessible "Harfhane" label for the whole decorative overlay', async () => {
    await render(<LaunchIntro onDone={jest.fn()} />);
    expect(screen.getByLabelText('Harfhane')).toBeTruthy();
  });

  it('should call onDone exactly once after a tap skips straight to home', async () => {
    const onDone = jest.fn();
    await render(<LaunchIntro onDone={onDone} />);

    await act(async () => {
      fireEvent.press(screen.getByTestId('launch-intro'));
    });

    expect(onDone).toHaveBeenCalledTimes(1);

    // Any timers already scheduled before the tap must not fire a second onDone.
    await act(async () => {
      jest.advanceTimersByTime(10_000);
    });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('should unmount (render nothing) once onDone has fired from a skip', async () => {
    await render(<LaunchIntro onDone={jest.fn()} />);

    await act(async () => {
      fireEvent.press(screen.getByTestId('launch-intro'));
    });

    expect(screen.queryByTestId('launch-intro')).toBeNull();
  });

  it('should call onDone exactly once after the full sequence plays out, without a tap', async () => {
    const onDone = jest.fn();
    await render(<LaunchIntro onDone={onDone} />);

    await act(async () => {
      jest.advanceTimersByTime(10_000);
    });

    expect(onDone).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('launch-intro')).toBeNull();
  });

  it('should render nothing and call onDone exactly once when reduce motion is on (skips the intro entirely)', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    const onDone = jest.fn();
    await render(<LaunchIntro onDone={onDone} />);

    await act(async () => {
      jest.advanceTimersByTime(0);
    });

    expect(onDone).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('launch-intro')).toBeNull();
  });

  // The mark/tiles/wordmark layers sit under `importantForAccessibility="no-hide-descendants"`
  // (deliberately: the overlay exposes a single "Harfhane" accessible element, see the
  // accessibility test below), so these queries must opt back in with `{ hidden: true }` to see
  // past that, the same way a sighted user still sees this content on screen.
  const hidden = { hidden: true } as const;

  it('should colour "harf" with the dark-theme brand token and "hane" with the cream text token, both different from the overlay background', async () => {
    await render(<LaunchIntro onDone={jest.fn()} />);

    const harfColor = flattenStyle(screen.getByText('harf', hidden).props.style).color;
    const haneColor = flattenStyle(screen.getByText('hane', hidden).props.style).color;
    // The dark theme's own bg token (#1c1611): "hane" must never equal this, or it disappears
    // against the overlay, which shares the same colour.
    const overlayBg = '#1c1611';

    expect(harfColor).toBe('rgb(232, 98, 42)'); // dark theme brand
    expect(haneColor).toBe('#fff4dc'); // dark theme text (cream)
    expect(harfColor).not.toBe(overlayBg);
    expect(haneColor).not.toBe(overlayBg);
  });

  it('should show the "Her gün yeni bir kelime" subtitle', async () => {
    await render(<LaunchIntro onDone={jest.fn()} />);
    expect(screen.getByText('Her gün yeni bir kelime', hidden)).toBeTruthy();
  });

  it('should mark F as present and K as absent in the FARK reveal row, not correct', async () => {
    await render(<LaunchIntro onDone={jest.fn()} />);
    // Row 1's own F/K only: row 2 also has a (legitimately correct) F, so this asserts the
    // *count*, not just existence, of each status among the FARK row's labels.
    expect(screen.getByLabelText('F, kelimede var', hidden)).toBeTruthy();
    expect(screen.getByLabelText('K, kelimede yok', hidden)).toBeTruthy();
    expect(screen.queryByLabelText('K, kelimede var', hidden)).toBeNull();
  });

  it('should mark every tile in the HARF celebration row as correct', async () => {
    await render(<LaunchIntro onDone={jest.fn()} />);
    expect(screen.getByLabelText('H, doğru yerde', hidden)).toBeTruthy();
    // "A" and "R" are correct in both rows (FARK and HARF); "F" is correct only in row 2 (row 1's
    // F is present, asserted separately above) so one "F, doğru yerde" proves row 2's own F.
    expect(screen.getAllByLabelText('A, doğru yerde', hidden)).toHaveLength(2);
    expect(screen.getAllByLabelText('R, doğru yerde', hidden)).toHaveLength(2);
    expect(screen.getByLabelText('F, doğru yerde', hidden)).toBeTruthy();
  });

  it('should flip every intro tile at the owner-approved 350 ms when the intro plays', async () => {
    await render(<LaunchIntro onDone={jest.fn()} />);
    expect(mockTileRenders.length).toBeGreaterThanOrEqual(2 * TILES_PER_ROW);
    for (const props of mockTileRenders) expect(props.flipDurationMs).toBe(OWNER_INTRO_FLIP_MS);
  });

  it('should start the HARF row as the last FARK tile flips, one continuous sweep, when the intro plays', async () => {
    await render(<LaunchIntro onDone={jest.fn()} />);
    const { row1, row2 } = latestRows();
    const { TILE_REVEAL_START_MS, ROW_STAGGER_MS } = LAUNCH_INTRO_TIMING;
    row1.forEach((props, index) => expect(props.revealDelayMs).toBe(TILE_REVEAL_START_MS + index * ROW_STAGGER_MS));
    expect(row2[0]?.revealDelayMs).toBe(row1[TILES_PER_ROW - 1]?.revealDelayMs);
    row2.forEach((props, index) => expect(props.revealDelayMs).toBe((row2[0]?.revealDelayMs ?? Number.NaN) + index * ROW_STAGGER_MS));
  });

  it('should bounce only the HARF row, never the FARK row, when the sequence plays out', async () => {
    await render(<LaunchIntro onDone={jest.fn()} />);
    let row2Celebrated = false;
    for (let elapsed = 0; elapsed < TOTAL_INTRO_MS - LAUNCH_INTRO_TIMING.CROSSFADE_MS; elapsed += SAMPLE_STEP_MS) {
      await act(async () => {
        jest.advanceTimersByTime(SAMPLE_STEP_MS);
      });
      const { row1, row2 } = latestRows();
      expect(row1.some((props) => props.celebrate)).toBe(false);
      if (row2.length === TILES_PER_ROW && row2.every((props) => props.celebrate)) row2Celebrated = true;
    }
    expect(row2Celebrated).toBe(true);
  });

  it('should fade the tiles in then out under the wordmark, and fade the overlay out at the end, when the sequence plays out', async () => {
    // Animated values don't advance under jest, so this checks the fade targets each layer is sent.
    const timingSpy = jest.spyOn(Animated, 'timing');
    await render(<LaunchIntro onDone={jest.fn()} />);
    // Child (Tile) effects run first, so LaunchIntro's own four useFade calls are the mount
    // commit's last four, in hook order: mark, tiles, wordmark, overlay.
    const [, tilesValue, , overlayValue] = timingSpy.mock.calls.slice(-4).map(([value]) => value);
    // Small steps: one big jump would batch the phase changes into one render and skip 'tiles'.
    for (let elapsed = 0; elapsed < TOTAL_INTRO_MS - SAMPLE_STEP_MS; elapsed += SAMPLE_STEP_MS) {
      await act(async () => {
        jest.advanceTimersByTime(SAMPLE_STEP_MS);
      });
    }
    const targetsOf = (value: unknown) =>
      timingSpy.mock.calls.filter(([candidate]) => candidate === value).map(([, config]) => (config as { toValue: number }).toValue);
    expect(targetsOf(tilesValue)).toEqual([0, 1, 0]);
    expect(targetsOf(overlayValue)).toEqual([1, 0]);
  });

  it('should tilt the yellow mark tile +12 degrees and the green H tile -6 degrees when the intro starts', async () => {
    await render(<LaunchIntro onDone={jest.fn()} />);
    const rotationOf = (testID: string) => flattenStyle(screen.getByTestId(testID, { includeHiddenElements: true }).props.style).transform;
    expect(rotationOf('launch-intro-mark-present')).toEqual([{ rotate: '12deg' }]);
    expect(rotationOf('launch-intro-mark-correct')).toEqual([{ rotate: '-6deg' }]);
  });

  it('should not log a console error (e.g. the unsupported native-animated "letterSpacing" warning) while the full sequence plays', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    await render(<LaunchIntro onDone={jest.fn()} />);

    await act(async () => {
      jest.advanceTimersByTime(10_000);
    });

    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('should stop its phase timers on unmount, never calling onDone again or logging a console error', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const onDone = jest.fn();
    const view = await render(<LaunchIntro onDone={onDone} />);

    await act(async () => {
      jest.advanceTimersByTime(250);
    });
    await act(async () => {
      view.unmount();
    });
    const callsAtUnmount = onDone.mock.calls.length;

    await act(async () => {
      jest.advanceTimersByTime(10_000);
    });

    expect(onDone).toHaveBeenCalledTimes(callsAtUnmount);
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
