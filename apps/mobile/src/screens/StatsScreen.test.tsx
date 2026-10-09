import { act, fireEvent, screen, within } from '@testing-library/react-native';
import { StatsScreen } from './StatsScreen';
import { renderWithTheme, flattenStyle } from '../test-utils/render-with-theme';
import { createInitialDailyStats, createInitialUnlimitedStats } from '../stats/stats';
import { getThemeColors } from '../theme';
import { DISTRIBUTION_COUNT_MAX_FONT_SCALE, DISTRIBUTION_COUNT_WIDTH, TOUCH_TARGET } from '../ui/layout';

const TODAY = '2026-10-08';
const TWO_DAYS_AGO = '2026-10-06';
const COLORS = getThemeColors({ scheme: 'light', isHighContrast: false });

function renderDailyStats(overrides: Partial<Parameters<typeof StatsScreen>[0]> = {}) {
  return renderWithTheme(
    <StatsScreen
      stats={createInitialDailyStats()}
      isUnlimited={false}
      wordLength={5}
      mode="daily"
      onModeChange={() => undefined}
      onClose={() => undefined}
      {...overrides}
    />,
  );
}

interface RenderedNode {
  readonly type: string;
  readonly props: { readonly style?: unknown };
  readonly children?: readonly (RenderedNode | string)[] | null;
}

function collectTextTransforms(node: RenderedNode | string | null): unknown[] {
  if (node === null || typeof node === 'string') return [];
  const children = node.children ?? [];
  const own = node.type === 'Text' ? [flattenStyle(node.props.style).textTransform] : [];
  return [...own, ...children.flatMap((child) => collectTextTransforms(child))];
}

