import { act, cleanup, fireEvent, render, screen } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import { LaunchIntro } from './LaunchIntro';
import { flattenStyle } from '../test-utils/render-with-theme';

describe('LaunchIntro', () => {
  beforeEach(() => {
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
