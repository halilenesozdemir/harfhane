import { Profiler, useState } from 'react';
import { act, configure, fireEvent, resetToDefaults, screen, waitFor } from '@testing-library/react-native';
import { themes } from '@harfhane/ui-tokens';
import { DEFAULT_WORD_LENGTH, HomeScreen } from './HomeScreen';
import { createInitialState, dailyGameKey } from '../game/game-state';
import { dailyStatsKey } from '../stats/stats';
import { flattenStyle, renderWithTheme, createMemoryStore } from '../test-utils/render-with-theme';
import type { HomeScreenProps } from './HomeScreen';
import type { KeyValueStore } from '../game/game-storage';
import type { DailyStats, WordLength } from '../stats/stats';

// Counts HomeHero's own renders without changing its rendered output, so the
// countdown-isolation test below can assert that a per-second DailyCard tick
// never reaches sibling components (see mobile-redesign-spec.md section B,
// "updates each second only while visible").
const mockHomeHeroRenderCount = { current: 0 };

jest.mock('../home/HomeHero', () => {
  const actual = jest.requireActual('../home/HomeHero') as typeof import('../home/HomeHero');
  return {
    __esModule: true,
    HomeHero: () => {
      mockHomeHeroRenderCount.current += 1;
      return actual.HomeHero();
    },
  };
});

function noop() {
  return undefined;
}

type ControlledHomeScreenProps = Partial<Omit<HomeScreenProps, 'selectedLength' | 'onSelectLength'>>;

const FIXED_TODAY = '2026-10-08T10:00:00.000Z';
function fixedNow(): Date {
  return new Date(FIXED_TODAY);
}

function ControlledHomeScreen({
  onStart = noop,
  onOpenHowToPlay = noop,
  onOpenSettings = noop,
  onOpenStats = noop,
  store = createMemoryStore(),
  playableLengths,
  now = fixedNow,
}: ControlledHomeScreenProps) {
  const [selectedLength, setSelectedLength] = useState<WordLength>(DEFAULT_WORD_LENGTH);
  return (
    <HomeScreen
      selectedLength={selectedLength}
      onSelectLength={setSelectedLength}
      onStart={onStart}
      onOpenHowToPlay={onOpenHowToPlay}
      onOpenSettings={onOpenSettings}
      onOpenStats={onOpenStats}
      store={store}
      playableLengths={playableLengths}
      now={now}
    />
  );
}

function storeWithDailyGame(length: WordLength, today: string, guesses: readonly string[], gameStatus: 'playing' | 'won' | 'lost'): KeyValueStore {
  const state = { ...createInitialState(), guesses, gameStatus };
  return createMemoryStore({ [dailyGameKey(today, length)]: JSON.stringify(state) });
}

function storeWithStreak(streak: number, lastPlayedDate: string, length: WordLength = DEFAULT_WORD_LENGTH): KeyValueStore {
  const stats: DailyStats = {
    gamesPlayed: streak,
    gamesWon: streak,
    currentStreak: streak,
    maxStreak: streak,
    guessDistribution: [0, 0, 0, 0, 0, 0],
    lastPlayedDate,
  };
  return createMemoryStore({ [dailyStatsKey(length)]: JSON.stringify(stats) });
}

