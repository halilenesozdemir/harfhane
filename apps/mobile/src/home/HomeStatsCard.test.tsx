import { act, fireEvent, screen } from '@testing-library/react-native';
import { HomeStatsCard } from './HomeStatsCard';
import { createInitialDailyStats } from '../stats/stats';
import { renderWithTheme } from '../test-utils/render-with-theme';
import type { DailyStats } from '../stats/stats';

const PLAYED_STATS: DailyStats = {
  ...createInitialDailyStats(),
  gamesPlayed: 7,
  gamesWon: 6,
  currentStreak: 4,
  maxStreak: 9,
};

describe('HomeStatsCard', () => {
  it('should invite the player to finish a first game when no daily game has been played', async () => {
    await renderWithTheme(<HomeStatsCard displayedStreak={0} stats={createInitialDailyStats()} onPress={jest.fn()} />);
    expect(screen.getByText('İlk oyununu bitir, serin burada başlasın')).toBeOnTheScreen();
    expect(screen.queryByText('Seri')).toBeNull();
  });

  it('should show the displayed streak, best streak, win rate and games played when games were played', async () => {
    await renderWithTheme(<HomeStatsCard displayedStreak={4} stats={PLAYED_STATS} onPress={jest.fn()} />);
    for (const text of ['4', 'Seri', '9', 'En iyi seri', '%86', 'Kazanma', '7', 'Oyun']) {
      expect(screen.getByText(text)).toBeOnTheScreen();
    }
  });

  it('should use the displayed streak rather than the stored one when they differ', async () => {
    await renderWithTheme(<HomeStatsCard displayedStreak={0} stats={PLAYED_STATS} onPress={jest.fn()} />);
    expect(screen.getByLabelText('İstatistikler: seri 0, en iyi seri 9, kazanma yüzde 86, 7 oyun')).toBeOnTheScreen();
  });

  it('should call onPress when the card is pressed', async () => {
    const onPress = jest.fn();
    await renderWithTheme(<HomeStatsCard displayedStreak={4} stats={PLAYED_STATS} onPress={onPress} />);
    await act(async () => fireEvent.press(screen.getByTestId('home-stats-card')));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
