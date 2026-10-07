import { useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import type { TileStatus } from '@harfhane/shared';
import { generateShareText, getTimeUntilMidnight, getTodayString } from '@harfhane/shared';
import { useTheme } from '../ThemeProvider';
import { FONT_SIZE, RADIUS, SPACING } from '../ui/layout';
import type { KeyValueStore } from '../game/game-storage';
import type { GameMode } from '../game/game-session';
import type { WordLength } from '../stats/stats';
import type { ThemeColors } from '../theme';
import { dailyGameNumber, selectResultMessage } from './gameOverMessages';
import type { FinishedGameStatus } from './gameOverMessages';
import { Distribution, useDisplayDistribution } from './GameOverDistribution';

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
  readonly now?: () => Date;
  readonly onNewGame: () => void;
}

const UNLIMITED_MODE_TEXT = 'Sınırsız';
const COUNTDOWN_LABEL = 'Sonraki kelime';
const NEW_WORD_LABEL = 'Yeni kelime';
const SHARE_LABEL = 'Paylaş';
const ANSWER_LABEL = 'Kelime';
const COUNTDOWN_UPDATE_INTERVAL_MS = 1000;

function useResultSeed(mode: GameMode, wordId: number | null, dailyDate: string | null, guessCount: number): number {
  return useMemo(() => {
    if (mode === 'daily' && dailyDate !== null) return dailyGameNumber(dailyDate);
    return wordId ?? guessCount;
  }, [mode, wordId, dailyDate, guessCount]);
}

function useCountdown(isEnabled: boolean, now: () => Date): string {
  const [countdown, setCountdown] = useState(() => getTimeUntilMidnight(now()));
  useEffect(() => {
    if (!isEnabled) return undefined;
    const timer = setInterval(() => setCountdown(getTimeUntilMidnight(now())), COUNTDOWN_UPDATE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [isEnabled, now]);
  return `${countdown.hours}:${countdown.minutes}:${countdown.seconds}`;
}

function useResultAnnouncement(title: string): void {
  useEffect(() => {
    // accessibilityLiveRegion (set on the title Text below) covers Android TalkBack; this also
    // reaches iOS VoiceOver, which does not read React Native's liveRegion prop.
    AccessibilityInfo.announceForAccessibility(title);
  }, [title]);
}

// A stable module-level reference: a fresh arrow function as the default parameter value would
// be re-created on every render, forever changing the useCountdown effect's dependency.
function defaultNow(): Date {
  return new Date();
}

async function shareResult(shareText: string): Promise<void> {
  try {
    await Share.share({ message: shareText });
  } catch {
    // The user cancelling the native share sheet is not an error worth surfacing.
  }
}

interface ShareButtonProps {
  readonly shareText: string;
  readonly colors: ThemeColors;
}

function ShareButton({ shareText, colors }: ShareButtonProps) {
  return (
    <Pressable
      testID="gameover-share"
      accessibilityRole="button"
      accessibilityLabel={SHARE_LABEL}
      onPress={() => void shareResult(shareText)}
      style={[styles.shareButton, { backgroundColor: colors.brand }]}
    >
      <Text style={[styles.shareLabel, { color: colors.brandFg }]}>{SHARE_LABEL}</Text>
    </Pressable>
  );
}

interface ResultHeaderProps {
  readonly title: string;
  readonly solution: string;
  readonly colors: ThemeColors;
}

function ResultHeader({ title, solution, colors }: ResultHeaderProps) {
  return (
    <>
      <Text accessibilityRole="header" accessibilityLiveRegion="polite" style={[styles.title, { color: colors.text }]}>
        {title}
      </Text>
      <Text style={[styles.answer, { color: colors.correctText }]}>{`${ANSWER_LABEL}: ${solution}`}</Text>
    </>
  );
}

interface CountdownOrNewWordProps {
  readonly mode: GameMode;
  readonly countdown: string;
  readonly onNewGame: () => void;
  readonly colors: ThemeColors;
}

function CountdownOrNewWord({ mode, countdown, onNewGame, colors }: CountdownOrNewWordProps) {
  if (mode === 'daily') {
    return (
      <View style={styles.countdown}>
        <Text style={[styles.countdownCaption, { color: colors.textMuted }]}>{COUNTDOWN_LABEL}</Text>
        <Text testID="gameover-countdown" style={[styles.countdownValue, { color: colors.text }]}>{countdown}</Text>
      </View>
    );
  }
  return (
    <Pressable
      testID="gameover-new-word"
      accessibilityRole="button"
      accessibilityLabel={NEW_WORD_LABEL}
      onPress={onNewGame}
      style={[styles.newWordButton, { backgroundColor: colors.present }]}
    >
      <Text style={[styles.newWordLabel, { color: colors.presentFg }]}>{NEW_WORD_LABEL}</Text>
    </Pressable>
  );
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
  today = getTodayString,
  now = defaultNow,
  onNewGame,
}: GameOverCardProps) {
  const { colors } = useTheme();
  const guessCount = guesses.length;
  const seed = useResultSeed(mode, wordId, dailyDate, guessCount);
  const title = selectResultMessage(mode, gameStatus, guessCount, seed);
  const distribution = useDisplayDistribution(store, mode, wordLength, gameStatus, guessCount, dailyDate, today);
  const countdown = useCountdown(mode === 'daily', now);
  useResultAnnouncement(title);

  const modeText = mode === 'unlimited' ? UNLIMITED_MODE_TEXT : `#${dailyGameNumber(dailyDate ?? today())}`;
  const shareText = generateShareText(
    [...guesses],
    evaluations.map((row) => [...row]),
    modeText,
    gameStatus === 'won',
  );

  return (
    <ScrollView
      testID="gameover-card"
      style={[styles.cardScroll, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
      contentContainerStyle={styles.card}
    >
      <ResultHeader title={title} solution={solution} colors={colors} />
      {distribution !== null && <Distribution distribution={distribution} gameStatus={gameStatus} guessCount={guessCount} />}
      <ShareButton shareText={shareText} colors={colors} />
      <CountdownOrNewWord mode={mode} countdown={countdown} onNewGame={onNewGame} colors={colors} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // A ScrollView (not a plain View): on a small screen (e.g. 360x640 dp) the card's own content
  // can be taller than the space left under the grid, so it must scroll internally — bounded by
  // flex: 1 from the parent box GameScreen.tsx gives this element — rather than push the share
  // and "Yeni kelime" buttons off-screen.
  cardScroll: { flex: 1, borderWidth: 1, borderRadius: RADIUS.lg },
  card: { padding: SPACING.lg, gap: SPACING.md, alignItems: 'stretch' },
  title: { fontSize: FONT_SIZE.title, fontWeight: '800', textAlign: 'center' },
  answer: { fontSize: FONT_SIZE.bodyLarge, fontWeight: '700', textAlign: 'center' },
  shareButton: { paddingVertical: SPACING.md, borderRadius: RADIUS.md, alignItems: 'center' },
  shareLabel: { fontSize: FONT_SIZE.bodyLarge, fontWeight: '800' },
  countdown: { alignItems: 'center', gap: SPACING.xs },
  countdownCaption: { fontSize: FONT_SIZE.body },
  countdownValue: { fontSize: FONT_SIZE.title, fontWeight: '800', fontVariant: ['tabular-nums'] },
  newWordButton: { paddingVertical: SPACING.md, borderRadius: RADIUS.md, alignItems: 'center' },
  newWordLabel: { fontSize: FONT_SIZE.bodyLarge, fontWeight: '800' },
});
