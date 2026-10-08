import { act, fireEvent, screen, waitFor, within } from '@testing-library/react-native';
import { AccessibilityInfo, Animated } from 'react-native';
import { base, themes } from '@harfhane/ui-tokens';
import type { ApiClient } from '../lib/api';
import { createMemoryStore, flattenStyle, renderWithTheme } from '../test-utils/render-with-theme';
import { GameScreen } from './GameScreen';
import { loadDailyStats } from '../stats/stats';
import { saveGameState, saveRevealedHints } from '../game/game-storage';
import { dailyGameKey } from '../game/game-state';
import type { KeyValueStore } from '../game/game-storage';
import { dailyGameNumber, selectResultMessage } from '../components/gameOverMessages';
import { shortGuessMessage } from '../game/game-session';
import { parseMs } from '../utils/ms';

const mockPerformAndroidHapticsAsync = jest.fn().mockResolvedValue(undefined);
jest.mock('expo-haptics', () => ({
  AndroidHaptics: { Keyboard_Tap: 'keyboard-tap', Confirm: 'confirm', Reject: 'reject' },
  performAndroidHapticsAsync: (...args: unknown[]) => mockPerformAndroidHapticsAsync(...args),
}));

const today = () => '2026-10-05';
const DAILY_WORD_LENGTH = 5;
const STAGGER_MS = parseMs(base.motionStagger);
// Matches useRevealState's wordLength * motion-stagger + motion-flip.
const REVEAL_DURATION_MS = DAILY_WORD_LENGTH * STAGGER_MS + parseMs(base.motionFlip);
// A winning row's card also waits for the win-bounce wave to finish (item 8, web parity).
const WIN_BOUNCE_MS = DAILY_WORD_LENGTH * STAGGER_MS + parseMs(base.motionBounce);
const WON_GAME_OVER_READY_MS = REVEAL_DURATION_MS + WIN_BOUNCE_MS;
// Matches useRevealState's enterBlockDurationMs: (wordLength - 1) * stagger + flip / 2.
const ENTER_UNBLOCK_MS = (DAILY_WORD_LENGTH - 1) * STAGGER_MS + parseMs(base.motionFlip) / 2;

async function advancePastGameOverGate(hasWon: boolean) {
  await act(async () => jest.advanceTimersByTime(hasWon ? WON_GAME_OVER_READY_MS : REVEAL_DURATION_MS));
}

