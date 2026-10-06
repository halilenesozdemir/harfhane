import { act, fireEvent, screen } from '@testing-library/react-native';
import { StatsContainer } from './StatsContainer';
import { createMemoryStore, renderWithTheme } from '../test-utils/render-with-theme';
import { createInitialDailyStats, dailyStatsKey } from '../stats/stats';
import type { KeyValueStore } from '../game/game-storage';

function createPendingStore(): KeyValueStore {
  return {
    getItem: () => new Promise(() => undefined),
    setItem: () => new Promise(() => undefined),
  };
}

describe('StatsContainer', () => {
  it('should show a loading indicator before stats resolve', async () => {
    await renderWithTheme(<StatsContainer length={5} store={createPendingStore()} onClose={() => undefined} />);
    expect(screen.getByLabelText('İstatistikler yükleniyor')).toBeTruthy();
  });

  it('should load and show the daily stats by default', async () => {
    const stats = { ...createInitialDailyStats(), gamesPlayed: 3, gamesWon: 2 };
    const store = createMemoryStore({ [dailyStatsKey(5)]: JSON.stringify(stats) });
    await renderWithTheme(<StatsContainer length={5} store={store} onClose={() => undefined} />);
    expect(await screen.findByTestId('stat-Oyun')).toBeTruthy();
    expect(screen.getByTestId('stat-Oyun').props.children).toBe(3);
  });

  it('should switch to unlimited stats when the segment is pressed', async () => {
    await renderWithTheme(<StatsContainer length={5} store={createMemoryStore()} onClose={() => undefined} />);
    await screen.findByText('İstatistikler');
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Sınırsız'));
    });
    expect(screen.getByText('Sınırsız Mod İstatistikleri')).toBeTruthy();
  });

  it('should call onClose when the close button is pressed', async () => {
    const onClose = jest.fn();
    await renderWithTheme(<StatsContainer length={5} store={createMemoryStore()} onClose={onClose} />);
    await screen.findByText('İstatistikler');
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Kapat'));
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