describe('StatsScreen', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('should show win percentage, streak and distribution for daily stats', async () => {
    const stats = {
      ...createInitialDailyStats(),
      gamesPlayed: 8,
      gamesWon: 4,
      currentStreak: 2,
      maxStreak: 5,
      lastPlayedDate: TODAY,
      guessDistribution: [0, 1, 1, 0, 0, 0],
    };
    await renderDailyStats({ stats, today: TODAY });
    expect(screen.getByLabelText('İstatistikler, 5 harf')).toBeTruthy();
    expect(screen.getByTestId('stat-Oyun').props.children).toBe(8);
    expect(screen.getByTestId('stat-Kazanma %').props.children).toBe(50);
    expect(screen.getByTestId('stat-Seri').props.children).toBe(2);
    expect(screen.getByTestId('stat-En İyi Seri').props.children).toBe(5);
    expect(screen.getByText('Oyun')).toBeTruthy();
    expect(screen.getByText('Seri')).toBeTruthy();
  });

  it('should show zero streak instead of the raw stored value when the last played date is stale', async () => {
    const stats = { ...createInitialDailyStats(), currentStreak: 2, maxStreak: 5, lastPlayedDate: TWO_DAYS_AGO };
    await renderDailyStats({ stats, today: TODAY });
    expect(screen.getByTestId('stat-Seri').props.children).toBe(0);
    expect(screen.getByTestId('stat-En İyi Seri').props.children).toBe(5);
  });

  it('should use the Turkey day (not the UTC day) for the default today when not given', async () => {
    jest.useFakeTimers();
    // 22:00 UTC on 2026-10-08 is 01:00 on 2026-10-09 in Turkey (UTC+3).
    jest.setSystemTime(new Date('2026-10-08T22:00:00Z'));
    const stats = { ...createInitialDailyStats(), currentStreak: 4, maxStreak: 5, lastPlayedDate: '2026-10-09' };
    await renderDailyStats({ stats });
    expect(screen.getByTestId('stat-Seri').props.children).toBe(4);
  });

  it('should show the games won total instead of a streak for unlimited stats, with the mode in the chip', async () => {
    const stats = { ...createInitialUnlimitedStats(), gamesPlayed: 2, gamesWon: 2 };
    await renderDailyStats({ stats, isUnlimited: true, mode: 'unlimited' });
    expect(screen.getByLabelText('İstatistikler, Sınırsız · 5 harf')).toBeTruthy();
    expect(screen.getByTestId('stat-Kazanılan').props.children).toBe(2);
    expect(screen.queryByTestId('stat-Seri')).toBeNull();
    expect(screen.getByText('Kazanılan')).toBeTruthy();
  });

  it('should show the empty state message when no game has been played', async () => {
    await renderDailyStats();
    expect(screen.getByText('İlk oyununuzu tamamladığınızda istatistikler burada görünecek.')).toBeTruthy();
  });

  it('should call onClose when the back button is pressed', async () => {
    const onClose = jest.fn();
    await renderDailyStats({ onClose });
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Geri'));
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onModeChange when the Sınırsız segment is pressed', async () => {
    const onModeChange = jest.fn();
    await renderDailyStats({ onModeChange });
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Sınırsız'));
    });
    expect(onModeChange).toHaveBeenCalledWith('unlimited');
  });

  it('should render the distribution count outside the coloured fill, in `text` (mobile-ui-standard.md C2)', async () => {
    const stats = { ...createInitialDailyStats(), gamesPlayed: 1, gamesWon: 1, guessDistribution: [0, 1, 0, 0, 0, 0] };
    await renderDailyStats({ stats });
    const fill = screen.getByTestId('stats-distribution-2-fill');
    expect(within(fill).queryByText('1')).toBeNull();
    const count = screen.getByTestId('stats-distribution-2-count');
    expect(count).toHaveTextContent('1');
    expect(flattenStyle(count.props.style)['color']).toBe(COLORS.text);
  });

  it('should reserve a fixed, three-digit-wide count slot with a capped font scale when rows have counts', async () => {
    const stats = { ...createInitialUnlimitedStats(), gamesPlayed: 120, gamesWon: 120, guessDistribution: [0, 0, 0, 120, 0, 0] };
    await renderWithTheme(<StatsScreen stats={stats} isUnlimited={true} wordLength={5} mode="unlimited" onModeChange={() => undefined} onClose={() => undefined} />);
    for (const guessNumber of [1, 4]) {
      const count = screen.getByTestId(`stats-distribution-${guessNumber}-count`, { includeHiddenElements: true });
      expect(flattenStyle(count.props.style).width).toBe(DISTRIBUTION_COUNT_WIDTH);
      expect(count.props.maxFontSizeMultiplier).toBe(DISTRIBUTION_COUNT_MAX_FONT_SCALE);
      expect(count.props.numberOfLines).toBe(1);
    }
    expect(screen.getByTestId('stats-distribution-1-count', { includeHiddenElements: true }).props.accessibilityElementsHidden).toBe(true);
    expect(screen.getByTestId('stats-distribution-4-count').props.accessibilityElementsHidden).toBe(false);
  });

  it('should render an empty count slot when a guess row has zero games (011-U7b-C2)', async () => {
    const stats = { ...createInitialDailyStats(), gamesPlayed: 1, gamesWon: 1, guessDistribution: [0, 1, 0, 0, 0, 0] };
    await renderDailyStats({ stats });
    expect(screen.getByTestId('stats-distribution-1-count', { includeHiddenElements: true })).toHaveTextContent('');
  });

  it('should lay out the stat cards as a 2-column grid and render the exact Turkish labels', async () => {
    const stats = { ...createInitialDailyStats(), gamesPlayed: 8, gamesWon: 4, currentStreak: 2, maxStreak: 5, lastPlayedDate: TODAY };
    await renderDailyStats({ stats, today: TODAY });
    const card = flattenStyle(screen.getByTestId('stat-Oyun-card').props.style);
    expect(card.width).toBe('48%');
    expect(card.minHeight).toBeGreaterThanOrEqual(72);
    expect(card.alignItems).toBe('center');
    expect(screen.getByText('Tahmin dağılımı')).toBeTruthy();
    expect(screen.getByText('En iyi seri')).toBeTruthy();
    expect(screen.getByText('Kazanma %')).toBeTruthy();
  });

  it('should not use textTransform uppercase on any text in StatsScreen (Turkish casing)', async () => {
    const stats = { ...createInitialDailyStats(), gamesPlayed: 8, gamesWon: 4, currentStreak: 2, maxStreak: 5, lastPlayedDate: TODAY };
    const view = await renderDailyStats({ stats, today: TODAY });
    const roots = view.toJSON() as RenderedNode | readonly RenderedNode[] | null;
    const transforms = (Array.isArray(roots) ? roots : [roots]).flatMap((node) => collectTextTransforms(node));
    expect(transforms).not.toContain('uppercase');
  });

  it('should mark the active mode segment as selected, brand-coloured and at least 48 dp tall (011-A1)', async () => {
    await renderDailyStats();
    const daily = screen.getByLabelText('Günlük');
    const unlimited = screen.getByLabelText('Sınırsız');
    expect(daily.props.accessibilityState.selected).toBe(true);
    expect(unlimited.props.accessibilityState.selected).toBe(false);
    expect(flattenStyle(daily.props.style).backgroundColor).toBe(COLORS.brand);
    expect(flattenStyle(unlimited.props.style).backgroundColor).not.toBe(COLORS.brand);
    expect(flattenStyle(daily.props.style).minHeight).toBe(TOUCH_TARGET);
  });
});
