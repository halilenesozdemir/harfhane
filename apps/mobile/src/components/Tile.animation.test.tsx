import { act, screen } from '@testing-library/react-native';
import { themes } from '@harfhane/ui-tokens';
import { Tile } from './Tile';
import { flattenStyle, renderWithTheme } from '../test-utils/render-with-theme';
import { useReduceMotion } from '../ui/motion/useReduceMotion';

jest.mock('../ui/motion/useReduceMotion');

const mockUseReduceMotion = useReduceMotion as jest.Mock;

describe('Tile animations', () => {
  beforeEach(() => {
    mockUseReduceMotion.mockReturnValue(false);
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.resetAllMocks();
  });

  it('should keep the pre-flip appearance until the midpoint, then switch to the evaluated colour', async () => {
    await renderWithTheme(<Tile letter="K" status="correct" isFilled isRevealing revealDelayMs={0} />);
    const tile = screen.getByLabelText('K, doğru yerde');
    expect(flattenStyle(tile.props.style).backgroundColor).not.toBe(themes.light.correct);
    await act(async () => {
      jest.advanceTimersByTime(250);
    });
    expect(flattenStyle(tile.props.style).backgroundColor).toBe(themes.light.correct);
  });

  it('should respect a later column stagger delay before switching colour', async () => {
    await renderWithTheme(<Tile letter="K" status="correct" isFilled isRevealing revealDelayMs={100} />);
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

  it('(011-AE2) should show the evaluated colours immediately with no flip running when reduce motion is enabled', async () => {
    mockUseReduceMotion.mockReturnValue(true);
    await renderWithTheme(<Tile letter="K" status="correct" isFilled isRevealing revealDelayMs={100} />);
    const tile = screen.getByLabelText('K, doğru yerde');
    expect(flattenStyle(tile.props.style).backgroundColor).toBe(themes.light.correct);
  });

  it('should scale the tile box and letter size from the size prop', async () => {
    await renderWithTheme(<Tile letter="K" status={null} isFilled size={48} />);
    const tile = screen.getByLabelText('K');
    const style = flattenStyle(tile.props.style);
    expect(style.width).toBe(48);
    expect(style.height).toBe(48);
    expect(flattenStyle(screen.getByText('K').props.style).fontSize).toBe(24);
  });

  it('should not switch colour early when revealing is false', async () => {
    await renderWithTheme(<Tile letter="K" status="correct" isFilled isRevealing={false} />);
    const tile = screen.getByLabelText('K, doğru yerde');
    expect(flattenStyle(tile.props.style).backgroundColor).toBe(themes.light.correct);
  });
});
