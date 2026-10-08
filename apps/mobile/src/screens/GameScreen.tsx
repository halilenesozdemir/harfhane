import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { GameGrid } from '../components/GameGrid';
import { GameOverCard } from '../components/GameOverCard';
import { HintControl } from '../components/HintControl';
import { Keyboard } from '../components/Keyboard';
import { useTheme } from '../ThemeProvider';
import { useGame } from '../game/useGame';
import { useHint } from '../game/useHint';
import { FONT_SIZE, RADIUS, SPACING } from '../ui/layout';
import { useResultRecorder } from '../stats/useResultRecorder';
import type { GameDependencies } from '../game/useGame';
import type { UseHintResult } from '../game/useHint';
import type { GameMode, GameSession } from '../game/game-session';
import type { WordLength } from '../stats/stats';
import type { ThemeColors } from '../theme';

export interface GameScreenProps extends GameDependencies {
  readonly mode: GameMode;
  readonly wordLength: WordLength;
  readonly onBack: () => void;
}

const MODE_TITLES: Record<GameMode, string> = { daily: 'Günlük', unlimited: 'Sınırsız' };
const TITLE_SIZE = FONT_SIZE.title;
const MESSAGE_SIZE = FONT_SIZE.bodyLarge;
const MESSAGE_HEIGHT = 28;
const SCREEN_PADDING = SPACING.md;
const SECTION_GAP = SPACING.md;
const BUTTON_PADDING = SPACING.md;
const BUTTON_RADIUS = RADIUS.md;

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
  readonly today: GameDependencies['today'];
}

function GameBoard({ session, mode, wordLength, game, hint, colors, store, today }: GameBoardProps) {
  const isFinished = session.game.gameStatus !== 'playing';
  return (
    <>
      <GameGrid
        guesses={session.game.guesses}
        evaluations={session.game.evaluations}
        currentGuess={session.game.currentGuess}
        wordLength={session.solution.length}
        hints={hint.hints}
        isPlaying={!isFinished}
      />
      {!isFinished && (
        <Text accessibilityLiveRegion="polite" style={[styles.message, { color: colors.text }]}>{session.message ?? ''}</Text>
      )}
      {mode === 'daily' && !isFinished && (
        <HintControl canReveal={hint.canReveal} hints={hint.hints} isUsed={hint.isUsed} onReveal={hint.revealHint} />
      )}
      {isFinished && (session.game.gameStatus === 'won' || session.game.gameStatus === 'lost') ? (
        <GameOverCard
          mode={mode}
          wordLength={wordLength}
          gameStatus={session.game.gameStatus}
          solution={session.solution}
          guesses={session.game.guesses}
          evaluations={session.game.evaluations}
          wordId={session.wordId}
          dailyDate={session.dailyDate}
          store={store}
          today={today}
          onNewGame={game.startNewGame}
        />
      ) : (
        <Keyboard
          keyboardStatus={session.game.keyboardStatus}
          onLetter={game.onLetter}
          onDelete={game.onDelete}
          onSubmit={game.onSubmit}
          isHapticsEnabled={game.isHapticsEnabled}
          isInputBlocked={session.isSubmitting}
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
  readonly today: GameDependencies['today'];
}

function GameBody({ mode, wordLength, game, hint, colors, store, today }: GameBodyProps) {
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
  return <GameBoard session={session} mode={mode} wordLength={wordLength} game={game} hint={hint} colors={colors} store={store} today={today} />;
}

export function GameScreen({ mode, wordLength, onBack, api, store, today }: GameScreenProps) {
  const { colors } = useTheme();
  const game = useGame({ mode, wordLength, api, store, today });
  useResultRecorder({ store, mode, wordLength, session: game.session, today });
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
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Geri" onPress={onBack} hitSlop={SECTION_GAP}>
          <Text style={[styles.back, { color: colors.text }]}>‹ Geri</Text>
        </Pressable>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>{`${MODE_TITLES[mode]} · ${wordLength} harf`}</Text>
      </View>
      <GameBody mode={mode} wordLength={wordLength} game={game} hint={hint} colors={colors} store={store} today={today} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: SCREEN_PADDING, gap: SECTION_GAP, justifyContent: 'space-between' },
  header: { flexDirection: 'row', alignItems: 'center', gap: SECTION_GAP },
  back: { fontSize: MESSAGE_SIZE, fontWeight: '700' },
  title: { fontSize: TITLE_SIZE, fontWeight: '800' },
  message: { fontSize: MESSAGE_SIZE, fontWeight: '700', textAlign: 'center', minHeight: MESSAGE_HEIGHT },
  center: { alignItems: 'center', gap: SECTION_GAP },
  button: { alignSelf: 'center', paddingHorizontal: BUTTON_PADDING * 2, paddingVertical: BUTTON_PADDING, borderRadius: BUTTON_RADIUS },
  buttonLabel: { fontSize: MESSAGE_SIZE, fontWeight: '800' },
});
