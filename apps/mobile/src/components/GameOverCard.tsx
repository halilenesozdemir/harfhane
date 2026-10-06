import { useEffect, useMemo, useState } from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import type { TileStatus } from '@harfhane/shared';
import { generateShareText, getTimeUntilMidnight } from '@harfhane/shared';
import { useTheme } from '../ThemeProvider';
import { FONT_SIZE, RADIUS, SPACING } from '../ui/layout';
import type { KeyValueStore } from '../game/game-storage';
import type { GameMode } from '../game/game-session';
import type { WordLength } from '../stats/stats';
import { loadDailyStats, loadUnlimitedStats, recordDailyResult, recordUnlimitedResult } from '../stats/stats';
import { dailyGameNumber, selectResultMessage } from './gameOverMessages';
import type { FinishedGameStatus } from './gameOverMessages';

export interface GameOverCardProps {
  readonly mode: GameMode;
  readonly wordLength: WordLength;
  readonly gameStatus: FinishedGameStatus;
  readonly solution: string;
  readonly guesses: readonly string[];
  readonly evaluations: readonly (readonly TileStatus[])[];
  readonly wordId: number | null;
  readonly dailyDate: string | null;
  readonly store: KeyValueStore;
  readonly today?: () => string;
  readonly onNewGame: () => void;
}

const UNLIMITED_MODE_TEXT = 'Sınırsız';
const COUNTDOWN_LABEL = 'Sonraki kelime';
const NEW_WORD_LABEL = 'Yeni kelime';
const SHARE_LABEL = 'Paylaş';
const ANSWER_LABEL = 'Kelime';
const DISTRIBUTION_LABEL = 'Tahmin dağılımı';
const COUNTDOWN_UPDATE_INTERVAL_MS = 1000;
const MIN_BAR_PERCENT = 8;

function useResultSeed(mode: GameMode, wordId: number | null, dailyDate: string | null, guessCount: number): number {
  return useMemo(() => {
    if (mode === 'daily' && dailyDate !== null) return dailyGameNumber(dailyDate);
    return wordId ?? guessCount;
  }, [mode, wordId, dailyDate, guessCount]);
}

