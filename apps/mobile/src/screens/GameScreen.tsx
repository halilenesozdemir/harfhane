import { ArrowLeft } from 'lucide-react-native';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { GameGrid } from '../components/GameGrid';
import { GameOverCard } from '../components/GameOverCard';
import { HintControl } from '../components/HintControl';
import { Keyboard } from '../components/Keyboard';
import { useTheme } from '../ThemeProvider';
import { useGame } from '../game/useGame';
import { useHint } from '../game/useHint';
import { useRevealState } from '../game/useRevealState';
import { useReduceMotion } from '../ui/motion/useReduceMotion';
import { IconButton } from '../ui/IconButton';
import { TopBar } from '../ui/TopBar';
import { FONT_SIZE, ICON_SIZE, RADIUS, SCREEN_PADDING, SPACING } from '../ui/layout';
import { useResultRecorder } from '../stats/useResultRecorder';
import type { GameDependencies } from '../game/useGame';
import type { UseHintResult } from '../game/useHint';
import type { GameMode, GameSession } from '../game/game-session';
import type { FeedbackPrefill } from '../lib/feedback-types';
import type { WordLength } from '../stats/stats';
import type { ThemeColors } from '../theme';

export interface GameScreenProps extends GameDependencies {
  readonly mode: GameMode;
  readonly wordLength: WordLength;
  readonly onBack: () => void;
  // Not part of GameDependencies/useGame (which now always keys the daily game by the server's
  // own date, never a device clock — see useGame.ts's loadSession): this is only the live clock
  // GameOverCard's midnight-rollover check and useResultRecorder's stats fallback still need.
  readonly today?: () => string;
  // R6/AE8: composed here (this screen already knows mode/wordLength/dailyDate/solution) into a
  // zero-arg callback passed down to GameOverCard, which never imports navigation itself.
  readonly onReportWord?: (prefill: FeedbackPrefill) => void;
}

const MODE_TITLES: Record<GameMode, string> = { daily: 'Günlük', unlimited: 'Sınırsız' };
const MESSAGE_SIZE = FONT_SIZE.bodyLarge;
const MESSAGE_HEIGHT = 28;
// Board starts 8 dp below the top bar (mobile-redesign-spec.md section C).
const BODY_TOP_GAP = SPACING.sm;
const SECTION_GAP = SPACING.md;
const BUTTON_PADDING = SPACING.md;
const BUTTON_RADIUS = RADIUS.md;
function NOOP(): void {}

interface ActionButtonProps {
  readonly label: string;
  readonly onPress: () => void;
  readonly colors: ThemeColors;
}

function ActionButton({ label, onPress, colors }: ActionButtonProps) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.button, { backgroundColor: colors.brand }]}>
      <Text style={[styles.buttonLabel, { color: colors.brandFg }]}>{label}</Text>
    </Pressable>
  );
}

interface GameBoardProps {
  readonly session: GameSession;
  readonly mode: GameMode;
  readonly wordLength: WordLength;
  readonly game: ReturnType<typeof useGame>;
  readonly hint: UseHintResult;
  readonly colors: ThemeColors;
  readonly store: GameDependencies['store'];
  readonly today: GameScreenProps['today'];
  readonly recordedDistribution: readonly number[] | null;
  readonly onReportWord: GameScreenProps['onReportWord'];
}

