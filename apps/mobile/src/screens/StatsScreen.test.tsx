import { act, fireEvent, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { StatsScreen } from './StatsScreen';
import { renderWithTheme } from '../test-utils/render-with-theme';
import { createInitialDailyStats, createInitialUnlimitedStats } from '../stats/stats';

describe('StatsScreen', () => {
  it('should show win percentage, streak and distribution for daily stats', async () => {
    const stats = {
      ...createInitialDailyStats(),
      gamesPlayed: 8,
      gamesWon: 4,
      currentStreak: 2,
      maxStreak: 5,
      guessDistribution: [0, 1, 1, 0, 0, 0],
    };
    await renderWithTheme(<StatsScreen stats={stats} isUnlimited={false} onClose={() => undefined} />);
    expect(screen.getByText('İstatistikler')).toBeTruthy();
    expect(screen.getByTestId('stat-Oyun').props.children).toBe(8);
    expect(screen.getByTestId('stat-Kazanma %').props.children).toBe(50);
    expect(screen.getByTestId('stat-Seri').props.children).toBe(2);
    expect(screen.getByTestId('stat-En İyi Seri').props.children).toBe(5);
  });

  it('should show the games won total instead of a streak for unlimited stats', async () => {
    const stats = { ...createInitialUnlimitedStats(), gamesPlayed: 2, gamesWon: 2 };
    await renderWithTheme(<StatsScreen stats={stats} isUnlimited={true} onClose={() => undefined} />);
    expect(screen.getByText('Sınırsız Mod İstatistikleri')).toBeTruthy();
    expect(screen.getByText('Kazanılan')).toBeTruthy();
  });

  it('should render the distribution title in Turkish uppercase without a style transform when stats exist', async () => {
    const stats = { ...createInitialDailyStats(), gamesPlayed: 1, gamesWon: 1, guessDistribution: [1, 0, 0, 0, 0, 0] };
    await renderWithTheme(<StatsScreen stats={stats} isUnlimited={false} onClose={() => undefined} />);
    const title = screen.getByText('TAHMİN DAĞILIMI');
    expect(StyleSheet.flatten(title.props.style).textTransform).toBeUndefined();
  });

  it('should show the empty state message when no game has been played', async () => {
    await renderWithTheme(
      <StatsScreen stats={createInitialDailyStats()} isUnlimited={false} onClose={() => undefined} />,
    );
    expect(screen.getByText('İlk oyununuzu tamamladığınızda istatistikler burada görünecek.')).toBeTruthy();
  });

  it('should call onClose when the close button is pressed', async () => {
    const onClose = jest.fn();
    await renderWithTheme(
      <StatsScreen stats={createInitialDailyStats()} isUnlimited={false} onClose={onClose} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Kapat'));
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
