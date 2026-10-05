import { act, fireEvent, screen } from '@testing-library/react-native';
import { HomeScreen } from './HomeScreen';
import { renderWithTheme } from '../test-utils/render-with-theme';

function noop() {
  return undefined;
}

describe('HomeScreen', () => {
  it('should render the Turkish title and mode cards', async () => {
    await renderWithTheme(<HomeScreen onStart={noop} onOpenHowToPlay={noop} onOpenSettings={noop} onOpenStats={noop} />);
    expect(screen.getByText('HARFHANE')).toBeTruthy();
    expect(screen.getByText('Günlük Oyun')).toBeTruthy();
    expect(screen.getByText('Sınırsız Mod')).toBeTruthy();
  });

  it('should call onStart with daily mode and the default length of 5', async () => {
    const onStart = jest.fn();
    await renderWithTheme(<HomeScreen onStart={onStart} onOpenHowToPlay={noop} onOpenSettings={noop} onOpenStats={noop} />);
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Günlük oyunu 5 harfle başlat'));
    });
    expect(onStart).toHaveBeenCalledWith('daily', 5);
  });

  it('should call onStart with daily mode and the selected length when it changes', async () => {
    const onStart = jest.fn();
    await renderWithTheme(<HomeScreen onStart={onStart} onOpenHowToPlay={noop} onOpenSettings={noop} onOpenStats={noop} />);
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
    await renderWithTheme(<HomeScreen onStart={onStart} onOpenHowToPlay={noop} onOpenSettings={noop} onOpenStats={noop} />);
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
    await renderWithTheme(<HomeScreen onStart={onStart} onOpenHowToPlay={noop} onOpenSettings={noop} onOpenStats={noop} />);
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Sınırsız modu 5 harfle başlat'));
    });
    expect(onStart).toHaveBeenCalledWith('unlimited', 5);
  });

  it('should show the selected length in the daily card text', async () => {
    await renderWithTheme(<HomeScreen onStart={noop} onOpenHowToPlay={noop} onOpenSettings={noop} onOpenStats={noop} />);
    await act(async () => {
      fireEvent.press(screen.getByLabelText('6 harfli kelime seç'));
    });
    expect(screen.getByText('Günün 6 harfli kelimesi. Herkes aynı kelimeyi çözer.')).toBeTruthy();
  });

  it('should call onOpenHowToPlay when the how-to-play link is pressed', async () => {
    const onOpenHowToPlay = jest.fn();
    await renderWithTheme(<HomeScreen onStart={noop} onOpenHowToPlay={onOpenHowToPlay} onOpenSettings={noop} onOpenStats={noop} />);
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Nasıl oynanır'));
    });
    expect(onOpenHowToPlay).toHaveBeenCalledTimes(1);
  });

  it('should call onOpenSettings when the settings link is pressed', async () => {
    const onOpenSettings = jest.fn();
    await renderWithTheme(<HomeScreen onStart={noop} onOpenHowToPlay={noop} onOpenSettings={onOpenSettings} onOpenStats={noop} />);
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Ayarlar'));
    });
    expect(onOpenSettings).toHaveBeenCalledTimes(1);
  });

  it('should call onOpenStats with the selected length when the stats link is pressed', async () => {
    const onOpenStats = jest.fn();
    await renderWithTheme(<HomeScreen onStart={noop} onOpenHowToPlay={noop} onOpenSettings={noop} onOpenStats={onOpenStats} />);
    await act(async () => {
      fireEvent.press(screen.getByLabelText('6 harfli kelime seç'));
    });
    await act(async () => {
      fireEvent.press(screen.getByLabelText('İstatistikler'));
    });
    expect(onOpenStats).toHaveBeenCalledWith(6);
  });
});