function GameBoard({ session, mode, wordLength, game, hint, colors, store, today, recordedDistribution, onReportWord }: GameBoardProps) {
  const isFinished = session.game.gameStatus !== 'playing';
  const reduceMotion = useReduceMotion();
  const reveal = useRevealState(session, session.solution.length, reduceMotion);
  // A fast player's next Enter must not land mid-flip (M4 exception); letters and backspace stay
  // live throughout (only Enter, and only until the last tile's colour is shown — item 7).
  const onSubmit = reveal.isEnterBlocked ? NOOP : game.onSubmit;
  // Lead decision: the game-over card (and its share/countdown) waits for the reveal flip and the
  // win bounce to finish, same as web's 1500ms wait — a restored, already-finished game has
  // neither running, so its card still shows immediately.
  const isGameOverReady = isFinished && !reveal.isRevealing && !reveal.celebrateRow;
  const handleReportWord = onReportWord
    ? () => onReportWord({ mode, wordLength, puzzleDate: session.dailyDate, reportedWord: session.solution })
    : undefined;
  return (
    <>
      <GameGrid
        guesses={session.game.guesses}
        evaluations={session.game.evaluations}
        currentGuess={session.game.currentGuess}
        wordLength={session.solution.length}
        hints={hint.hints}
        isPlaying={!isFinished}
        isRevealing={reveal.isRevealing}
        shakeRow={reveal.shakeRow}
        celebrateRow={reveal.celebrateRow}
        reduceMotion={reduceMotion}
      />
      {!isFinished && (
        <Text accessibilityLiveRegion="polite" style={[styles.message, { color: colors.text }]}>{session.message ?? ''}</Text>
      )}
      {mode === 'daily' && !isFinished && (
        <HintControl canReveal={hint.canReveal} hints={hint.hints} isUsed={hint.isUsed} onReveal={hint.revealHint} />
      )}
      {isGameOverReady && (session.game.gameStatus === 'won' || session.game.gameStatus === 'lost') ? (
        <GameOverCard
          mode={mode}
          wordLength={wordLength}
          gameStatus={session.game.gameStatus}
          solution={session.solution}
          guesses={session.game.guesses}
          evaluations={session.game.evaluations}
          wordId={session.wordId}
          dailyDate={session.dailyDate}
          gameNumber={session.game.gameNumber ?? null}
          date={session.game.date ?? null}
          store={store}
          today={today}
          onNewGame={game.startNewGame}
          onReportWord={handleReportWord}
          recordedDistribution={recordedDistribution}
          hintUsed={hint.isUsed}
        />
      ) : null}
      {!isFinished && (
        <Keyboard
          keyboardStatus={session.game.keyboardStatus}
          onLetter={game.onLetter}
          onDelete={game.onDelete}
          onSubmit={onSubmit}
          isHapticsEnabled={game.isHapticsEnabled}
          isInputBlocked={session.isSubmitting}
          isSubmitBlocked={session.isSubmitting || reveal.isEnterBlocked}
        />
      )}
    </>
  );
}

interface GameBodyProps {
  readonly mode: GameMode;
  readonly wordLength: WordLength;
  readonly game: ReturnType<typeof useGame>;
  readonly hint: UseHintResult;
  readonly colors: ThemeColors;
  readonly store: GameDependencies['store'];
  readonly today: GameScreenProps['today'];
  readonly recordedDistribution: readonly number[] | null;
  readonly onReportWord: GameScreenProps['onReportWord'];
}

function GameBody({ mode, wordLength, game, hint, colors, store, today, recordedDistribution, onReportWord }: GameBodyProps) {
  const { session } = game;
  if (session.phase === 'loading') return <ActivityIndicator accessibilityLabel="Kelime yükleniyor" color={colors.brand} />;
  if (session.phase === 'error') {
    return (
      <View style={styles.center}>
        <Text style={{ color: colors.text }}>Kelime yüklenemedi.</Text>
        <ActionButton label="Tekrar dene" onPress={game.startNewGame} colors={colors} />
      </View>
    );
  }
  return (
    <GameBoard
      session={session}
      mode={mode}
      wordLength={wordLength}
      game={game}
      hint={hint}
      colors={colors}
      store={store}
      today={today}
      recordedDistribution={recordedDistribution}
      onReportWord={onReportWord}
    />
  );
}

export function GameScreen({ mode, wordLength, onBack, api, store, today, onReportWord }: GameScreenProps) {
  const { colors } = useTheme();
  const game = useGame({ mode, wordLength, api, store });
  const { justRecordedDistribution } = useResultRecorder({ store, mode, wordLength, session: game.session, today });
  const hint = useHint({
    store,
    mode,
    wordLength,
    dailyDate: game.session.dailyDate,
    solution: game.session.solution,
    guesses: game.session.game.guesses,
  });
  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <TopBar
        title={MODE_TITLES[mode]}
        chip={`${wordLength} harf`}
        leading={<IconButton icon={<ArrowLeft size={ICON_SIZE.lg} color={colors.text} />} accessibilityLabel="Geri" onPress={onBack} />}
      />
      <View style={styles.body}>
        <GameBody
          mode={mode}
          wordLength={wordLength}
          game={game}
          hint={hint}
          colors={colors}
          store={store}
          today={today}
          recordedDistribution={justRecordedDistribution}
          onReportWord={onReportWord}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: { flex: 1, paddingHorizontal: SCREEN_PADDING, paddingTop: BODY_TOP_GAP, paddingBottom: SCREEN_PADDING, gap: SECTION_GAP, justifyContent: 'space-between' },
  message: { fontSize: MESSAGE_SIZE, fontWeight: '700', textAlign: 'center', minHeight: MESSAGE_HEIGHT },
  center: { alignItems: 'center', gap: SECTION_GAP },
  button: { alignSelf: 'center', paddingHorizontal: BUTTON_PADDING * 2, paddingVertical: BUTTON_PADDING, borderRadius: BUTTON_RADIUS },
  buttonLabel: { fontSize: MESSAGE_SIZE, fontWeight: '800' },
});
