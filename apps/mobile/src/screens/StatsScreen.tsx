import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../ThemeProvider';
import { FONT_SIZE, RADIUS, SPACING } from '../ui/layout';
import type { DailyStats, UnlimitedStats } from '../stats/stats';

export interface StatsScreenProps {
  readonly stats: DailyStats | UnlimitedStats;
  readonly isUnlimited: boolean;
  readonly onClose: () => void;
}

const PERCENT_MULTIPLIER = 100;
const MIN_BAR_WIDTH_PERCENT = 8;
const STAT_VALUE_FONT_SIZE = 26;
const BAR_HEIGHT = 24;
const BAR_MIN_WIDTH = 28;
const BAR_NUMBER_WIDTH = 16;
const BAR_RADIUS = 4;

function winPercentage(stats: DailyStats | UnlimitedStats): number {
  if (stats.gamesPlayed === 0) return 0;
  return Math.round((stats.gamesWon / stats.gamesPlayed) * PERCENT_MULTIPLIER);
}

function isDailyStats(stats: DailyStats | UnlimitedStats): stats is DailyStats {
  return 'currentStreak' in stats;
}

export function StatsScreen({ stats, isUnlimited, onClose }: StatsScreenProps) {
  const { colors } = useTheme();
  const maxDistribution = Math.max(...stats.guessDistribution, 1);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        {isUnlimited ? 'Sınırsız Mod İstatistikleri' : 'İstatistikler'}
      </Text>

      <View style={styles.statsRow}>
        <StatBox value={stats.gamesPlayed} label="Oyun" />
        <StatBox value={winPercentage(stats)} label="Kazanma %" />
        {!isUnlimited && isDailyStats(stats) && (
          <>
            <StatBox value={stats.currentStreak} label="Seri" />
            <StatBox value={stats.maxStreak} label="En İyi Seri" />
          </>
        )}
        {isUnlimited && <StatBox value={stats.gamesWon} label="Kazanılan" />}
      </View>

      <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Tahmin Dağılımı</Text>
      <View style={styles.distribution}>
        {stats.guessDistribution.map((count, index) => (
          <DistributionBar key={index} count={count} guessNumber={index + 1} maxDistribution={maxDistribution} />
        ))}
      </View>

      {stats.gamesPlayed === 0 && (
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
          İlk oyununuzu tamamladığınızda istatistikler burada görünecek.
        </Text>
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Kapat"
        onPress={onClose}
        style={[styles.closeButton, { backgroundColor: colors.correct }]}
      >
        <Text style={[styles.closeLabel, { color: colors.correctFg }]}>Kapat</Text>
      </Pressable>
    </View>
  );
}

interface StatBoxProps {
  readonly value: number;
  readonly label: string;
}

function StatBox({ value, label }: StatBoxProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.statBox}>
      <Text testID={`stat-${label}`} style={[styles.statValue, { color: colors.text }]}>
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
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
        <View style={[styles.barFill, { backgroundColor: colors.correct, width: `${widthPercent}%` }]}>
          <Text style={[styles.barCount, { color: colors.correctFg }]}>{count}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.xl,
    gap: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZE.title,
    fontWeight: '800',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: STAT_VALUE_FONT_SIZE,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: FONT_SIZE.caption,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  distribution: {
    gap: SPACING.sm,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  barNumber: {
    width: BAR_NUMBER_WIDTH,
    textAlign: 'right',
    fontSize: FONT_SIZE.caption,
  },
  barTrack: {
    flex: 1,
    height: BAR_HEIGHT,
  },
  barFill: {
    minWidth: BAR_MIN_WIDTH,
    height: BAR_HEIGHT,
    borderRadius: BAR_RADIUS,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: SPACING.sm,
  },
  barCount: {
    fontSize: FONT_SIZE.caption,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: FONT_SIZE.caption,
    textAlign: 'center',
  },
  closeButton: {
    marginTop: 'auto',
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  closeLabel: {
    fontSize: FONT_SIZE.bodyLarge,
    fontWeight: '700',
  },
});
