import { Profiler, useState } from 'react';
import { act, configure, fireEvent, resetToDefaults, screen, waitFor } from '@testing-library/react-native';
import { themes } from '@harfhane/ui-tokens';
import { DEFAULT_WORD_LENGTH, HomeScreen } from './HomeScreen';
import { createInitialState, dailyGameKey } from '../game/game-state';
import { dailyStatsKey } from '../stats/stats';
import { flattenStyle, renderWithTheme, createMemoryStore } from '../test-utils/render-with-theme';
import type { HomeScreenProps } from './HomeScreen';
import type { KeyValueStore } from '../game/game-storage';
import type { DailyStats } from '../stats/stats';
import type { WordLength } from '../stats/stats';

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

function storeWithStreak(streak: number, lastPlayedDate: string): KeyValueStore {
  const stats: DailyStats = {
    gamesPlayed: streak,
    gamesWon: streak,
    currentStreak: streak,
    maxStreak: streak,
    guessDistribution: [0, 0, 0, 0, 0, 0],
    lastPlayedDate,
  };
  return createMemoryStore({ [dailyStatsKey(DEFAULT_WORD_LENGTH)]: JSON.stringify(stats) });
}

function storeWithDailyGame(length: WordLength, today: string, guesses: readonly string[], gameStatus: 'playing' | 'won' | 'lost'): KeyValueStore {
  const state = { ...createInitialState(), guesses, gameStatus };
  return createMemoryStore({ [dailyGameKey(today, length)]: JSON.stringify(state) });
}

describe('HomeScreen', () => {
  // Decorative subtrees (hero tiles, the "hane" wordmark, a card's decorative
  // CTA button) use importantForAccessibility="no-hide-descendants": real on
  // a device, where TalkBack reads the row/card as one unit via its own
  // accessibilityLabel. Only the handful of tests that look *inside* such a
  // subtree opt into seeing it (see `withHiddenElementsVisible` below); every
  // other test — in particular the icon-button test right after this comment
  // block — runs under the strict default, so an icon button that was
  // wrongly made decorative would actually fail it instead of passing by
  // way of a blanket, file-wide override.
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

  withHiddenElementsVisible('should render the hero as a single Harfhane header', async () => {
    await renderWithTheme(<ControlledHomeScreen />);
    expect(screen.getByLabelText('Harfhane')).toBeTruthy();
    expect(screen.getByText('hane')).toBeTruthy();
  });

  withHiddenElementsVisible('should render the H-A-R-F hero letters', async () => {
    await renderWithTheme(<ControlledHomeScreen />);
    for (const letter of ['H', 'A', 'R', 'F']) {
      expect(screen.getByText(letter)).toBeTruthy();
    }
  });

  withHiddenElementsVisible('should colour each hero letter with the fg token matching its own background', async () => {
    await renderWithTheme(<ControlledHomeScreen />);
    for (const letter of ['H', 'R']) {
      expect(flattenStyle(screen.getByText(letter).props.style).color).toBe(themes.light.correctFg);
    }
    for (const letter of ['A', 'F']) {
      expect(flattenStyle(screen.getByText(letter).props.style).color).toBe(themes.light.presentFg);
    }
  });

  it('should expose the three home actions as icon buttons with their Turkish accessibility labels', async () => {
    await renderWithTheme(<ControlledHomeScreen />);
    for (const label of ['Nasıl oynanır sayfasını aç', 'İstatistikleri aç', 'Ayarları aç']) {
      const button = screen.getByLabelText(label);
      expect(button.props.accessibilityRole).toBe('button');
      expect(flattenStyle(button.props.style).width).toBeGreaterThanOrEqual(48);
      expect(flattenStyle(button.props.style).height).toBeGreaterThanOrEqual(48);
    }
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

  it('should show the not-started status before any load has settled, then update once loaded', async () => {
    await renderWithTheme(<ControlledHomeScreen />);
    await waitFor(() => expect(screen.getByText('Yeni kelime hazır')).toBeTruthy());
  });

  it('should show the in-progress status with the guess count', async () => {
    const store = storeWithDailyGame(DEFAULT_WORD_LENGTH, '2026-10-08', ['kalem'], 'playing');
    await renderWithTheme(<ControlledHomeScreen store={store} />);
    await waitFor(() => expect(screen.getByText('1/6 tahmin')).toBeTruthy());
  });

  withHiddenElementsVisible('should show the solved status and move the primary action to the unlimited card', async () => {
    const store = storeWithDailyGame(DEFAULT_WORD_LENGTH, '2026-10-08', ['kalem', 'tahta'], 'won');
    await renderWithTheme(<ControlledHomeScreen store={store} />);
    await waitFor(() => expect(screen.getByText('Çözüldü · 2/6')).toBeTruthy());
    expect(screen.getByText('Sonucu gör')).toBeTruthy();
    expect(screen.getByText('Sınırsız oyna')).toBeTruthy();
  });

  withHiddenElementsVisible('should show the lost status and also move the primary action to the unlimited card', async () => {
    const store = storeWithDailyGame(DEFAULT_WORD_LENGTH, '2026-10-08', new Array(6).fill('tahta'), 'lost');
    await renderWithTheme(<ControlledHomeScreen store={store} />);
    await waitFor(() => expect(screen.getByText('Bu sefer olmadı')).toBeTruthy());
    expect(screen.getByText('Sınırsız oyna')).toBeTruthy();
  });

  it('should show the selected length in the daily card text', async () => {
    await renderWithTheme(<ControlledHomeScreen />);
    await act(async () => fireEvent.press(screen.getByLabelText('6 harfli kelime seç')));
    expect(screen.getByText('Günün 6 harfli kelimesi')).toBeTruthy();
  });

  it('(008-AE1) should hide the unlimited-mode length picker when only one length is playable', async () => {
    await renderWithTheme(<ControlledHomeScreen playableLengths={[5]} />);
    expect(screen.queryByTestId('home-length-row')).toBeNull();
  });

  it('should show the length picker for every scheduled length by default', async () => {
    await renderWithTheme(<ControlledHomeScreen />);
    expect(screen.getByLabelText('4 harfli kelime seç')).toBeTruthy();
    expect(screen.getByLabelText('6 harfli kelime seç')).toBeTruthy();
  });

  it('(008-AE1) should offer only the playable lengths and hide the rest', async () => {
    await renderWithTheme(<ControlledHomeScreen playableLengths={[4, 5]} />);
    expect(screen.getByLabelText('4 harfli kelime seç')).toBeTruthy();
    expect(screen.getByLabelText('5 harfli kelime seç')).toBeTruthy();
    expect(screen.queryByLabelText('6 harfli kelime seç')).toBeNull();
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

    it('should still update the visible countdown once a second once the daily game is finished', async () => {
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
  });
});
