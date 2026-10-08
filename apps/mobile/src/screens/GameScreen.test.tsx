import { act, fireEvent, screen, waitFor, within } from '@testing-library/react-native';
import { base } from '@harfhane/ui-tokens';
import type { ApiClient } from '../lib/api';
import { createMemoryStore, renderWithTheme } from '../test-utils/render-with-theme';
import { GameScreen } from './GameScreen';
import { loadDailyStats } from '../stats/stats';
import { saveGameState, saveRevealedHints } from '../game/game-storage';
import { dailyGameKey } from '../game/game-state';
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

async function advancePastGameOverGate(hasWon: boolean) {
  await act(async () => jest.advanceTimersByTime(hasWon ? WON_GAME_OVER_READY_MS : REVEAL_DURATION_MS));
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