describe('HomeScreen', () => {
  // Decorative subtrees (hero tiles, wordmark, a card's CTA) use
  // importantForAccessibility="no-hide-descendants", so TalkBack reads each
  // row/card as one unit. Only tests that look inside such a subtree opt in
  // via `withHiddenElementsVisible`; the rest run under the strict default, so
  // an icon button wrongly made decorative fails instead of passing.
  function withHiddenElementsVisible(name: string, test: () => Promise<void>) {
    it(name, async () => {
      configure({ defaultIncludeHiddenElements: true });
      try {
        await test();
      } finally {
        resetToDefaults();
      }
    });
  }

  beforeEach(() => {
    mockHomeHeroRenderCount.current = 0;
  });

  it('should expose the three home actions as icon buttons with their Turkish accessibility labels when the home screen renders', async () => {
    await renderWithTheme(<ControlledHomeScreen />);
    for (const label of ['Nasıl oynanır sayfasını aç', 'İstatistikleri aç', 'Ayarları aç']) {
      const button = screen.getByLabelText(label);
      expect(button.props.accessibilityRole).toBe('button');
      expect(flattenStyle(button.props.style).width).toBeGreaterThanOrEqual(48);
      expect(flattenStyle(button.props.style).height).toBeGreaterThanOrEqual(48);
    }
  });

  it('should show the stats summary card that opens stats when the daily stats have loaded', async () => {
    const onOpenStats = jest.fn();
    await renderWithTheme(<ControlledHomeScreen onOpenStats={onOpenStats} />);
    const card = await screen.findByTestId('home-stats-card');
    await act(async () => fireEvent.press(card));
    expect(onOpenStats).toHaveBeenCalledTimes(1);
  });

  it('should call onOpenHowToPlay when its icon button is pressed', async () => {
    const onOpenHowToPlay = jest.fn();
    await renderWithTheme(<ControlledHomeScreen onOpenHowToPlay={onOpenHowToPlay} />);
    await act(async () => fireEvent.press(screen.getByLabelText('Nasıl oynanır sayfasını aç')));
    expect(onOpenHowToPlay).toHaveBeenCalledTimes(1);
  });

  it('should call onOpenSettings when its icon button is pressed', async () => {
    const onOpenSettings = jest.fn();
    await renderWithTheme(<ControlledHomeScreen onOpenSettings={onOpenSettings} />);
    await act(async () => fireEvent.press(screen.getByLabelText('Ayarları aç')));
    expect(onOpenSettings).toHaveBeenCalledTimes(1);
  });

  it('should call onOpenStats with the selected length when its icon button is pressed', async () => {
    const onOpenStats = jest.fn();
    await renderWithTheme(<ControlledHomeScreen onOpenStats={onOpenStats} />);
    await act(async () => fireEvent.press(screen.getByLabelText('İstatistikleri aç')));
    expect(onOpenStats).toHaveBeenCalledWith(DEFAULT_WORD_LENGTH);
  });

  it('should call onStart with daily mode and the selected length when the daily card is pressed', async () => {
    const onStart = jest.fn();
    await renderWithTheme(<ControlledHomeScreen onStart={onStart} />);
    await act(async () => fireEvent.press(screen.getByTestId('home-daily-card')));
    expect(onStart).toHaveBeenCalledWith('daily', DEFAULT_WORD_LENGTH);
  });

  it('should call onStart with unlimited mode and the selected length when the unlimited card is pressed', async () => {
    const onStart = jest.fn();
    await renderWithTheme(<ControlledHomeScreen onStart={onStart} />);
    await act(async () => fireEvent.press(screen.getByTestId('home-unlimited-card')));
    expect(onStart).toHaveBeenCalledWith('unlimited', DEFAULT_WORD_LENGTH);
  });

  it('should follow the selected length for onOpenStats, onStart daily and onStart unlimited when the length chip is switched', async () => {
    const onOpenStats = jest.fn();
    const onStart = jest.fn();
    const selectedLength: WordLength = 6;
    await renderWithTheme(<ControlledHomeScreen onOpenStats={onOpenStats} onStart={onStart} />);
    await act(async () => fireEvent.press(screen.getByLabelText('6 harfli kelime seç')));

    await act(async () => fireEvent.press(screen.getByLabelText('İstatistikleri aç')));
    expect(onOpenStats).toHaveBeenCalledWith(selectedLength);

    await act(async () => fireEvent.press(screen.getByTestId('home-daily-card')));
    expect(onStart).toHaveBeenCalledWith('daily', selectedLength);

    await act(async () => fireEvent.press(screen.getByTestId('home-unlimited-card')));
    expect(onStart).toHaveBeenCalledWith('unlimited', selectedLength);
  });

  it('should show the not-started status when no load has settled yet, then update once loaded', async () => {
    await renderWithTheme(<ControlledHomeScreen />);
    await waitFor(() => expect(screen.getByText('Yeni kelime hazır')).toBeTruthy());
  });

  it('should show the in-progress status with the guess count when a daily game is in progress', async () => {
    const store = storeWithDailyGame(DEFAULT_WORD_LENGTH, '2026-10-08', ['kalem'], 'playing');
    await renderWithTheme(<ControlledHomeScreen store={store} />);
    await waitFor(() => expect(screen.getByText('1/6 tahmin')).toBeTruthy());
  });

  withHiddenElementsVisible('should show the lost status and also move the primary action to the unlimited card when the daily game is lost', async () => {
    const store = storeWithDailyGame(DEFAULT_WORD_LENGTH, '2026-10-08', new Array(6).fill('tahta'), 'lost');
    await renderWithTheme(<ControlledHomeScreen store={store} />);
    await waitFor(() => expect(screen.getByText('Bu sefer olmadı')).toBeTruthy());
    expect(screen.getByText('Sınırsız oyna')).toBeTruthy();
  });

  withHiddenElementsVisible('should show the solved status and move the primary action to the unlimited card when the daily game is won', async () => {
    const store = storeWithDailyGame(DEFAULT_WORD_LENGTH, '2026-10-08', ['kalem', 'tahta'], 'won');
    await renderWithTheme(<ControlledHomeScreen store={store} />);
    await waitFor(() => expect(screen.getByText('Çözüldü · 2/6')).toBeTruthy());
    expect(screen.getByText('Sonucu gör')).toBeTruthy();
    expect(screen.getByText('Sınırsız oyna')).toBeTruthy();
  });

  it('should show the selected length in the daily card text when a different length is selected', async () => {
    await renderWithTheme(<ControlledHomeScreen />);
    await act(async () => fireEvent.press(screen.getByLabelText('6 harfli kelime seç')));
    expect(screen.getByText('Günün 6 harfli kelimesi')).toBeTruthy();
  });

  it('(008-AE1) should hide the unlimited-mode length picker when only one length is playable', async () => {
    await renderWithTheme(<ControlledHomeScreen playableLengths={[5]} />);
    expect(screen.queryByTestId('home-length-row')).toBeNull();
  });

  it('should show the length picker for every scheduled length when playableLengths is not given', async () => {
    await renderWithTheme(<ControlledHomeScreen />);
    expect(screen.getByLabelText('4 harfli kelime seç')).toBeTruthy();
    expect(screen.getByLabelText('6 harfli kelime seç')).toBeTruthy();
  });

  it('(008-AE1) should offer only the playable lengths and hide the rest when playableLengths is given', async () => {
    await renderWithTheme(<ControlledHomeScreen playableLengths={[4, 5]} />);
    expect(screen.getByLabelText('4 harfli kelime seç')).toBeTruthy();
    expect(screen.getByLabelText('5 harfli kelime seç')).toBeTruthy();
    expect(screen.queryByLabelText('6 harfli kelime seç')).toBeNull();
  });

  withHiddenElementsVisible('should render the hero as a single Harfhane header when the home screen renders', async () => {
    await renderWithTheme(<ControlledHomeScreen />);
    expect(screen.getByLabelText('Harfhane')).toBeTruthy();
    expect(screen.getByText('hane')).toBeTruthy();
  });

  withHiddenElementsVisible('should render the H-A-R-F hero letters when the home screen renders', async () => {
    await renderWithTheme(<ControlledHomeScreen />);
    for (const letter of ['H', 'A', 'R', 'F']) {
      expect(screen.getByText(letter)).toBeTruthy();
    }
  });

  withHiddenElementsVisible('should colour each hero letter with the fg token matching its own background when the home screen renders', async () => {
    await renderWithTheme(<ControlledHomeScreen />);
    for (const letter of ['H', 'R']) {
      expect(flattenStyle(screen.getByText(letter).props.style).color).toBe(themes.light.correctFg);
    }
    for (const letter of ['A', 'F']) {
      expect(flattenStyle(screen.getByText(letter).props.style).color).toBe(themes.light.presentFg);
    }
  });

  describe('countdown re-render isolation', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(FIXED_TODAY));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should not re-render the home tree on ticks when no countdown is shown', async () => {
      const onRender = jest.fn();
      await renderWithTheme(
        <Profiler id="home" onRender={onRender}>
          <ControlledHomeScreen />
        </Profiler>,
      );
      await waitFor(() => expect(screen.getByText('Yeni kelime hazır')).toBeTruthy());

      // One settle render can still land on the very first tick (unrelated
      // async layout/effect work, not the day-check interval); the fix is
      // about every *subsequent* tick, which the day-check interval skips
      // entirely (no Turkey day rollover) unless something re-renders.
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
      const rendersAfterFirstTick = onRender.mock.calls.length;

      await act(async () => {
        jest.advanceTimersByTime(5000);
      });

      expect(onRender.mock.calls.length).toBe(rendersAfterFirstTick);
    });

    it('should still update the visible countdown once a second when the daily game is finished', async () => {
      const store = storeWithDailyGame(DEFAULT_WORD_LENGTH, '2026-10-08', ['kalem', 'tahta'], 'won');
      // Reads the (faked) system clock, unlike fixedNow above, so advancing
      // fake timers actually moves the countdown this test checks.
      await renderWithTheme(<ControlledHomeScreen store={store} now={() => new Date()} />);
      await waitFor(() => expect(screen.getByText('Çözüldü · 2/6')).toBeTruthy());
      const countdownPattern = /^\d{2}:\d{2}:\d{2}$/;
      const firstCountdown = screen.getByText(countdownPattern).props.children;

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      const nextCountdown = screen.getByText(countdownPattern).props.children;
      expect(nextCountdown).not.toBe(firstCountdown);
    });

    it('should not re-render HomeHero on countdown ticks when the daily game is finished and the countdown is visible', async () => {
      const store = storeWithDailyGame(DEFAULT_WORD_LENGTH, '2026-10-08', ['kalem', 'tahta'], 'won');
      await renderWithTheme(<ControlledHomeScreen store={store} now={() => new Date()} />);
      await waitFor(() => expect(screen.getByText('Çözüldü · 2/6')).toBeTruthy());

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
      const rendersAfterFirstTick = mockHomeHeroRenderCount.current;

      await act(async () => {
        jest.advanceTimersByTime(5000);
      });

      expect(mockHomeHeroRenderCount.current).toBe(rendersAfterFirstTick);
    });
  });

  withHiddenElementsVisible('should hide the streak chip when the displayed streak is zero', async () => {
    await renderWithTheme(<ControlledHomeScreen />);
    await waitFor(() => expect(screen.queryByText('Oyna')).toBeTruthy());
    expect(screen.queryByLabelText(/günlük seri/)).toBeNull();
  });

  it('should show the streak chip and open stats when pressed', async () => {
    const onOpenStats = jest.fn();
    const store = storeWithStreak(3, '2026-10-08');
    await renderWithTheme(<ControlledHomeScreen store={store} onOpenStats={onOpenStats} />);
    const label = `${DEFAULT_WORD_LENGTH} harf, 3 günlük seri`;
    await waitFor(() => expect(screen.getByLabelText(label)).toBeTruthy());
    await act(async () => fireEvent.press(screen.getByLabelText(label)));
    expect(onOpenStats).toHaveBeenCalledWith(DEFAULT_WORD_LENGTH);
  });

  it('should follow the selected length when switching the streak chip and the daily status', async () => {
    const stats5: DailyStats = { gamesPlayed: 3, gamesWon: 3, currentStreak: 3, maxStreak: 3, guessDistribution: [0, 0, 0, 0, 0, 0], lastPlayedDate: '2026-10-08' };
    const stats6: DailyStats = { gamesPlayed: 9, gamesWon: 9, currentStreak: 9, maxStreak: 9, guessDistribution: [0, 0, 0, 0, 0, 0], lastPlayedDate: '2026-10-08' };
    const store = createMemoryStore({
      [dailyStatsKey(5)]: JSON.stringify(stats5),
      [dailyStatsKey(6)]: JSON.stringify(stats6),
    });
    await renderWithTheme(<ControlledHomeScreen store={store} />);
    await waitFor(() => expect(screen.getByLabelText('5 harf, 3 günlük seri')).toBeTruthy());

    await act(async () => fireEvent.press(screen.getByLabelText('6 harfli kelime seç')));

    await waitFor(() => expect(screen.getByLabelText('6 harf, 9 günlük seri')).toBeTruthy());
    expect(screen.queryByLabelText('5 harf, 3 günlük seri')).toBeNull();
  });
});
