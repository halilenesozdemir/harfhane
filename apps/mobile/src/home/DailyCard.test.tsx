import { act, configure, fireEvent, resetToDefaults, screen } from '@testing-library/react-native';
import { themes } from '@harfhane/ui-tokens';
import { DailyCard } from './DailyCard';
import { flattenStyle, renderWithTheme } from '../test-utils/render-with-theme';
import type { TodayStatus } from './today-status';

const WORD_LENGTH = 5;
const COUNTDOWN = '04:12:09';
// Yields COUNTDOWN above (19:47:51 Turkey time -> 4h12m9s left until midnight).
const NOW = () => new Date('2026-10-08T16:47:51.000Z');

function statusFor(state: TodayStatus['state']): TodayStatus {
  return { displayedStreak: 0, state };
}

describe('DailyCard', () => {
  // The decorative CTA Button and icon tile use importantForAccessibility
  // "no-hide-descendants" (CA2/CA3); see through it here like DepthTile's tests.
  beforeAll(() => configure({ defaultIncludeHiddenElements: true }));
  afterAll(() => resetToDefaults());

  it('should show the not-started status chip and a primary "Oyna" CTA, with no countdown, when the daily game has not started', async () => {
    await renderWithTheme(<DailyCard wordLength={WORD_LENGTH} status={statusFor({ kind: 'not-started' })} now={NOW} onPress={() => undefined} />);
    expect(screen.getByText('Yeni kelime hazır')).toBeTruthy();
    expect(screen.queryByText(COUNTDOWN)).toBeNull();
    expect(flattenStyle(screen.getByText('Oyna').props.style).color).toBe(themes.light.brandFg);
  });

  it('should show the in-progress guess count and a primary "Devam et" CTA, with no countdown, when the daily game is in progress', async () => {
    await renderWithTheme(<DailyCard wordLength={WORD_LENGTH} status={statusFor({ kind: 'in-progress', guesses: 2 })} now={NOW} onPress={() => undefined} />);
    expect(screen.getByText('2/6 tahmin')).toBeTruthy();
    expect(screen.queryByText(COUNTDOWN)).toBeNull();
    expect(flattenStyle(screen.getByText('Devam et').props.style).color).toBe(themes.light.brandFg);
  });

  it('should show the solved status in correctText, the countdown, and a secondary "Sonucu gör" CTA, when the daily game is won', async () => {
    await renderWithTheme(<DailyCard wordLength={WORD_LENGTH} status={statusFor({ kind: 'won', guesses: 3 })} now={NOW} onPress={() => undefined} />);
    expect(flattenStyle(screen.getByText('Çözüldü · 3/6').props.style).color).toBe(themes.light.correctText);
    expect(screen.getByText(COUNTDOWN)).toBeTruthy();
    expect(flattenStyle(screen.getByText('Sonucu gör').props.style).color).toBe(themes.light.text);
  });

  it('should show the lost status (not in correctText), the countdown, and a secondary "Sonucu gör" CTA, when the daily game is lost', async () => {
    await renderWithTheme(<DailyCard wordLength={WORD_LENGTH} status={statusFor({ kind: 'lost' })} now={NOW} onPress={() => undefined} />);
    expect(flattenStyle(screen.getByText('Bu sefer olmadı').props.style).color).not.toBe(themes.light.correctText);
    expect(screen.getByText(COUNTDOWN)).toBeTruthy();
    expect(flattenStyle(screen.getByText('Sonucu gör').props.style).color).toBe(themes.light.text);
  });

  it('should advance the countdown on a tick when the daily game is lost', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-10-08T16:47:51.000Z'));
    try {
      await renderWithTheme(<DailyCard wordLength={WORD_LENGTH} status={statusFor({ kind: 'lost' })} now={() => new Date()} onPress={() => undefined} />);
      const countdownPattern = /^\d{2}:\d{2}:\d{2}$/;
      const firstCountdown = screen.getByText(countdownPattern).props.children;

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      const nextCountdown = screen.getByText(countdownPattern).props.children;
      expect(nextCountdown).not.toBe(firstCountdown);
    } finally {
      jest.useRealTimers();
    }
  });

  it('should default to a primary "Oyna" CTA and no status chips while status is still loading', async () => {
    await renderWithTheme(<DailyCard wordLength={WORD_LENGTH} status={null} now={NOW} onPress={() => undefined} />);
    expect(screen.getByText('Oyna')).toBeTruthy();
    expect(screen.queryByText('Yeni kelime hazır')).toBeNull();
    expect(screen.queryByText(COUNTDOWN)).toBeNull();
  });

  it.each([
    [{ kind: 'not-started' as const }, `Günlük oyun, ${WORD_LENGTH} harf, yeni kelime hazır`],
    [{ kind: 'in-progress' as const, guesses: 2 }, `Günlük oyun, ${WORD_LENGTH} harf, 2/6 tahmin`],
    [{ kind: 'won' as const, guesses: 3 }, `Günlük oyun, ${WORD_LENGTH} harf, bugün çözüldü, 3/6`],
    [{ kind: 'lost' as const }, `Günlük oyun, ${WORD_LENGTH} harf, bugün çözülemedi`],
  ])('should carry the state in the card accessibilityLabel for %o', async (state, expectedLabel) => {
    await renderWithTheme(<DailyCard wordLength={WORD_LENGTH} status={statusFor(state)} now={NOW} onPress={() => undefined} />);
    expect(screen.getByLabelText(expectedLabel)).toBeTruthy();
  });

  it('should call onPress when the card is pressed', async () => {
    const onPress = jest.fn();
    await renderWithTheme(<DailyCard wordLength={WORD_LENGTH} status={statusFor({ kind: 'not-started' })} now={NOW} onPress={onPress} />);
    fireEvent.press(screen.getByTestId('home-daily-card'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
