import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../ThemeProvider';
import { DISTRIBUTION_COUNT_MAX_FONT_SCALE, DISTRIBUTION_COUNT_WIDTH, FONT_SIZE, RADIUS, SPACING } from '../ui/layout';
import type { KeyValueStore } from '../game/game-storage';
import type { GameMode } from '../game/game-session';
import type { WordLength } from '../stats/stats';
import { loadDailyStats, loadUnlimitedStats, recordDailyResult } from '../stats/stats';
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
  // useResultRecorder's own computed result for a game that *just* finished this session — using
  // it directly, instead of reading storage, closes a race: GameOverCard can mount in the same
  // commit as the game finishing (under reduce motion, where there is no reveal/bounce gate), and
  // React runs a child's effect before its parent's, so this hook's own storage read could run
  // before useResultRecorder's write landed, showing the just-played game's bar as empty. null
  // means either that write hasn't resolved yet (briefly, right after a just-played finish) or
  // there was no write this session at all (a restored, already-finished game) — both fall back
  // to reading storage below, same as before.
  recordedDistribution: readonly number[] | null,
): readonly number[] | null {
  const [loadedDistribution, setLoadedDistribution] = useState<readonly number[] | null>(null);
  useEffect(() => {
    // recordedDistribution already has the answer — nothing to load, and no storage read can
    // ever win or lose a race against it below (it is returned directly, not copied into state).
    if (recordedDistribution !== null) return undefined;
    let isCurrent = true;
    const won = gameStatus === 'won';
    // Reopening an already-finished daily game (Geri, then back in) reads the same already-stored
    // bar. An unlimited game never persists a "reopen a finished game" state (a fresh mount
    // always starts a brand-new word), so this storage-read path for unlimited only runs for the
    // brief window before useResultRecorder's own write resolves (recordedDistribution above is
    // what lands moments later).
    const load = (mode === 'daily'
      ? loadDailyStats(store, wordLength).then((stats) => {
          const date = dailyDate ?? today();
          return stats.lastPlayedDate === date ? stats.guessDistribution : recordDailyResult(stats, won, guessCount, date).guessDistribution;
        })
      : loadUnlimitedStats(store, wordLength).then((stats) => stats.guessDistribution)
    // A rejected AsyncStorage read (I/O error, corrupt native module) must not become an unhandled
    // promise rejection: the card simply renders without a distribution section (null), the same
    // as while the read is still pending.
    ).catch(() => null);
    load.then((value) => isCurrent && setLoadedDistribution(value));
    return () => {
      isCurrent = false;
    };
  }, [store, mode, wordLength, gameStatus, guessCount, dailyDate, today, recordedDistribution]);
  return recordedDistribution ?? loadedDistribution;
}

// Mirrors useDisplayDistribution's own fallback story, for the daily streak shown in the share
// footer: useResultRecorder's own just-recorded value wins (no race, no storage read needed);
// otherwise (a restored, already-finished daily game) this reads storage directly. Unlimited has
// no streak concept, so it is always null there.
export function useDisplayStreak(
  store: KeyValueStore,
  mode: GameMode,
  wordLength: WordLength,
  recordedStreak: number | null,
): number | null {
  const [loadedStreak, setLoadedStreak] = useState<number | null>(null);
  useEffect(() => {
    if (recordedStreak !== null || mode !== 'daily') return undefined;
    let isCurrent = true;
    loadDailyStats(store, wordLength)
      .then((stats) => stats.currentStreak)
      .catch(() => null)
      .then((value) => isCurrent && setLoadedStreak(value));
    return () => {
      isCurrent = false;
    };
  }, [store, mode, wordLength, recordedStreak]);
  return mode === 'daily' ? recordedStreak ?? loadedStreak : null;
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
          />
        )}
      </View>
      {/* mobile-ui-standard.md C2: a 12 dp caption on `correct`/`brand` fails text contrast
          (correctFg on correct is 4.33:1); the count sits outside the fill in `text` instead,
          against the card's `surface`, which always clears 4.5:1. Always rendered (empty when
          there is no count) so every row reserves the same fixed-width slot and the tracks
          next to it stay comparable widths. */}
      <Text
        testID={`gameover-distribution-${guessNumber}-count`}
        numberOfLines={1}
        maxFontSizeMultiplier={DISTRIBUTION_COUNT_MAX_FONT_SCALE}
        accessibilityElementsHidden={!(hasCount)}
        importantForAccessibility={hasCount ? 'auto' : 'no-hide-descendants'}
        style={[styles.distributionCount, { color: colors.text }]}>
        {hasCount ? count : ''}
      </Text>
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
  distributionCount: { fontSize: FONT_SIZE.caption, fontWeight: '700', width: DISTRIBUTION_COUNT_WIDTH, textAlign: 'right' },
});
