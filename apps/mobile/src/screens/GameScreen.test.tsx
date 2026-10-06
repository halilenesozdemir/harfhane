import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import type { ApiClient } from '../lib/api';
import { createMemoryStore, renderWithTheme } from '../test-utils/render-with-theme';
import { GameScreen } from './GameScreen';
import { loadDailyStats } from '../stats/stats';
import { saveRevealedHints } from '../game/game-storage';

const today = () => '2026-10-05';

function createApi(): ApiClient {
  return {
    fetchDailyWord: jest.fn().mockResolvedValue({ word: { word: 'KALEM' }, gameNumber: 1, date: '2026-10-05' }),
    fetchRandomWord: jest.fn().mockResolvedValue({ word: { word: 'KİTAP' }, wordId: 9 }),
    validateWord: jest.fn().mockResolvedValue({ isValid: true }),
    fetchPlayableLengths: jest.fn().mockResolvedValue({ lengths: [4, 5, 6] }),
  };
}

async function pressKeys(labels: readonly string[]) {
  for (const label of labels) {
    await act(async () => {
      fireEvent.press(screen.getByLabelText(label));
    });
  }
}

describe('GameScreen', () => {
  it('should show the win message when the daily word is guessed with the keyboard', async () => {
    const onBack = jest.fn();
    await renderWithTheme(<GameScreen mode="daily" wordLength={5} onBack={onBack} api={createApi()} store={createMemoryStore()} today={today} />);
    await screen.findByLabelText('Gönder');
    await pressKeys(['K', 'A', 'L', 'E', 'M', 'Gönder']);
    expect(await screen.findByText('Muhteşem!')).toBeTruthy();
  });

  it('should offer a new word when an unlimited game is over', async () => {
    await renderWithTheme(<GameScreen mode="unlimited" wordLength={5} onBack={jest.fn()} api={createApi()} store={createMemoryStore()} today={today} />);
    await screen.findByLabelText('Gönder');
    await pressKeys(['K', 'İ', 'T', 'A', 'P', 'Gönder']);
    expect(await screen.findByText('Yeni kelime')).toBeTruthy();
  });

  it('should record the daily result in stats when the game finishes', async () => {
    const store = createMemoryStore();
    await renderWithTheme(<GameScreen mode="daily" wordLength={5} onBack={jest.fn()} api={createApi()} store={store} today={today} />);
    await screen.findByLabelText('Gönder');
    await pressKeys(['K', 'A', 'L', 'E', 'M', 'Gönder']);
    await screen.findByText('Muhteşem!');
    await waitFor(async () => {
      const stats = await loadDailyStats(store, 5);
      expect(stats.gamesPlayed).toBe(1);
      expect(stats.gamesWon).toBe(1);
    });
  });

  it('should go back when the back button is pressed', async () => {
    const onBack = jest.fn();
    await renderWithTheme(<GameScreen mode="daily" wordLength={5} onBack={onBack} api={createApi()} store={createMemoryStore()} today={today} />);
    fireEvent.press(screen.getByLabelText('Geri'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('should reveal a letter and then disable the hint button on a daily game', async () => {
    await renderWithTheme(<GameScreen mode="daily" wordLength={5} onBack={jest.fn()} api={createApi()} store={createMemoryStore()} today={today} />);
    const hintButton = await screen.findByLabelText('İpucu göster');
    await act(async () => fireEvent.press(hintButton));
    expect(await screen.findByLabelText('İpucu kullanıldı')).toBeTruthy();
    expect(screen.getByLabelText('İpucu kullanıldı').props.accessibilityState?.disabled).toBe(true);
    expect(screen.getByTestId('hint-text')).toHaveTextContent('1. harf: K');
    await act(async () => fireEvent.press(screen.getByLabelText('İpucu kullanıldı')));
    expect(screen.getByLabelText('İpucu kullanıldı')).toBeTruthy();
  });

  it('should show no hint control in unlimited mode', async () => {
    await renderWithTheme(<GameScreen mode="unlimited" wordLength={5} onBack={jest.fn()} api={createApi()} store={createMemoryStore()} today={today} />);
    await screen.findByLabelText('Gönder');
    expect(screen.queryByLabelText('İpucu göster')).toBeNull();
    expect(screen.queryByLabelText('İpucu kullanıldı')).toBeNull();
  });

  it('should not mark any tile when a daily hint was saved for the same date and length but the mode is unlimited', async () => {
    const store = createMemoryStore();
    await saveRevealedHints(store, 'harfhane:hint:anon:daily:2026-10-05:5', [0]);
    await renderWithTheme(<GameScreen mode="unlimited" wordLength={5} onBack={jest.fn()} api={createApi()} store={store} today={today} />);
    await screen.findByLabelText('Gönder');
    expect(screen.queryByLabelText('K, ipucu')).toBeNull();
    expect(screen.getByTestId('tile-0-0').props.accessibilityLabel).toBe('boş');
  });

  it('should keep the hint used after reopening the same daily game', async () => {
    const store = createMemoryStore();
    const first = await renderWithTheme(<GameScreen mode="daily" wordLength={5} onBack={jest.fn()} api={createApi()} store={store} today={today} />);
    const hintButton = await first.findByLabelText('İpucu göster');
    await act(async () => fireEvent.press(hintButton));
    await first.findByLabelText('İpucu kullanıldı');
    await act(async () => first.unmount());

    const reopened = await renderWithTheme(<GameScreen mode="daily" wordLength={5} onBack={jest.fn()} api={createApi()} store={store} today={today} />);
    expect(await reopened.findByLabelText('İpucu kullanıldı')).toBeTruthy();
  });
});
