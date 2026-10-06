import { act, fireEvent, screen, within } from '@testing-library/react-native';
import { Share } from 'react-native';
import { GameOverCard } from './GameOverCard';
import { createMemoryStore, flattenStyle, renderWithTheme } from '../test-utils/render-with-theme';
import { getThemeColors } from '../theme';
import { saveDailyStats, createInitialDailyStats } from '../stats/stats';

jest.mock('react-native/Libraries/Share/Share', () => ({
  __esModule: true,
  default: { share: jest.fn().mockResolvedValue({ action: 'sharedAction' }) },
}));

const DAILY_DATE = '2026-01-03';
const WON_GUESSES = ['KALEM', 'KALEM', 'KALEM'] as const;
const WON_EVALUATIONS = [
  ['correct', 'correct', 'correct', 'correct', 'correct'],
  ['correct', 'correct', 'correct', 'correct', 'correct'],
  ['correct', 'correct', 'correct', 'correct', 'correct'],
] as const;

describe('GameOverCard', () => {
  // 011-AE1
  it('should show the answer, the third distribution bar, a share button and a daily countdown when a daily game is won in three guesses (011-AE1)', async () => {
    await renderWithTheme(
      <GameOverCard
        mode="daily"
        wordLength={5}
        gameStatus="won"
        solution="KALEM"
        guesses={[...WON_GUESSES]}
        evaluations={WON_EVALUATIONS.map((row) => [...row])}
        wordId={null}
        dailyDate={DAILY_DATE}
        store={createMemoryStore()}
        today={() => DAILY_DATE}
        onNewGame={jest.fn()}
      />,
    );
    expect(await screen.findByTestId('gameover-card')).toBeTruthy();
    expect(await screen.findByTestId('gameover-countdown')).toBeTruthy();
    const shareButton = screen.getByTestId('gameover-share');
    expect(shareButton).toBeTruthy();
    expect(screen.queryByTestId('gameover-new-word')).toBeNull();

    const thirdRow = await screen.findByTestId('gameover-distribution-3');
    expect(within(thirdRow).getByText('1')).toBeTruthy();
    const colors = getThemeColors({ scheme: 'light', isHighContrast: false });
    const thirdFill = screen.getByTestId('gameover-distribution-3-fill');
    expect(flattenStyle(thirdFill.props.style)['backgroundColor']).toBe(colors.correct);
    const firstFill = screen.getByTestId('gameover-distribution-1-fill');
    expect(flattenStyle(firstFill.props.style)['backgroundColor']).toBe(colors.brand);

    await act(async () => fireEvent.press(shareButton));
    expect(Share.share).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('Harfhane #3') }),
    );
  });

  it('should show the solution when a daily game is lost', async () => {
    await renderWithTheme(
      <GameOverCard
        mode="daily"
        wordLength={5}
        gameStatus="lost"
        solution="KALEM"
        guesses={[]}
        evaluations={[]}
        wordId={null}
        dailyDate={DAILY_DATE}
        store={createMemoryStore()}
        today={() => DAILY_DATE}
        onNewGame={jest.fn()}
      />,
    );
    expect(await screen.findByText('Kelime: KALEM')).toBeTruthy();
  });

  it('should offer a new word and no countdown in unlimited mode', async () => {
    const onNewGame = jest.fn();
    await renderWithTheme(
      <GameOverCard
        mode="unlimited"
        wordLength={5}
        gameStatus="won"
        solution="KALEM"
        guesses={['KALEM']}
        evaluations={[['correct', 'correct', 'correct', 'correct', 'correct']]}
        wordId={42}
        dailyDate={null}
        store={createMemoryStore()}
        onNewGame={onNewGame}
      />,
    );
    expect(screen.queryByTestId('gameover-countdown')).toBeNull();
    const newWordButton = await screen.findByTestId('gameover-new-word');
    fireEvent.press(newWordButton);
    expect(onNewGame).toHaveBeenCalledTimes(1);
  });

  it('should highlight the bar matching the guess count that just won, including the prior stats', async () => {
    const store = createMemoryStore();
    const priorStats = { ...createInitialDailyStats(), guessDistribution: [0, 2, 0, 0, 0, 0] };
    await saveDailyStats(store, 5, priorStats);
    await renderWithTheme(
      <GameOverCard
        mode="daily"
        wordLength={5}
        gameStatus="won"
        solution="KALEM"
        guesses={['KALEM', 'KALEM']}
        evaluations={[
          ['correct', 'correct', 'correct', 'correct', 'correct'],
          ['correct', 'correct', 'correct', 'correct', 'correct'],
        ]}
        wordId={null}
        dailyDate={DAILY_DATE}
        store={store}
        today={() => DAILY_DATE}
        onNewGame={jest.fn()}
      />,
    );
    const secondRow = await screen.findByTestId('gameover-distribution-2');
    expect(within(secondRow).getByText('3')).toBeTruthy();
  });
});
