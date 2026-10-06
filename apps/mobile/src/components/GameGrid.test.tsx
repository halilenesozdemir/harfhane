import { screen, within } from '@testing-library/react-native';
import { GameGrid } from './GameGrid';
import { renderWithTheme } from '../test-utils/render-with-theme';

const MAX_GUESSES = 6;
const WORD_LENGTH = 5;

describe('GameGrid', () => {
  it('should render 6 by wordLength tiles', async () => {
    await renderWithTheme(
      <GameGrid guesses={[]} evaluations={[]} currentGuess="" wordLength={WORD_LENGTH} />,
    );
    const tiles = screen.getAllByTestId(/^tile-/);
    expect(tiles).toHaveLength(MAX_GUESSES * WORD_LENGTH);
  });

  it('should place a past guess with its evaluation', async () => {
    await renderWithTheme(
      <GameGrid
        guesses={['HARFİ']}
        evaluations={[['correct', 'correct', 'correct', 'correct', 'absent']]}
        currentGuess=""
        wordLength={WORD_LENGTH}
      />,
    );
    expect(within(screen.getByTestId('tile-0-0')).getByText('H')).toBeTruthy();
    expect(screen.getByTestId('tile-0-0').props.accessibilityLabel).toBe('H, doğru yerde');
    expect(screen.getByTestId('tile-0-4').props.accessibilityLabel).toBe('İ, kelimede yok');
  });

  it('should place the current guess on the row after past guesses', async () => {
    await renderWithTheme(
      <GameGrid guesses={['HARFİ']} evaluations={[['correct', 'correct', 'correct', 'correct', 'absent']]} currentGuess="AB" wordLength={WORD_LENGTH} />,
    );
    expect(within(screen.getByTestId('tile-1-0')).getByText('A')).toBeTruthy();
    expect(within(screen.getByTestId('tile-1-1')).getByText('B')).toBeTruthy();
    expect(screen.getByTestId('tile-1-2').props.accessibilityLabel).toBe('boş');
  });

  it('should mark the hinted position on the active row as a hint tile', async () => {
    await renderWithTheme(
      <GameGrid guesses={[]} evaluations={[]} currentGuess="" wordLength={WORD_LENGTH} hints={[{ position: 2, letter: 'L' }]} />,
    );
    expect(screen.getByTestId('tile-0-2').props.accessibilityLabel).toBe('L, ipucu');
    expect(screen.getByTestId('tile-0-0').props.accessibilityLabel).toBe('boş');
  });

  it('should not overlay a hint on a position the player already typed', async () => {
    await renderWithTheme(
      <GameGrid guesses={[]} evaluations={[]} currentGuess="KA" wordLength={WORD_LENGTH} hints={[{ position: 0, letter: 'K' }]} />,
    );
    expect(screen.getByTestId('tile-0-0').props.accessibilityLabel).toBe('K');
  });

  it('should leave rows after the current guess empty', async () => {
    await renderWithTheme(
      <GameGrid guesses={['HARFİ']} evaluations={[['correct', 'correct', 'correct', 'correct', 'absent']]} currentGuess="AB" wordLength={WORD_LENGTH} />,
    );
    expect(screen.getByTestId('tile-2-0').props.accessibilityLabel).toBe('boş');
    expect(screen.getByTestId('tile-5-4').props.accessibilityLabel).toBe('boş');
  });
});