async function enableReduceMotion(): Promise<void> {
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
  // Let useReduceMotion's effect resolve before the player's first action, or the game would
  // commit its first guess still reading the pre-resolution default (false).
  await act(async () => {
    await Promise.resolve();
  });
}

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
  it('should show the game-over card with a deterministic win title when the daily word is guessed with the keyboard (011-AE1)', async () => {
    jest.useFakeTimers();
    try {
      const onBack = jest.fn();
      await renderWithTheme(<GameScreen mode="daily" wordLength={5} onBack={onBack} api={createApi()} store={createMemoryStore()} today={today} />);
      await screen.findByLabelText('Gönder');
      await pressKeys(['K', 'A', 'L', 'E', 'M', 'ENTER']);
      await advancePastGameOverGate(true);
      expect(screen.getByTestId('gameover-card')).toBeTruthy();
      const expectedTitle = selectResultMessage('daily', 'won', 1, dailyGameNumber(today()));
      expect(screen.getByText(expectedTitle)).toBeTruthy();
      expect(screen.getByTestId('gameover-share')).toBeTruthy();
      expect(screen.getByTestId('gameover-countdown')).toBeTruthy();
      expect(screen.queryByTestId('key-ENTER')).toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });

  it('should show neither the keyboard nor the game-over card while the winning row is still revealing or bouncing', async () => {
    jest.useFakeTimers();
    try {
      await renderWithTheme(<GameScreen mode="daily" wordLength={5} onBack={jest.fn()} api={createApi()} store={createMemoryStore()} today={today} />);
      await screen.findByLabelText('Gönder');
      await pressKeys(['K', 'A', 'L', 'E', 'M', 'ENTER']);
      expect(screen.queryByTestId('gameover-card')).toBeNull();
      expect(screen.queryByTestId('key-ENTER')).toBeNull();

      await act(async () => jest.advanceTimersByTime(REVEAL_DURATION_MS));
      // The flip is done but the win bounce is still playing — still neither.
      expect(screen.queryByTestId('gameover-card')).toBeNull();
      expect(screen.queryByTestId('key-ENTER')).toBeNull();

      await act(async () => jest.advanceTimersByTime(WIN_BOUNCE_MS));
      expect(screen.getByTestId('gameover-card')).toBeTruthy();
    } finally {
      jest.useRealTimers();
    }
  });

  it('should show no game-over card one millisecond before the loss reveal gate ends, then show it right after', async () => {
    const api = createApi();
    jest.useFakeTimers();
    try {
      await renderWithTheme(<GameScreen mode="daily" wordLength={5} onBack={jest.fn()} api={api} store={createMemoryStore()} today={today} />);
      await screen.findByLabelText('Gönder');
      for (let attempt = 0; attempt < 5; attempt += 1) {
        await pressKeys(['K', 'A', 'P', 'A', 'K', 'ENTER']); // wrong guess against KALEM
        await act(async () => jest.advanceTimersByTime(REVEAL_DURATION_MS));
      }
      await pressKeys(['K', 'A', 'P', 'A', 'K', 'ENTER']); // 6th and final wrong guess: the game is lost

      await act(async () => jest.advanceTimersByTime(REVEAL_DURATION_MS - 1));
      expect(screen.queryByTestId('gameover-card')).toBeNull();

      await act(async () => jest.advanceTimersByTime(1));
      expect(screen.getByTestId('gameover-card')).toBeTruthy();
    } finally {
      jest.useRealTimers();
    }
  });

  it('should show no game-over card one millisecond before the win reveal-and-bounce gate ends, then show it right after', async () => {
    jest.useFakeTimers();
    try {
      await renderWithTheme(<GameScreen mode="daily" wordLength={5} onBack={jest.fn()} api={createApi()} store={createMemoryStore()} today={today} />);
      await screen.findByLabelText('Gönder');
      await pressKeys(['K', 'A', 'L', 'E', 'M', 'ENTER']); // win in 1 guess

      await act(async () => jest.advanceTimersByTime(WON_GAME_OVER_READY_MS - 1));
      expect(screen.queryByTestId('gameover-card')).toBeNull();

      await act(async () => jest.advanceTimersByTime(1));
      expect(screen.getByTestId('gameover-card')).toBeTruthy();
    } finally {
      jest.useRealTimers();
    }
  });

  it('should show the game-over card immediately for a daily game restored already finished, with no reveal or bounce running', async () => {
    const store = createMemoryStore();
    await saveGameState(store, dailyGameKey(today(), 5), {
      guesses: ['KALEM'],
      evaluations: [['correct', 'correct', 'correct', 'correct', 'correct']],
      currentGuess: '',
      gameStatus: 'won',
      keyboardStatus: {},
    });
    await renderWithTheme(<GameScreen mode="daily" wordLength={5} onBack={jest.fn()} api={createApi()} store={store} today={today} />);
    expect(await screen.findByTestId('gameover-card')).toBeTruthy();
  });

  it('should ignore Enter while the previous row is still revealing, then accept it once the reveal finishes', async () => {
    jest.useFakeTimers();
    try {
      await renderWithTheme(<GameScreen mode="unlimited" wordLength={5} onBack={jest.fn()} api={createApi()} store={createMemoryStore()} today={today} />);
      await screen.findByLabelText('Gönder');
      await pressKeys(['K', 'A', 'L', 'E', 'M', 'ENTER']); // wrong guess against KİTAP; game keeps playing

      await pressKeys(['A', 'B', 'A', 'B', 'A', 'ENTER']); // blocked: row 0 is still flipping
      // Still just the typed letter, not yet evaluated — the second guess never committed.
      expect(screen.getByTestId('tile-1-0').props.accessibilityLabel).toBe('A');

      await act(async () => jest.advanceTimersByTime(REVEAL_DURATION_MS));
      await pressKeys(['ENTER']); // the exact same guess now goes through
      expect(screen.getByTestId('tile-1-0').props.accessibilityLabel).not.toBe('A');
    } finally {
      jest.useRealTimers();
    }
  });

  it('should accept Enter once the row reaches its colour midpoint, not only once the full flip settles (M4 exception, M3)', async () => {
    jest.useFakeTimers();
    try {
      await renderWithTheme(<GameScreen mode="unlimited" wordLength={5} onBack={jest.fn()} api={createApi()} store={createMemoryStore()} today={today} />);
      await screen.findByLabelText('Gönder');
      await pressKeys(['K', 'A', 'L', 'E', 'M', 'ENTER']); // wrong guess against KİTAP; game keeps playing

      await pressKeys(['A', 'B', 'A', 'B', 'A']);
      // isEnterBlocked (the gate) unblocks well before isRevealing (the full flip) ends.
      await act(async () => jest.advanceTimersByTime(ENTER_UNBLOCK_MS));
      expect(ENTER_UNBLOCK_MS).toBeLessThan(REVEAL_DURATION_MS);
      await pressKeys(['ENTER']);
      expect(screen.getByTestId('tile-1-0').props.accessibilityLabel).not.toBe('A');
    } finally {
      jest.useRealTimers();
    }
  });

  it('should keep the normal key-tap haptic for a letter during the post-guess Enter block, but give none for Enter itself (M4, isSubmitBlocked is Enter-only)', async () => {
    jest.useFakeTimers();
    try {
      await renderWithTheme(<GameScreen mode="unlimited" wordLength={5} onBack={jest.fn()} api={createApi()} store={createMemoryStore()} today={today} />);
      await screen.findByLabelText('Gönder');
      await pressKeys(['K', 'A', 'L', 'E', 'M', 'ENTER']); // wrong guess; still playing, now revealing

      // A letter typed during the Enter block must stay snappy: normal haptic, and it lands.
      mockPerformAndroidHapticsAsync.mockClear();
      await act(async () => fireEvent.press(screen.getByTestId('key-A')));
      expect(mockPerformAndroidHapticsAsync).toHaveBeenCalledWith('keyboard-tap');
      expect(screen.getByTestId('tile-1-0').props.accessibilityLabel).toBe('A');

      // Enter itself is still blocked here (M4): no haptic, and the guess does not submit.
      mockPerformAndroidHapticsAsync.mockClear();
      await act(async () => fireEvent.press(screen.getByTestId('key-ENTER')));
      expect(mockPerformAndroidHapticsAsync).not.toHaveBeenCalled();
      expect(screen.getByTestId('tile-1-0').props.accessibilityLabel).toBe('A');
    } finally {
      jest.useRealTimers();
    }
  });

  it('should colour every tile of a new row even when it commits while the previous row is still revealing (B1 repro)', async () => {
    jest.useFakeTimers();
    try {
      await renderWithTheme(<GameScreen mode="unlimited" wordLength={5} onBack={jest.fn()} api={createApi()} store={createMemoryStore()} today={today} />);
      await screen.findByLabelText('Gönder');
      await pressKeys(['K', 'A', 'L', 'E', 'M', 'ENTER']); // row 0: wrong guess, starts revealing (1000 ms)

      // Row 0 unblocks Enter at 650 ms (well before its own 1000 ms isRevealing window ends).
      await act(async () => jest.advanceTimersByTime(ENTER_UNBLOCK_MS));
      await pressKeys(['T', 'A', 'K', 'O', 'P', 'ENTER']); // row 1 commits at +650 ms, starts its own reveal

      // Step forward in small increments past row 1's own full reveal window — if the stale
      // timer from row 0 (which would fire at +1000 ms, only 350 ms into row 1's own window)
      // cuts isRevealing early, row 1's later columns' midpoint timers get cancelled and their
      // tiles stay uncoloured (#ffffff) forever.
      for (let elapsed = 0; elapsed < REVEAL_DURATION_MS + 100; elapsed += 50) {
        await act(async () => jest.advanceTimersByTime(50));
      }

      for (let col = 0; col < 5; col += 1) {
        const tile = screen.getByTestId(`tile-1-${col}`);
        expect(flattenStyle(tile.props.style).backgroundColor).not.toBe(themes.light.surface);
      }
    } finally {
      jest.useRealTimers();
    }
  });

  it('should offer a new word in the game-over card when an unlimited game is over, and fetch a fresh word when pressed', async () => {
    jest.useFakeTimers();
    try {
      const api = createApi();
      await renderWithTheme(<GameScreen mode="unlimited" wordLength={5} onBack={jest.fn()} api={api} store={createMemoryStore()} today={today} />);
      await screen.findByLabelText('Gönder');
      await pressKeys(['K', 'İ', 'T', 'A', 'P', 'ENTER']);
      await advancePastGameOverGate(true);
      expect(screen.getByTestId('gameover-card')).toBeTruthy();
      expect(screen.queryByTestId('gameover-countdown')).toBeNull();
      expect(screen.queryByTestId('key-ENTER')).toBeNull();
      expect(api.fetchRandomWord).toHaveBeenCalledTimes(1);

      await act(async () => fireEvent.press(screen.getByTestId('gameover-new-word')));
      await waitFor(() => expect(api.fetchRandomWord).toHaveBeenCalledTimes(2));
      expect(screen.queryByTestId('gameover-card')).toBeNull();
      expect(screen.getByTestId('tile-0-0')).toBeTruthy();
    } finally {
      jest.useRealTimers();
    }
  });

  it('should record the daily result in stats when the game finishes', async () => {
    // Stats record off the session's game status directly (useResultRecorder), not the
    // game-over card's gated appearance, so this never needs to wait out the reveal/bounce.
    const store = createMemoryStore();
    await renderWithTheme(<GameScreen mode="daily" wordLength={5} onBack={jest.fn()} api={createApi()} store={store} today={today} />);
    await screen.findByLabelText('Gönder');
    await pressKeys(['K', 'A', 'L', 'E', 'M', 'ENTER']);
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
    jest.useFakeTimers();
    try {
      await renderWithTheme(<GameScreen mode="daily" wordLength={5} onBack={jest.fn()} api={createApi()} store={createMemoryStore()} today={today} />);
      const hintButton = await screen.findByLabelText('İpucu göster');
      await act(async () => fireEvent.press(hintButton));
      await screen.findByTestId('hint-text');

      await pressKeys(['K', 'A', 'L', 'E', 'M', 'ENTER']);
      expect(screen.queryByTestId('hint-button')).toBeNull();
      expect(screen.queryByTestId('hint-text')).toBeNull();
      // Without the isPlaying guard this trailing row would still show "K, ipucu" from the
      // (now stale) revealed position — the hint was at position 0.
      expect(screen.getByTestId('tile-1-0').props.accessibilityLabel).toBe('boş');

      await advancePastGameOverGate(true);
      expect(screen.getByTestId('gameover-card')).toBeTruthy();
    } finally {
      jest.useRealTimers();
    }
  });

  it('should hide the hint control and stop marking the trailing row once the daily game is lost', async () => {
    await renderWithTheme(<GameScreen mode="daily" wordLength={5} onBack={jest.fn()} api={createApi()} store={createMemoryStore()} today={today} />);
    const hintButton = await screen.findByLabelText('İpucu göster');
    await act(async () => fireEvent.press(hintButton));
    await screen.findByTestId('hint-text');

    jest.useFakeTimers();
    try {
      for (let attempt = 0; attempt < 6; attempt += 1) {
        await pressKeys(['K', 'A', 'P', 'A', 'K', 'ENTER']);
        // Enter is blocked while the previous row flips (R2); flush that reveal window before
        // the next attempt's own Enter press, mirroring real wall-clock time between guesses.
        await act(async () => jest.advanceTimersByTime(REVEAL_DURATION_MS));
      }
    } finally {
      jest.useRealTimers();
    }
    await screen.findByTestId('gameover-card');
    expect(await screen.findByText('Kelime: KALEM')).toBeTruthy();

    expect(screen.queryByTestId('hint-button')).toBeNull();
    expect(screen.queryByTestId('hint-text')).toBeNull();
  });

  it('should show the in-game message (e.g. not enough letters) while the game is still playing, before it finishes (011-N4)', async () => {
    await renderWithTheme(<GameScreen mode="daily" wordLength={5} onBack={jest.fn()} api={createApi()} store={createMemoryStore()} today={today} />);
    await screen.findByLabelText('Gönder');
    await pressKeys(['K', 'A', 'ENTER']);
    expect(await screen.findByText(shortGuessMessage(5))).toBeTruthy();
    expect(screen.queryByTestId('gameover-card')).toBeNull();
  });

  it('should shake the active row when a too-short guess is submitted (M5)', async () => {
    // The shake sequence's step duration (motionShake / 9 steps) is distinct from the pop,
    // flip and bounce durations, so this does not get a false positive from the K/A key pops.
    const shakeStepMs = parseMs(base.motionShake) / 9;
    const timingSpy = jest.spyOn(Animated, 'timing');
    await renderWithTheme(<GameScreen mode="daily" wordLength={5} onBack={jest.fn()} api={createApi()} store={createMemoryStore()} today={today} />);
    await screen.findByLabelText('Gönder');
    await pressKeys(['K', 'A', 'ENTER']);
    const shakeCall = timingSpy.mock.calls.find((call) => (call[1] as { duration?: number }).duration === shakeStepMs);
    expect(shakeCall).toBeTruthy();
  });

  it('should count a 1-guess unlimited win and a 1-guess daily win each as "1" in their own distribution, not double-counted (011-N5)', async () => {
    jest.useFakeTimers();
    try {
      const store = createMemoryStore();
      const unlimitedApi = createApi();
      (unlimitedApi.fetchRandomWord as jest.Mock).mockResolvedValue({ word: { word: 'KALEM' }, wordId: 9 });
      const unlimitedView = await renderWithTheme(
        <GameScreen mode="unlimited" wordLength={5} onBack={jest.fn()} api={unlimitedApi} store={store} today={today} />,
      );
      await screen.findByLabelText('Gönder');
      await pressKeys(['K', 'A', 'L', 'E', 'M', 'ENTER']);
      await advancePastGameOverGate(true);
      const unlimitedRow1Fill = screen.getByTestId('gameover-distribution-1-fill');
      expect(within(unlimitedRow1Fill).getByText('1')).toBeTruthy();
      await act(async () => unlimitedView.unmount());

      const dailyView = await renderWithTheme(
        <GameScreen mode="daily" wordLength={5} onBack={jest.fn()} api={createApi()} store={store} today={today} />,
      );
      await screen.findByLabelText('Gönder');
      await pressKeys(['K', 'A', 'L', 'E', 'M', 'ENTER']);
      await advancePastGameOverGate(true);
      const dailyRow1Fill = screen.getByTestId('gameover-distribution-1-fill');
      expect(within(dailyRow1Fill).getByText('1')).toBeTruthy();
      await act(async () => dailyView.unmount());
    } finally {
      jest.useRealTimers();
    }
  });

  it('should show the just-finished game in the unlimited distribution with reduce motion on (B2)', async () => {
    await enableReduceMotion();
    const store = createMemoryStore();
    await renderWithTheme(<GameScreen mode="unlimited" wordLength={5} onBack={jest.fn()} api={createApi()} store={store} today={today} />);
    await screen.findByLabelText('Gönder');
    await pressKeys(['K', 'İ', 'T', 'A', 'P', 'ENTER']);
    // Reduce motion means the card mounts in the very same commit the game finishes (no reveal
    // gate) — if the display raced useResultRecorder's write instead of using its own result,
    // this would show no fill at all, not "1".
    const fill = await waitFor(() => screen.getByTestId('gameover-distribution-1-fill'));
    expect(within(fill).getByText('1')).toBeTruthy();
  });

  it('should show the just-finished game in the daily distribution with reduce motion on (B2)', async () => {
    await enableReduceMotion();
    const store = createMemoryStore();
    await renderWithTheme(<GameScreen mode="daily" wordLength={5} onBack={jest.fn()} api={createApi()} store={store} today={today} />);
    await screen.findByLabelText('Gönder');
    await pressKeys(['K', 'A', 'L', 'E', 'M', 'ENTER']);
    const fill = await waitFor(() => screen.getByTestId('gameover-distribution-1-fill'));
    expect(within(fill).getByText('1')).toBeTruthy();
  });

  it('should still show the just-played result on screen when the stats write fails (B2)', async () => {
    await enableReduceMotion();
    const rejectingStore: KeyValueStore = {
      getItem: async () => null,
      setItem: async () => {
        throw new Error('AsyncStorage unavailable');
      },
    };
    await renderWithTheme(<GameScreen mode="unlimited" wordLength={5} onBack={jest.fn()} api={createApi()} store={rejectingStore} today={today} />);
    await screen.findByLabelText('Gönder');
    await pressKeys(['K', 'İ', 'T', 'A', 'P', 'ENTER']);
    const fill = await waitFor(() => screen.getByTestId('gameover-distribution-1-fill'));
    expect(within(fill).getByText('1')).toBeTruthy();
  });

  it("should show game 2's own distribution, not game 1's stale one, once game 2's stats write resolves (B2)", async () => {
    interface HoldableStore extends KeyValueStore {
      holdWrites(): void;
      releaseWrites(): void;
    }
    function createHoldableStore(): HoldableStore {
      const entries = new Map<string, string>();
      const heldCommits: Array<() => void> = [];
      let writesHeld = false;
      return {
        getItem: async (key) => entries.get(key) ?? null,
        setItem: (key, value) =>
          new Promise<void>((resolve) => {
            const commit = () => {
              entries.set(key, value);
              resolve();
            };
            if (writesHeld) {
              heldCommits.push(commit);
              return;
            }
            commit();
          }),
        holdWrites() {
          writesHeld = true;
        },
        releaseWrites() {
          writesHeld = false;
          while (heldCommits.length > 0) heldCommits.shift()?.();
        },
      };
    }

    await enableReduceMotion();
    const store = createHoldableStore();
    const api = createApi();
    (api.fetchRandomWord as jest.Mock)
      .mockResolvedValueOnce({ word: { word: 'KALEM' }, wordId: 9 })
      .mockResolvedValueOnce({ word: { word: 'KAPAK' }, wordId: 10 });
    await renderWithTheme(<GameScreen mode="unlimited" wordLength={5} onBack={jest.fn()} api={api} store={store} today={today} />);
    await screen.findByLabelText('Gönder');

    // Game 1: win in 1 guess, and let its stats write resolve before game 2 starts.
    await pressKeys(['K', 'A', 'L', 'E', 'M', 'ENTER']);
    await waitFor(() => expect(within(screen.getByTestId('gameover-distribution-1-fill')).getByText('1')).toBeTruthy());

    // Game 2's stats write is held pending (simulating slow I/O) while it plays out.
    store.holdWrites();
    await act(async () => fireEvent.press(screen.getByTestId('gameover-new-word')));
    await waitFor(() => expect(api.fetchRandomWord).toHaveBeenCalledTimes(2));
    await screen.findByLabelText('Gönder');
    await pressKeys(['K', 'A', 'B', 'A', 'K', 'ENTER']); // game 2, guess 1: wrong
    await pressKeys(['K', 'A', 'P', 'A', 'K', 'ENTER']); // game 2, guess 2: win
    expect(screen.getByTestId('gameover-card')).toBeTruthy();

    await act(async () => store.releaseWrites());
    const fill = await waitFor(() => screen.getByTestId('gameover-distribution-2-fill'));
    expect(within(fill).getByText('1')).toBeTruthy();
  });

  it('should not trigger the key-tap haptic when a key is pressed while a guess is still being validated', async () => {
    let resolveValidate!: (value: { isValid: boolean }) => void;
    const api = createApi();
    api.validateWord = jest.fn(() => new Promise((resolve) => { resolveValidate = resolve; }));
    await renderWithTheme(<GameScreen mode="daily" wordLength={5} onBack={jest.fn()} api={api} store={createMemoryStore()} today={today} />);
    await screen.findByLabelText('Gönder');
    await pressKeys(['K', 'A', 'L', 'E', 'M', 'ENTER']);
    await waitFor(() => expect(api.validateWord).toHaveBeenCalledTimes(1));

    mockPerformAndroidHapticsAsync.mockClear();
    await fireEvent.press(screen.getByTestId('key-A'));

    expect(mockPerformAndroidHapticsAsync).not.toHaveBeenCalledWith('keyboard-tap');

    await act(async () => resolveValidate({ isValid: true }));
  });
});
