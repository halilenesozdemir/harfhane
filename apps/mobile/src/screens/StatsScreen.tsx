import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../ThemeProvider';
import type { DailyStats, UnlimitedStats } from '../stats/stats';

export interface StatsScreenProps {
  readonly stats: DailyStats | UnlimitedStats;
  readonly isUnlimited: boolean;
  readonly onClose: () => void;
}

const PERCENT_MULTIPLIER = 100;
const MIN_BAR_WIDTH_PERCENT = 8;

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
    padding: 20,
    gap: 16,
  },
  title: {
    fontSize: 20,
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
    fontSize: 26,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  distribution: {
    gap: 6,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  barNumber: {
    width: 16,
    textAlign: 'right',
    fontSize: 13,
  },
  barTrack: {
    flex: 1,
    height: 24,
  },
  barFill: {
    minWidth: 28,
    height: 24,
    borderRadius: 4,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  barCount: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
  },
  closeButton: {
    marginTop: 'auto',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
});
