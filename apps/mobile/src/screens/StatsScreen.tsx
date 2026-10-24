import { ArrowLeft } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getTodayString } from '@harfhane/shared';
import { useTheme } from '../ThemeProvider';
import { Card } from '../ui/Card';
import { IconButton } from '../ui/IconButton';
import { TopBar } from '../ui/TopBar';
import { AppText } from '../ui/Typography';
import { DISTRIBUTION_COUNT_MAX_FONT_SCALE, DISTRIBUTION_COUNT_WIDTH, FONT_SIZE, ICON_SIZE, RADIUS, SCREEN_PADDING, SPACING, TOUCH_TARGET } from '../ui/layout';
import { getDisplayedStreak } from '../home/today-status';
import type { DailyStats, UnlimitedStats, WordLength } from '../stats/stats';
import { winPercentage } from '../stats/win-percentage';

export type StatsMode = 'daily' | 'unlimited';

export interface StatsScreenProps {
  readonly stats: DailyStats | UnlimitedStats;
  readonly isUnlimited: boolean;
  readonly wordLength: WordLength;
  readonly mode: StatsMode;
  readonly onModeChange: (mode: StatsMode) => void;
  readonly onClose: () => void;
  /** mobile-redesign-spec.md section B: the same `getDisplayedStreak` the home screen uses; defaults to the real Turkey day. */
  readonly today?: string;
}

const PERCENT_MULTIPLIER = 100;
const MIN_BAR_WIDTH_PERCENT = 8;
const BAR_HEIGHT = 24;
const BAR_MIN_WIDTH = 28;
const BAR_NUMBER_WIDTH = 16;
const BAR_RADIUS = 4;
const TITLE = 'İstatistikler';
const STAT_CARD_PADDING = SPACING.md;
const STAT_CARD_WIDTH_PERCENT = '48%';
const STAT_CARD_MIN_HEIGHT = 72;
const DISTRIBUTION_TITLE = 'Tahmin dağılımı';

interface ModeOption {
  readonly value: StatsMode;
  readonly label: string;
}

const MODE_OPTIONS: readonly ModeOption[] = [
  { value: 'daily', label: 'Günlük' },
  { value: 'unlimited', label: 'Sınırsız' },
];

function isDailyStats(stats: DailyStats | UnlimitedStats): stats is DailyStats {
  return 'currentStreak' in stats;
}

function chipText(isUnlimited: boolean, wordLength: WordLength): string {
  return isUnlimited ? `Sınırsız · ${wordLength} harf` : `${wordLength} harf`;
}

interface ModeSegmentProps {
  readonly value: StatsMode;
  readonly label: string;
  readonly isActive: boolean;
  readonly onSelect: (value: StatsMode) => void;
}

function ModeSegment({ value, label, isActive, onSelect }: ModeSegmentProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: isActive }}
      onPress={() => onSelect(value)}
      style={[styles.segment, { backgroundColor: isActive ? colors.brand : colors.surface }]}
    >
      <Text style={[styles.segmentLabel, { color: isActive ? colors.brandFg : colors.text }]}>{label}</Text>
    </Pressable>
  );
}

interface ModeToggleProps {
  readonly mode: StatsMode;
  readonly onModeChange: (mode: StatsMode) => void;
}

function ModeToggle({ mode, onModeChange }: ModeToggleProps) {
  return (
    <View style={styles.segmentedControl}>
      {MODE_OPTIONS.map((option) => (
        <ModeSegment key={option.value} value={option.value} label={option.label} isActive={mode === option.value} onSelect={onModeChange} />
      ))}
    </View>
  );
}

interface StatCardProps {
  readonly testID: string;
  readonly value: number;
  readonly label: string;
}

/** A static (non-pressable) stat tile (mobile-ui-standard.md D3: no depth on static content). */
function StatCard({ testID, value, label }: StatCardProps) {
  const { colors } = useTheme();
  return (
    <Card padding={STAT_CARD_PADDING} testID={`${testID}-card`} style={styles.statCard}>
      <AppText testID={testID} role="title">
        {value}
      </AppText>
      <AppText role="caption" color={colors.textMuted}>
        {label}
      </AppText>
    </Card>
  );
}

function StatsGrid({ stats, isUnlimited, today }: { readonly stats: DailyStats | UnlimitedStats; readonly isUnlimited: boolean; readonly today: string }) {
  return (
    <View style={styles.statsGrid}>
      <StatCard testID="stat-Oyun" value={stats.gamesPlayed} label="Oyun" />
      <StatCard testID="stat-Kazanma %" value={winPercentage(stats)} label="Kazanma %" />
      {!isUnlimited && isDailyStats(stats) && (
        <>
          <StatCard testID="stat-Seri" value={getDisplayedStreak(stats, today)} label="Seri" />
          <StatCard testID="stat-En İyi Seri" value={stats.maxStreak} label="En iyi seri" />
        </>
      )}
      {isUnlimited && <StatCard testID="stat-Kazanılan" value={stats.gamesWon} label="Kazanılan" />}
    </View>
  );
}

