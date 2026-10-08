import { useState } from 'react';
import { act, fireEvent, screen } from '@testing-library/react-native';
import { themes } from '@harfhane/ui-tokens';
import { DEFAULT_WORD_LENGTH, HomeScreen } from './HomeScreen';
import { flattenStyle, renderWithTheme } from '../test-utils/render-with-theme';
import type { HomeScreenProps } from './HomeScreen';
import type { WordLength } from '../stats/stats';

function noop() {
  return undefined;
}

type ControlledHomeScreenProps = Partial<Omit<HomeScreenProps, 'selectedLength' | 'onSelectLength'>>;

function ControlledHomeScreen({ onStart = noop, onOpenHowToPlay = noop, onOpenSettings = noop, onOpenStats = noop }: ControlledHomeScreenProps) {
  const [selectedLength, setSelectedLength] = useState<WordLength>(DEFAULT_WORD_LENGTH);
  return (
    <HomeScreen
      selectedLength={selectedLength}
      onSelectLength={setSelectedLength}
      onStart={onStart}
      onOpenHowToPlay={onOpenHowToPlay}
      onOpenSettings={onOpenSettings}
      onOpenStats={onOpenStats}
    />
  );
}

describe('HomeScreen', () => {
  it('should render the Turkish title and mode cards', async () => {
    await renderWithTheme(<ControlledHomeScreen />);
    expect(screen.getByLabelText('Harfhane')).toBeTruthy();
    expect(screen.getByText('Günlük Oyun')).toBeTruthy();
    expect(screen.getByText('Sınırsız Mod')).toBeTruthy();
  });

  it('(011-R5) should render the title as an H-A-R-F tile row', async () => {
    await renderWithTheme(<ControlledHomeScreen />);
    for (const letter of ['H', 'A', 'R', 'F']) {
      expect(screen.getByText(letter)).toBeTruthy();
    }
  });

  it('(011-R5) should colour each title tile letter with the fg token matching its own background', async () => {
    await renderWithTheme(<ControlledHomeScreen />);
    // H and R sit on a correct (green) tile; A and F sit on a present (yellow) tile.
    // present's background is light, so its fg token must be the dark one, not correctFg's white.
    for (const letter of ['H', 'R']) {
      expect(flattenStyle(screen.getByText(letter).props.style).color).toBe(themes.light.correctFg);
    }
    for (const letter of ['A', 'F']) {
      expect(flattenStyle(screen.getByText(letter).props.style).color).toBe(themes.light.presentFg);
    }
  });

  it('(011-R5) should expose the title row as a single header to assistive tech', async () => {
    await renderWithTheme(<ControlledHomeScreen />);
    const titleRow = screen.getByTestId('home-title-row');
    expect(titleRow.props.accessible).toBe(true);
    expect(titleRow.props.accessibilityRole).toBe('header');
    expect(titleRow.props.accessibilityLabel).toBe('Harfhane');
  });

  it('(011-R5) should cap the title letters from growing past the tile on a large system font', async () => {
    await renderWithTheme(<ControlledHomeScreen />);
    for (const letter of ['H', 'A', 'R', 'F']) {
      expect(screen.getByText(letter).props.maxFontSizeMultiplier).toBeLessThanOrEqual(1.3);
    }
  });

  it('should call onStart with daily mode and the default length of 5', async () => {
    const onStart = jest.fn();
    await renderWithTheme(<ControlledHomeScreen onStart={onStart} />);
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Günlük oyunu 5 harfle başlat'));
    });
    expect(onStart).toHaveBeenCalledWith('daily', 5);
  });

  it('should call onStart with daily mode and the selected length when it changes', async () => {
    const onStart = jest.fn();
    await renderWithTheme(<ControlledHomeScreen onStart={onStart} />);
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
    await renderWithTheme(<ControlledHomeScreen onStart={onStart} />);
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
    await renderWithTheme(<ControlledHomeScreen onStart={onStart} />);
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Sınırsız modu 5 harfle başlat'));
    });
    expect(onStart).toHaveBeenCalledWith('unlimited', 5);
  });

  it('should show the selected length in the daily card text', async () => {
    await renderWithTheme(<ControlledHomeScreen />);
    await act(async () => {
      fireEvent.press(screen.getByLabelText('6 harfli kelime seç'));
    });
    expect(screen.getByText('Günün 6 harfli kelimesi. Herkes aynı kelimeyi çözer.')).toBeTruthy();
  });

  it('should call onOpenHowToPlay when the how-to-play link is pressed', async () => {
    const onOpenHowToPlay = jest.fn();
    await renderWithTheme(<ControlledHomeScreen onOpenHowToPlay={onOpenHowToPlay} />);
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Nasıl oynanır sayfasını aç'));
    });
    expect(onOpenHowToPlay).toHaveBeenCalledTimes(1);
  });

  it('should call onOpenSettings when the settings link is pressed', async () => {
    const onOpenSettings = jest.fn();
    await renderWithTheme(<ControlledHomeScreen onOpenSettings={onOpenSettings} />);
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Ayarları aç'));
    });
    expect(onOpenSettings).toHaveBeenCalledTimes(1);
  });

  it('should call onOpenStats with the selected length when the stats link is pressed', async () => {
    const onOpenStats = jest.fn();
    await renderWithTheme(<ControlledHomeScreen onOpenStats={onOpenStats} />);
    await act(async () => {
      fireEvent.press(screen.getByLabelText('6 harfli kelime seç'));
    });
    await act(async () => {
      fireEvent.press(screen.getByLabelText('İstatistikleri aç'));
    });
    expect(onOpenStats).toHaveBeenCalledWith(6);
  });

  it('should reflect an externally controlled selectedLength', async () => {
    await renderWithTheme(<HomeScreen selectedLength={6} onSelectLength={noop} onStart={noop} onOpenHowToPlay={noop} onOpenSettings={noop} onOpenStats={noop} />);
    expect(screen.getByText('Günün 6 harfli kelimesi. Herkes aynı kelimeyi çözer.')).toBeTruthy();
  });

  it('(008-AE1) should hide the unlimited-mode length picker when only one length is playable', async () => {
    await renderWithTheme(
      <HomeScreen
        selectedLength={5}
        onSelectLength={noop}
        onStart={noop}
        onOpenHowToPlay={noop}
        onOpenSettings={noop}
        onOpenStats={noop}
        playableLengths={[5]}
      />
    );
    expect(screen.queryByLabelText('4 harfli kelime seç')).toBeNull();
    expect(screen.queryByLabelText('5 harfli kelime seç')).toBeNull();
  });

  it('should show the length picker for every scheduled length by default', async () => {
    await renderWithTheme(<ControlledHomeScreen />);
    expect(screen.getByLabelText('4 harfli kelime seç')).toBeTruthy();
    expect(screen.getByLabelText('6 harfli kelime seç')).toBeTruthy();
  });

  it('(008-AE1) should offer only the playable lengths and hide the rest', async () => {
    await renderWithTheme(
      <HomeScreen
        selectedLength={4}
        onSelectLength={noop}
        onStart={noop}
        onOpenHowToPlay={noop}
        onOpenSettings={noop}
        onOpenStats={noop}
        playableLengths={[4, 5]}
      />
    );
    expect(screen.getByLabelText('4 harfli kelime seç')).toBeTruthy();
    expect(screen.getByLabelText('5 harfli kelime seç')).toBeTruthy();
    expect(screen.queryByLabelText('6 harfli kelime seç')).toBeNull();
  });
});
