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

// By testID, not label: a repeated letter (e.g. KAPAK) fills a tile whose own accessibility
// label is that same bare letter once typed, which would collide with the keyboard key's label.
async function pressKeys(values: readonly string[]) {
  for (const value of values) {
    await act(async () => {
      fireEvent.press(screen.getByTestId(`key-${value}`));
    });
  }
}

describe('GameScreen', () => {
  it('should show the win message when the daily word is guessed with the keyboard', async () => {
    const onBack = jest.fn();
    await renderWithTheme(<GameScreen mode="daily" wordLength={5} onBack={onBack} api={createApi()} store={createMemoryStore()} today={today} />);
    await screen.findByLabelText('Gönder');
    await pressKeys(['K', 'A', 'L', 'E', 'M', 'ENTER']);
    expect(await screen.findByText('Muhteşem!')).toBeTruthy();
  });

  it('should offer a new word when an unlimited game is over', async () => {
    await renderWithTheme(<GameScreen mode="unlimited" wordLength={5} onBack={jest.fn()} api={createApi()} store={createMemoryStore()} today={today} />);
    await screen.findByLabelText('Gönder');
    await pressKeys(['K', 'İ', 'T', 'A', 'P', 'ENTER']);
    expect(await screen.findByText('Yeni kelime')).toBeTruthy();
  });

  it('should record the daily result in stats when the game finishes', async () => {
    const store = createMemoryStore();
    await renderWithTheme(<GameScreen mode="daily" wordLength={5} onBack={jest.fn()} api={createApi()} store={store} today={today} />);
    await screen.findByLabelText('Gönder');
    await pressKeys(['K', 'A', 'L', 'E', 'M', 'ENTER']);
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

  it('should replace the hint button with the revealed letter once pressed', async () => {
    await renderWithTheme(<GameScreen mode="daily" wordLength={5} onBack={jest.fn()} api={createApi()} store={createMemoryStore()} today={today} />);
    const hintButton = await screen.findByLabelText('İpucu göster');
    await act(async () => fireEvent.press(hintButton));
    expect(await screen.findByTestId('hint-text')).toHaveTextContent('1. harf: K');
    expect(screen.queryByTestId('hint-button')).toBeNull();
    expect(screen.queryByLabelText('İpucu kullanıldı')).toBeNull();
  });

  it('should reveal L at tile-1-2 when K and A are green and do nothing on a second press (008-AE7)', async () => {
    await renderWithTheme(<GameScreen mode="daily" wordLength={5} onBack={jest.fn()} api={createApi()} store={createMemoryStore()} today={today} />);
    await screen.findByLabelText('Gönder');
    await pressKeys(['K', 'A', 'P', 'A', 'K', 'ENTER']);

    const hintButton = await screen.findByLabelText('İpucu göster');
    await act(async () => fireEvent.press(hintButton));

    expect(screen.getByTestId('tile-1-2').props.accessibilityLabel).toBe('L, ipucu');
    expect(await screen.findByTestId('hint-text')).toHaveTextContent('3. harf: L');
    // The button is gone, so there is no way to press it a second time.
    expect(screen.queryByTestId('hint-button')).toBeNull();
  });

  it('should ignore an unsubmitted current guess when choosing the hint position', async () => {
    await renderWithTheme(<GameScreen mode="daily" wordLength={5} onBack={jest.fn()} api={createApi()} store={createMemoryStore()} today={today} />);
    const hintButton = await screen.findByLabelText('İpucu göster');
    await act(async () => fireEvent.press(screen.getByLabelText('K')));
    await act(async () => fireEvent.press(hintButton));
    expect(await screen.findByTestId('hint-text')).toHaveTextContent('1. harf: K');
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
    await first.findByTestId('hint-text');
    await act(async () => first.unmount());

    const reopened = await renderWithTheme(<GameScreen mode="daily" wordLength={5} onBack={jest.fn()} api={createApi()} store={store} today={today} />);
    expect(await reopened.findByTestId('hint-text')).toHaveTextContent('1. harf: K');
    expect(reopened.queryByLabelText('İpucu göster')).toBeNull();
  });

  it('should hide the hint control and stop marking the trailing row once the daily game is won', async () => {
    await renderWithTheme(<GameScreen mode="daily" wordLength={5} onBack={jest.fn()} api={createApi()} store={createMemoryStore()} today={today} />);
    const hintButton = await screen.findByLabelText('İpucu göster');
    await act(async () => fireEvent.press(hintButton));
    await screen.findByTestId('hint-text');

    await pressKeys(['K', 'A', 'L', 'E', 'M', 'ENTER']);
    await screen.findByText('Muhteşem!');

    expect(screen.queryByTestId('hint-button')).toBeNull();
    expect(screen.queryByTestId('hint-text')).toBeNull();
    // Without the isPlaying guard this trailing row would still show "K, ipucu" from the
    // (now stale) revealed position — the hint was at position 0.
    expect(screen.getByTestId('tile-1-0').props.accessibilityLabel).toBe('boş');
  });

  it('should hide the hint control and stop marking the trailing row once the daily game is lost', async () => {
    await renderWithTheme(<GameScreen mode="daily" wordLength={5} onBack={jest.fn()} api={createApi()} store={createMemoryStore()} today={today} />);
    const hintButton = await screen.findByLabelText('İpucu göster');
    await act(async () => fireEvent.press(hintButton));
    await screen.findByTestId('hint-text');

    for (let attempt = 0; attempt < 6; attempt += 1) {
      await pressKeys(['K', 'A', 'P', 'A', 'K', 'ENTER']);
    }
    expect(await screen.findByText('Kelime: KALEM')).toBeTruthy();

    expect(screen.queryByTestId('hint-button')).toBeNull();
    expect(screen.queryByTestId('hint-text')).toBeNull();
  });
});
