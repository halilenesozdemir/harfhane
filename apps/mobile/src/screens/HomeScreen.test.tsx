import { act, fireEvent, screen } from '@testing-library/react-native';
import { HomeScreen } from './HomeScreen';
import { renderWithTheme } from '../test-utils/render-with-theme';

describe('HomeScreen', () => {
  it('should render the Turkish title and mode cards', async () => {
    await renderWithTheme(<HomeScreen onStart={() => undefined} />);
    expect(screen.getByText('HARFHANE')).toBeTruthy();
    expect(screen.getByText('Günlük Oyun')).toBeTruthy();
    expect(screen.getByText('Sınırsız Mod')).toBeTruthy();
  });

  it('should call onStart with daily mode and the default length of 5', async () => {
    const onStart = jest.fn();
    await renderWithTheme(<HomeScreen onStart={onStart} />);
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Günlük oyunu 5 harfle başlat'));
    });
    expect(onStart).toHaveBeenCalledWith('daily', 5);
  });

  it('should call onStart with daily mode and the selected length when it changes', async () => {
    const onStart = jest.fn();
    await renderWithTheme(<HomeScreen onStart={onStart} />);
    await act(async () => {
      fireEvent.press(screen.getByLabelText('6 harfli kelime seç'));
    });
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Günlük oyunu 6 harfle başlat'));
    });
    expect(onStart).toHaveBeenCalledWith('daily', 6);
  });

  it('should call onStart with unlimited mode and the selected length', async () => {
    const onStart = jest.fn();
    await renderWithTheme(<HomeScreen onStart={onStart} />);
    await act(async () => {
      fireEvent.press(screen.getByLabelText('6 harfli kelime seç'));
    });
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Sınırsız modu 6 harfle başlat'));
    });
    expect(onStart).toHaveBeenCalledWith('unlimited', 6);
  });

  it('should default the unlimited length to 5', async () => {
    const onStart = jest.fn();
    await renderWithTheme(<HomeScreen onStart={onStart} />);
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Sınırsız modu 5 harfle başlat'));
    });
    expect(onStart).toHaveBeenCalledWith('unlimited', 5);
  });

  it('should show the selected length in the daily card text', async () => {
    await renderWithTheme(<HomeScreen onStart={() => undefined} />);
    await act(async () => {
      fireEvent.press(screen.getByLabelText('6 harfli kelime seç'));
    });
    expect(screen.getByText('Günün 6 harfli kelimesi. Herkes aynı kelimeyi çözer.')).toBeTruthy();
  });
});
