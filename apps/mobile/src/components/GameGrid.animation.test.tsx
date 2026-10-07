import { act, fireEvent, screen } from '@testing-library/react-native';
import { themes } from '@harfhane/ui-tokens';
import { GameGrid } from './GameGrid';
import { flattenStyle, renderWithTheme } from '../test-utils/render-with-theme';

const WORD_LENGTH = 5;
const WON_EVALUATION: readonly ('correct')[] = ['correct', 'correct', 'correct', 'correct', 'correct'];

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
});
