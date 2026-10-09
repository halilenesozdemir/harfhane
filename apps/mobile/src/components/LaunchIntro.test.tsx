import { act, cleanup, fireEvent, render, screen } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import { LaunchIntro } from './LaunchIntro';

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
});
