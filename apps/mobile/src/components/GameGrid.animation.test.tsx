import { Animated } from 'react-native';
import { act, fireEvent, screen } from '@testing-library/react-native';
import { base, themes } from '@harfhane/ui-tokens';
import { GameGrid } from './GameGrid';
import { flattenStyle, renderWithTheme } from '../test-utils/render-with-theme';
import { parseMs } from '../utils/ms';

const WORD_LENGTH = 5;
const WON_EVALUATION: readonly ('correct')[] = ['correct', 'correct', 'correct', 'correct', 'correct'];
const STAGGER_MS = parseMs(base.motionStagger);
const FLIP_MS = parseMs(base.motionFlip);
const BOUNCE_MS = parseMs(base.motionBounce);

describe('GameGrid animations', () => {
  it('should size tiles from the board area measured by onLayout', async () => {
    await renderWithTheme(<GameGrid guesses={[]} evaluations={[]} currentGuess="" wordLength={WORD_LENGTH} />);
    await act(async () => {
      fireEvent(screen.getByTestId('game-grid'), 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 320, height: 320 } } });
    });
    // width budget: (320 - 4*6)/5 = 59.2, height budget: (320 - 5*6)/6 ≈ 48.3 → the tighter one wins.
    expect(flattenStyle(screen.getByTestId('tile-0-0').props.style).width).toBeCloseTo(48.33, 1);
  });

  it('should only mark the last committed row as revealing, leaving earlier rows showing their final colour immediately', async () => {
    await renderWithTheme(
      <GameGrid
        guesses={['KAPAK', 'KAPAK']}
        evaluations={[WON_EVALUATION, WON_EVALUATION]}
        currentGuess=""
        wordLength={WORD_LENGTH}
        isRevealing
      />,
    );
    const earlierRowTile = flattenStyle(screen.getByTestId('tile-0-0').props.style);
    const revealingRowTile = flattenStyle(screen.getByTestId('tile-1-0').props.style);
    expect(earlierRowTile.backgroundColor).toBe(themes.light.correct);
    expect(revealingRowTile.backgroundColor).not.toBe(themes.light.correct);
  });

  it('should not mark any row as revealing when isRevealing is false', async () => {
    await renderWithTheme(
      <GameGrid guesses={['KAPAK']} evaluations={[WON_EVALUATION]} currentGuess="" wordLength={WORD_LENGTH} isRevealing={false} />,
    );
    expect(flattenStyle(screen.getByTestId('tile-0-0').props.style).backgroundColor).toBe(themes.light.correct);
  });

  it('should stagger each column\'s flip by its own delay, not a fixed 0', async () => {
    jest.useFakeTimers();
    try {
      await renderWithTheme(
        <GameGrid guesses={['KAPAK']} evaluations={[WON_EVALUATION]} currentGuess="" wordLength={WORD_LENGTH} isRevealing />,
      );
      // Column 0's midpoint (0 * stagger + flip/2) has passed; column 4's (4 * stagger + flip/2) has not.
      await act(async () => {
        jest.advanceTimersByTime(FLIP_MS / 2 + 1);
      });
      expect(flattenStyle(screen.getByTestId('tile-0-0').props.style).backgroundColor).toBe(themes.light.correct);
      expect(flattenStyle(screen.getByTestId('tile-0-4').props.style).backgroundColor).not.toBe(themes.light.correct);

      await act(async () => {
        jest.advanceTimersByTime(4 * STAGGER_MS);
      });
      expect(flattenStyle(screen.getByTestId('tile-0-4').props.style).backgroundColor).toBe(themes.light.correct);
    } finally {
      jest.useRealTimers();
    }
  });

  it('should pass each column its own stagger delay to the flip animation', async () => {
    const timingSpy = jest.spyOn(Animated, 'timing');
    await renderWithTheme(
      <GameGrid guesses={['KAPAK']} evaluations={[WON_EVALUATION]} currentGuess="" wordLength={WORD_LENGTH} isRevealing />,
    );
    const flipDelays = timingSpy.mock.calls
      .filter((call) => (call[1] as { duration?: number })?.duration === FLIP_MS)
      .map((call) => (call[1] as { delay?: number }).delay)
      .sort((a, b) => (a ?? 0) - (b ?? 0));
    expect(flipDelays).toEqual([0, STAGGER_MS, 2 * STAGGER_MS, 3 * STAGGER_MS, 4 * STAGGER_MS]);
  });

  it('should bounce only the winning row, not every row on the board', async () => {
    const timingSpy = jest.spyOn(Animated, 'timing');
    await renderWithTheme(
      <GameGrid
        guesses={['KAPAK', 'KAPAK']}
        evaluations={[WON_EVALUATION, WON_EVALUATION]}
        currentGuess=""
        wordLength={WORD_LENGTH}
        celebrateRow
      />,
    );
    const bounceCalls = timingSpy.mock.calls.filter((call) => (call[1] as { duration?: number })?.duration === BOUNCE_MS / 2);
    // One winning row of 5 tiles, each with an up and a down timing call — 10, not 20.
    expect(bounceCalls).toHaveLength(2 * WORD_LENGTH);
  });
});
