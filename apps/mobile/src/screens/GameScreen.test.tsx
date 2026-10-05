import { act, fireEvent, screen } from '@testing-library/react-native';
import type { ApiClient } from '../lib/api';
import { createMemoryStore, renderWithTheme } from '../test-utils/render-with-theme';
import { GameScreen } from './GameScreen';

const today = () => '2026-10-05';

function createApi(): ApiClient {
  return {
    fetchDailyWord: jest.fn().mockResolvedValue({ word: { word: 'KALEM' }, gameNumber: 1, date: '2026-10-05' }),
    fetchRandomWord: jest.fn().mockResolvedValue({ word: { word: 'KİTAP' }, wordId: 9 }),
    validateWord: jest.fn().mockResolvedValue({ isValid: true }),
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

  it('should go back when the back button is pressed', async () => {
    const onBack = jest.fn();
    await renderWithTheme(<GameScreen mode="daily" wordLength={5} onBack={onBack} api={createApi()} store={createMemoryStore()} today={today} />);
    fireEvent.press(screen.getByLabelText('Geri'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
