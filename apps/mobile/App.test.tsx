import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { BackHandler } from 'react-native';
import App from './App';

jest.mock('./src/lib/api', () => ({
  api: {
    fetchDailyWord: jest.fn().mockResolvedValue({ word: { word: 'KALEM' }, gameNumber: 1, date: '2026-10-05' }),
    fetchRandomWord: jest.fn().mockResolvedValue({ word: { word: 'KİTAP' }, wordId: 9 }),
    validateWord: jest.fn().mockResolvedValue({ isValid: true }),
  },
}));

jest.mock('./src/game/device-store', () => {
  const entries = new Map<string, string>();
  return {
    deviceStore: {
      getItem: jest.fn(async (key: string) => entries.get(key) ?? null),
      setItem: jest.fn(async (key: string, value: string) => {
        entries.set(key, value);
      }),
    },
  };
});

async function openAndClose(openLabel: string, title: string) {
  await act(async () => {
    fireEvent.press(screen.getByLabelText(openLabel));
  });
  expect(await screen.findByText(title)).toBeTruthy();
  await act(async () => {
    fireEvent.press(screen.getByLabelText('Kapat'));
  });
  expect(await screen.findByText('HARFHANE')).toBeTruthy();
}

function latestBackHandler(addSpy: jest.SpyInstance): () => boolean {
  const lastCall = addSpy.mock.calls[addSpy.mock.calls.length - 1] as [string, () => boolean];
  return lastCall[1];
}

describe('App', () => {
  it('should reach the game screen from home when daily is started and go back', async () => {
    await render(<App />);
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Günlük oyunu 5 harfle başlat'));
    });
    expect(await screen.findByText('Günlük · 5 harf')).toBeTruthy();
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Geri'));
    });
    expect(await screen.findByText('HARFHANE')).toBeTruthy();
  });

  it('should open and close HowToPlay, Settings and Stats from home', async () => {
    await render(<App />);
    await openAndClose('Nasıl oynanır', 'Nasıl Oynanır?');
    await openAndClose('Ayarlar', 'Ayarlar');
    await openAndClose('İstatistikler', 'İstatistikler');
  });

  it('should keep the selected word length after returning from a game', async () => {
    await render(<App />);
    await act(async () => {
      fireEvent.press(screen.getByLabelText('6 harfli kelime seç'));
    });
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Günlük oyunu 6 harfle başlat'));
    });
    expect(await screen.findByText('Günlük · 6 harf')).toBeTruthy();
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Geri'));
    });
    expect(await screen.findByText('Günün 6 harfli kelimesi. Herkes aynı kelimeyi çözer.')).toBeTruthy();
  });

  it('should pop the stack on hardware back from game or stats, and leave home unhandled', async () => {
    const addSpy = jest.spyOn(BackHandler, 'addEventListener');
    await render(<App />);

    expect(latestBackHandler(addSpy)()).toBe(false);

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Günlük oyunu 5 harfle başlat'));
    });
    await screen.findByText('Günlük · 5 harf');
    let handledGame = false;
    await act(async () => {
      handledGame = latestBackHandler(addSpy)();
    });
    expect(handledGame).toBe(true);
    expect(await screen.findByText('HARFHANE')).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByLabelText('İstatistikler'));
    });
    await screen.findByLabelText('Kapat');
    let handledStats = false;
    await act(async () => {
      handledStats = latestBackHandler(addSpy)();
    });
    expect(handledStats).toBe(true);
    expect(await screen.findByText('HARFHANE')).toBeTruthy();

    addSpy.mockRestore();
  });
});
