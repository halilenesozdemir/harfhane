import { useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { generateShareText, getTimeUntilMidnight, getTodayString, type TileStatus } from '@harfhane/shared';
import { useTheme } from '../ThemeProvider';
import { Button } from '../ui/Button';
import { FONT_FAMILY_DISPLAY, FONT_SIZE, LINE_HEIGHT, RADIUS, SPACING } from '../ui/layout';
import type { KeyValueStore } from '../game/game-storage';
import type { GameMode } from '../game/game-session';
import { useTurkeyDay } from '../game/useTurkeyDay';
import type { WordLength } from '../stats/stats';
import type { ThemeColors } from '../theme';
import { dailyGameNumber, selectResultMessage, type FinishedGameStatus } from './gameOverMessages';
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
  // The server's own daily game number (from GameSession's stored game, /words/daily).
  // Null for unlimited and for a game loaded before this field existed; the title/share text
  // then fall back to computing the number from `dailyDate`, exactly as before.
  readonly gameNumber?: number | null;
  // The server's own Turkey-day date for this game (GameState.date, from /words/daily). Null for
  // unlimited and for a game stored before this field existed. Combined with `dailyDate` via
  // `pickLaterDate` (not a simple override) to decide whether the game has gone stale — see its
  // doc comment for why the later of the two, not always the server's, is the safer choice.
  readonly date?: string | null;
  readonly store: KeyValueStore;
  readonly today?: () => string;
  readonly now?: () => Date;
  readonly onNewGame: () => void;
  // useResultRecorder's own computed distribution for a game that just finished this session —
  // see useDisplayDistribution's doc comment for why this must win over a storage read.
  readonly recordedDistribution?: readonly number[] | null;
  // Whether a hint was revealed this game (mobile's own useHint state); threaded into
  // generateShareText so the share header carries the same "· ipucu" marker as web (R8/AE6).
  readonly hintUsed?: boolean;
}

const UNLIMITED_MODE_TEXT = 'Sınırsız';
const COUNTDOWN_LABEL = 'Sonraki kelime';
const NEW_WORD_LABEL = 'Yeni kelime';
const SHARE_LABEL = 'Paylaş';
const ANSWER_LABEL = 'Kelime';
const NEW_DAY_CAPTION = 'Yeni günün kelimesi hazır';
const PLAY_LABEL = 'Oyna';
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

// The later (chronologically) of the server's own `date` and the session's device-computed
// `dailyDate`, or whichever one is not null when only one is given. Using the later of the two —
// not simply preferring the server's `date` outright — guards against a device clock that is
// ahead of the real Turkey day at load time: `dailyDate` is computed from that same (fast) clock
// via `today()` in useGame.ts's loadSession, so it already embeds the clock's own skew, and
// comparing against it (instead of only the server's slower-to-arrive `date`) stops the
// mid-card's own Turkey-day tracker — also driven by that same fast clock — from racing past the
// server's date and flashing the new-day CTA (and letting the player re-trigger a reload loop of
// the still-unchanged server word) before the real day has actually turned over. A clock that is
// behind instead leaves `date` as the later value, so that scenario is unaffected.
function pickLaterDate(a: string | null, b: string | null): string | null {
  if (a === null) return b;
  if (b === null) return a;
  return a > b ? a : b;
}

// A finished daily game has "gone stale" once the Turkey day has moved past the day it was
// played on: the countdown it was showing would otherwise wrap back to 23:59:59 instead of
// reflecting that a new word is already available (the backlog bug this hook fixes). Compares
// with `>`, not `!==`, so a live tracker that has only just caught up to `displayedDate` (not yet
// past it) is not mistaken for staleness.
function useIsDailyGameStale(mode: GameMode, displayedDate: string | null, today: () => string): boolean {
  const isTracking = mode === 'daily' && displayedDate !== null;
  const currentDay = useTurkeyDay(today, isTracking);
  return isTracking && currentDay > (displayedDate as string);
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
  // Secondary once the new-day CTA is showing (K1: at most one primary button visible).
  readonly variant: 'primary' | 'secondary';
}

function ShareButton({ shareText, variant }: ShareButtonProps) {
  return <Button testID="gameover-share" label={SHARE_LABEL} variant={variant} onPress={() => void shareResult(shareText)} />;
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
  readonly isStale: boolean;
  readonly countdown: string;
  readonly onNewGame: () => void;
  readonly colors: ThemeColors;
}