export function StatsScreen({ stats, isUnlimited, wordLength, mode, onModeChange, onClose, today = getTodayString() }: StatsScreenProps) {
  const { colors } = useTheme();
  const maxDistribution = Math.max(...stats.guessDistribution, 1);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <TopBar
        title={TITLE}
        chip={chipText(isUnlimited, wordLength)}
        leading={<IconButton icon={<ArrowLeft size={ICON_SIZE.lg} color={colors.text} />} accessibilityLabel="Geri" onPress={onClose} />}
      />
      <View style={styles.body}>
        <ModeToggle mode={mode} onModeChange={onModeChange} />

        <StatsGrid stats={stats} isUnlimited={isUnlimited} today={today} />

        <View style={styles.distributionGroup}>
          <AppText role="caption" weight="700" color={colors.textMuted}>
            {DISTRIBUTION_TITLE}
          </AppText>
          <View style={styles.distribution}>
            {stats.guessDistribution.map((count, index) => (
              <DistributionBar key={index} count={count} guessNumber={index + 1} maxDistribution={maxDistribution} />
            ))}
          </View>
        </View>

        {stats.gamesPlayed === 0 && (
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            İlk oyununuzu tamamladığınızda istatistikler burada görünecek.
          </Text>
        )}
      </View>
    </View>
  );
}

interface DistributionBarProps {
  readonly count: number;
  readonly guessNumber: number;
  readonly maxDistribution: number;
}

function DistributionBar({ count, guessNumber, maxDistribution }: DistributionBarProps) {
  const { colors } = useTheme();
  const widthPercent =
    maxDistribution > 0 ? Math.max((count / maxDistribution) * PERCENT_MULTIPLIER, count > 0 ? MIN_BAR_WIDTH_PERCENT : 0) : 0;

  return (
    <View style={styles.barRow}>
      <Text style={[styles.barNumber, { color: colors.textMuted }]}>{guessNumber}</Text>
      <View style={styles.barTrack}>
        <View testID={`stats-distribution-${guessNumber}-fill`} style={[styles.barFill, { backgroundColor: colors.correct, width: `${widthPercent}%` }]} />
      </View>
      {/* mobile-ui-standard.md C2: a 12 dp count inside the `correct` fill is 4.29-4.33:1, below
          4.5:1 — it sits outside the fill in `text` instead, against `bg`. Always rendered
          (empty when there is no count) so every row reserves the same fixed-width slot and
          the tracks next to it stay comparable widths. */}
      <Text
        testID={`stats-distribution-${guessNumber}-count`}
        numberOfLines={1}
        maxFontSizeMultiplier={DISTRIBUTION_COUNT_MAX_FONT_SCALE}
        accessibilityElementsHidden={!(count > 0)}
        importantForAccessibility={count > 0 ? 'auto' : 'no-hide-descendants'}
        style={[styles.barCount, { color: colors.text }]}>
        {count > 0 ? count : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { flex: 1, paddingHorizontal: SCREEN_PADDING, paddingTop: SPACING.sm, paddingBottom: SCREEN_PADDING, gap: SPACING.xxl },
  segmentedControl: { flexDirection: 'row', gap: SPACING.sm },
  segment: { flex: 1, minHeight: TOUCH_TARGET, borderRadius: RADIUS.md, paddingVertical: SPACING.md, alignItems: 'center', justifyContent: 'center' },
  segmentLabel: { fontSize: FONT_SIZE.body, fontWeight: '700' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: SPACING.md },
  statCard: { width: STAT_CARD_WIDTH_PERCENT, minHeight: STAT_CARD_MIN_HEIGHT, alignItems: 'center', justifyContent: 'center' },
  distributionGroup: { gap: SPACING.sm },
  distribution: { gap: SPACING.sm },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  barNumber: { width: BAR_NUMBER_WIDTH, textAlign: 'right', fontSize: FONT_SIZE.caption },
  barTrack: { flex: 1, height: BAR_HEIGHT },
  barFill: { minWidth: BAR_MIN_WIDTH, height: BAR_HEIGHT, borderRadius: BAR_RADIUS },
  barCount: { fontSize: FONT_SIZE.caption, fontWeight: '700', width: DISTRIBUTION_COUNT_WIDTH, textAlign: 'right' },
  emptyText: { fontSize: FONT_SIZE.caption, textAlign: 'center' },
});
