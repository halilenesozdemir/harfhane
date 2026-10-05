import { act, fireEvent, render, screen } from '@testing-library/react-native';
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
});