function CountdownOrNewWord({ mode, isStale, countdown, onNewGame, colors }: CountdownOrNewWordProps) {
  if (mode === 'daily' && isStale) {
    return (
      <View style={styles.countdown}>
        <Text style={[styles.countdownCaption, { color: colors.textMuted }]}>{NEW_DAY_CAPTION}</Text>
        <Button testID="gameover-play-new-day" label={PLAY_LABEL} variant="primary" onPress={onNewGame} />
      </View>
    );
  }
  if (mode === 'daily') {
    return (
      <View style={styles.countdown}>
        <Text style={[styles.countdownCaption, { color: colors.textMuted }]}>{COUNTDOWN_LABEL}</Text>
        <Text testID="gameover-countdown" style={[styles.countdownValue, { color: colors.text }]}>{countdown}</Text>
      </View>
    );
  }
  return <Button testID="gameover-new-word" label={NEW_WORD_LABEL} variant="secondary" onPress={onNewGame} />;
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
  gameNumber = null,
  date = null,
  store,
  today = getTodayString,
  now = defaultNow,
  onNewGame,
  recordedDistribution = null,
  hintUsed = false,
}: GameOverCardProps) {
  const { colors } = useTheme();
  const guessCount = guesses.length;
  const seed = useResultSeed(mode, wordId, dailyDate, guessCount);
  const title = selectResultMessage(mode, gameStatus, guessCount, seed);
  const distribution = useDisplayDistribution(store, mode, wordLength, gameStatus, guessCount, dailyDate, today, recordedDistribution);
  const displayedDate = pickLaterDate(date, dailyDate);
  const isStale = useIsDailyGameStale(mode, displayedDate, today);
  const countdown = useCountdown(mode === 'daily' && !isStale, now);
  useResultAnnouncement(title);

  const modeText = mode === 'unlimited' ? UNLIMITED_MODE_TEXT : `#${gameNumber ?? dailyGameNumber(dailyDate ?? today())}`;
  const shareText = generateShareText(
    [...guesses],
    evaluations.map((row) => [...row]),
    modeText,
    gameStatus === 'won',
    { hintUsed },
  );

  return (
    <ScrollView
      testID="gameover-card"
      style={[styles.cardScroll, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
      contentContainerStyle={styles.card}
    >
      <ResultHeader title={title} solution={solution} colors={colors} />
      {distribution !== null && <Distribution distribution={distribution} gameStatus={gameStatus} guessCount={guessCount} />}
      <ShareButton shareText={shareText} variant={isStale ? 'secondary' : 'primary'} />
      <CountdownOrNewWord mode={mode} isStale={isStale} countdown={countdown} onNewGame={onNewGame} colors={colors} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // A ScrollView (not a plain View): on a small screen (e.g. 360x640 dp) the card's own content
  // can be taller than the space left under the grid, so it must scroll internally — bounded by
  // flex: 1 from the parent box GameScreen.tsx gives this element — rather than push the share
  // and "Yeni kelime" buttons off-screen. It stays a styled ScrollView rather than the shared
  // `Card` primitive (mobile-redesign-spec.md section C), because `Card` has no scrolling
  // content slot; its fill/border/radius still match `Card`'s own look (CA1).
  cardScroll: { flex: 1, borderWidth: 1, borderRadius: RADIUS.lg },
  card: { padding: SPACING.lg, gap: SPACING.md, alignItems: 'stretch' },
  // T1: a single-weight custom family (Baloo 2 ExtraBold) carries no fontWeight of its own.
  title: { fontSize: FONT_SIZE.headline, lineHeight: LINE_HEIGHT.headline, fontFamily: FONT_FAMILY_DISPLAY, textAlign: 'center' },
  answer: { fontSize: FONT_SIZE.bodyLarge, fontWeight: '700', textAlign: 'center' },
  countdown: { alignItems: 'center', gap: SPACING.xs },
  countdownCaption: { fontSize: FONT_SIZE.body },
  countdownValue: { fontSize: FONT_SIZE.title, fontWeight: '800', fontVariant: ['tabular-nums'] },
});
