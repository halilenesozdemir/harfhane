import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../ThemeProvider';
import { FONT_SIZE, RADIUS, SPACING } from '../ui/layout';
import type { KeyValueStore } from '../game/game-storage';
import type { GameMode } from '../game/game-session';
import type { WordLength } from '../stats/stats';
import { loadDailyStats, loadUnlimitedStats, recordDailyResult, recordUnlimitedResult } from '../stats/stats';
import type { FinishedGameStatus } from './gameOverMessages';

const DISTRIBUTION_LABEL = 'Tahmin dağılımı';
const MIN_BAR_PERCENT = 8;

export function useDisplayDistribution(
  store: KeyValueStore,
  mode: GameMode,
  wordLength: WordLength,
  gameStatus: FinishedGameStatus,
  guessCount: number,
  dailyDate: string | null,
  today: () => string,
): readonly number[] | null {
  const [distribution, setDistribution] = useState<readonly number[] | null>(null);
  useEffect(() => {
    let isCurrent = true;
    const won = gameStatus === 'won';
    // Reopening an already-finished daily game (Geri, then back in) remounts this card after
    // useResultRecorder already saved the result once. Recording it again here would double-count
    // the just-played guess count's bar, so a daily game whose stored lastPlayedDate already
    // matches this one is shown as-is, not re-added. Unlimited has no persisted "reopen a
    // finished game" path (a fresh mount always starts a brand-new word), so it always adds —
    // there is nothing stored yet to double-count against.
    const load = (mode === 'daily'
      ? loadDailyStats(store, wordLength).then((stats) => {
          const date = dailyDate ?? today();
          return stats.lastPlayedDate === date ? stats.guessDistribution : recordDailyResult(stats, won, guessCount, date).guessDistribution;
        })
      : loadUnlimitedStats(store, wordLength).then((stats) => recordUnlimitedResult(stats, won, guessCount).guessDistribution)
    // A rejected AsyncStorage read (I/O error, corrupt native module) must not become an unhandled
    // promise rejection: the card simply renders without a distribution section (null), the same
    // as while the read is still pending.
    ).catch(() => null);
    load.then((value) => isCurrent && setDistribution(value));
    return () => {
      isCurrent = false;
    };
  }, [store, mode, wordLength, gameStatus, guessCount, dailyDate, today]);
  return distribution;
}

interface DistributionRowProps {
  readonly guessNumber: number;
  readonly count: number;
  readonly maxCount: number;
  readonly isHighlighted: boolean;
}

export function DistributionRow({ guessNumber, count, maxCount, isHighlighted }: DistributionRowProps) {
  const { colors } = useTheme();
  const hasCount = count > 0;
  const fill = isHighlighted ? colors.correct : colors.brand;
  // The count text's foreground must match its own fill's *Fg token (mobile-ui-standard.md
  // C1/C2): brandFg on brand, correctFg on correct — using brandFg on a correct fill is both
  // a token mismatch and fails contrast (4.13:1 in dark).
  const countTextColor = isHighlighted ? colors.correctFg : colors.brandFg;
  return (
    <View testID={`gameover-distribution-${guessNumber}`} style={styles.distributionRow}>
      <Text style={[styles.distributionIndex, { color: colors.textMuted }]}>{guessNumber}</Text>
      <View style={[styles.distributionTrack, { backgroundColor: colors.tileEmptyBg }]}>
        {hasCount && (
          <View
            testID={`gameover-distribution-${guessNumber}-fill`}
            style={[
              styles.distributionFill,
              { width: `${Math.max((count / maxCount) * 100, MIN_BAR_PERCENT)}%`, backgroundColor: fill },
            ]}
          >
            <Text style={[styles.distributionCount, { color: countTextColor }]}>{count}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

export interface DistributionProps {
  readonly distribution: readonly number[];
  readonly gameStatus: FinishedGameStatus;
  readonly guessCount: number;
}

export function Distribution({ distribution, gameStatus, guessCount }: DistributionProps) {
  const { colors } = useTheme();
  const maxCount = Math.max(...distribution, 1);
  // Only a win highlights a bar — a loss never finished on a particular guess count, so
  // "guessCount === index + 1" alone (without the gameStatus check) would wrongly highlight
  // whichever row happens to number-match the player's guess count on a loss.
  const isWon = gameStatus === 'won';
  return (
    <View style={styles.distribution}>
      <Text style={[styles.distributionLabel, { color: colors.textMuted }]}>{DISTRIBUTION_LABEL}</Text>
      {distribution.map((count, index) => (
        <DistributionRow
          key={index}
          guessNumber={index + 1}
          count={count}
          maxCount={maxCount}
          isHighlighted={isWon && guessCount === index + 1}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  distribution: { gap: SPACING.xs },
  // No textTransform: 'uppercase' — React Native's uppercase transform is locale-unaware, so the
  // dotted "i" in "Tahmin" becomes a dotless "I" ("TAHMIN") instead of the correct Turkish "İ"
  // ("TAHMİN"). Writing the literal string avoids this (same rule as .toUpperCase() in code).
  distributionLabel: { fontSize: FONT_SIZE.caption, fontWeight: '700' },
  distributionRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  distributionIndex: { fontSize: FONT_SIZE.caption, fontWeight: '700', width: SPACING.md },
  distributionTrack: { flex: 1, height: SPACING.lg, borderRadius: RADIUS.xs, overflow: 'hidden' },
  distributionFill: { height: '100%', alignItems: 'flex-end', justifyContent: 'center', paddingHorizontal: SPACING.xs },
  distributionCount: { fontSize: FONT_SIZE.caption, fontWeight: '700' },
});