function useDisplayDistribution(
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
    const load = mode === 'daily'
      ? loadDailyStats(store, wordLength).then((stats) => recordDailyResult(stats, won, guessCount, dailyDate ?? today()).guessDistribution)
      : loadUnlimitedStats(store, wordLength).then((stats) => recordUnlimitedResult(stats, won, guessCount).guessDistribution);
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

function DistributionRow({ guessNumber, count, maxCount, isHighlighted }: DistributionRowProps) {
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
          >
            <Text style={[styles.distributionCount, { color: colors.brandFg }]}>{count}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

interface DistributionProps {
  readonly distribution: readonly number[];
  readonly gameStatus: FinishedGameStatus;
  readonly guessCount: number;
}

function Distribution({ distribution, gameStatus, guessCount }: DistributionProps) {
  const { colors } = useTheme();
  const maxCount = Math.max(...distribution, 1);
  return (
    <View style={styles.distribution}>
      <Text style={[styles.distributionLabel, { color: colors.textMuted }]}>{DISTRIBUTION_LABEL}</Text>
      {distribution.map((count, index) => (
        <DistributionRow
          key={index}
          guessNumber={index + 1}
          count={count}
          maxCount={maxCount}
          isHighlighted={gameStatus === 'won' && guessCount === index + 1}
        />
      ))}
    </View>
  );
}

function useCountdown(isEnabled: boolean): string {
  const [countdown, setCountdown] = useState(() => getTimeUntilMidnight());
  useEffect(() => {
    if (!isEnabled) return undefined;
    const timer = setInterval(() => setCountdown(getTimeUntilMidnight()), COUNTDOWN_UPDATE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [isEnabled]);
  return `${countdown.hours}:${countdown.minutes}:${countdown.seconds}`;
}

// A stable module-level reference: a fresh arrow function as the default parameter value would
// be re-created on every render, forever changing the useDisplayDistribution effect's dependency.
function defaultToday(): string {
  return new Date().toISOString().split('T')[0]!;
}

async function shareResult(shareText: string): Promise<void> {
  try {
    await Share.share({ message: shareText });
  } catch {
    // The user cancelling the native share sheet is not an error worth surfacing.
  }
}

export function GameOverCard({
  mode,
  wordLength,
  gameStatus,
  solution,
  guesses,
  evaluations,
  wordId,
  dailyDate,
  store,
  today = defaultToday,
  onNewGame,
}: GameOverCardProps) {
  const { colors } = useTheme();
  const guessCount = guesses.length;
  const seed = useResultSeed(mode, wordId, dailyDate, guessCount);
  const title = selectResultMessage(mode, gameStatus, guessCount, seed);
  const distribution = useDisplayDistribution(store, mode, wordLength, gameStatus, guessCount, dailyDate, today);
  const countdown = useCountdown(mode === 'daily');

  const modeText = mode === 'unlimited' ? UNLIMITED_MODE_TEXT : `#${dailyGameNumber(dailyDate ?? today())}`;
  const shareText = generateShareText(
    [...guesses],
    evaluations.map((row) => [...row]),
    modeText,
    gameStatus === 'won',
  );

  return (
    <View testID="gameover-card" style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {gameStatus === 'lost' && (
        <Text style={[styles.answer, { color: colors.correctText }]}>{`${ANSWER_LABEL}: ${solution}`}</Text>
      )}
      {distribution !== null && <Distribution distribution={distribution} gameStatus={gameStatus} guessCount={guessCount} />}
      <Pressable
        testID="gameover-share"
        accessibilityRole="button"
        accessibilityLabel={SHARE_LABEL}
        onPress={() => void shareResult(shareText)}
        style={[styles.shareButton, { backgroundColor: colors.brand }]}
      >
        <Text style={[styles.shareLabel, { color: colors.brandFg }]}>{SHARE_LABEL}</Text>
      </Pressable>
      {mode === 'daily' ? (
        <View style={styles.countdown}>
          <Text style={[styles.countdownCaption, { color: colors.textMuted }]}>{COUNTDOWN_LABEL}</Text>
          <Text testID="gameover-countdown" style={[styles.countdownValue, { color: colors.text }]}>{countdown}</Text>
        </View>
      ) : (
        <Pressable
          testID="gameover-new-word"
          accessibilityRole="button"
          accessibilityLabel={NEW_WORD_LABEL}
          onPress={onNewGame}
          style={[styles.newWordButton, { backgroundColor: colors.present }]}
        >
          <Text style={[styles.newWordLabel, { color: colors.presentFg }]}>{NEW_WORD_LABEL}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: RADIUS.lg, padding: SPACING.lg, gap: SPACING.md, alignItems: 'stretch' },
  title: { fontSize: FONT_SIZE.title, fontWeight: '800', textAlign: 'center' },
  answer: { fontSize: FONT_SIZE.bodyLarge, fontWeight: '700', textAlign: 'center' },
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
  shareButton: { paddingVertical: SPACING.md, borderRadius: RADIUS.md, alignItems: 'center' },
  shareLabel: { fontSize: FONT_SIZE.bodyLarge, fontWeight: '800' },
  countdown: { alignItems: 'center', gap: SPACING.xs },
  countdownCaption: { fontSize: FONT_SIZE.body },
  countdownValue: { fontSize: FONT_SIZE.title, fontWeight: '800', fontVariant: ['tabular-nums'] },
  newWordButton: { paddingVertical: SPACING.md, borderRadius: RADIUS.md, alignItems: 'center' },
  newWordLabel: { fontSize: FONT_SIZE.bodyLarge, fontWeight: '800' },
});
