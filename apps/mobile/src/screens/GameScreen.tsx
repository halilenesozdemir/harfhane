import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { GameGrid } from '../components/GameGrid';
import { Keyboard } from '../components/Keyboard';
import { useTheme } from '../ThemeProvider';
import { useGame } from '../game/useGame';
import type { GameDependencies } from '../game/useGame';
import type { GameMode, GameSession } from '../game/game-session';
import type { ThemeColors } from '../theme';

export interface GameScreenProps extends GameDependencies {
  readonly mode: GameMode;
  readonly wordLength: number;
  readonly onBack: () => void;
}

const MODE_TITLES: Record<GameMode, string> = { daily: 'Günlük', unlimited: 'Sınırsız' };
const TITLE_SIZE = 20;
const MESSAGE_SIZE = 16;
const MESSAGE_HEIGHT = 28;
const SCREEN_PADDING = 12;
const SECTION_GAP = 12;
const BUTTON_PADDING = 12;
const BUTTON_RADIUS = 12;

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
  readonly game: ReturnType<typeof useGame>;
  readonly colors: ThemeColors;
}

function GameBoard({ session, mode, game, colors }: GameBoardProps) {
  const isFinished = session.game.gameStatus !== 'playing';
  return (
    <>
      <GameGrid guesses={session.game.guesses} evaluations={session.game.evaluations} currentGuess={session.game.currentGuess} wordLength={session.solution.length} />
      <Text accessibilityLiveRegion="polite" style={[styles.message, { color: colors.text }]}>{session.message ?? ''}</Text>
      {mode === 'unlimited' && isFinished && <ActionButton label="Yeni kelime" onPress={game.startNewGame} colors={colors} />}
      <Keyboard keyboardStatus={session.game.keyboardStatus} onLetter={game.onLetter} onDelete={game.onDelete} onSubmit={game.onSubmit} />
    </>
  );
}

interface GameBodyProps {
  readonly mode: GameMode;
  readonly game: ReturnType<typeof useGame>;
  readonly colors: ThemeColors;
}

function GameBody({ mode, game, colors }: GameBodyProps) {
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
  return <GameBoard session={session} mode={mode} game={game} colors={colors} />;
}

export function GameScreen({ mode, wordLength, onBack, api, store, today }: GameScreenProps) {
  const { colors } = useTheme();
  const game = useGame({ mode, wordLength, api, store, today });
  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Geri" onPress={onBack} hitSlop={SECTION_GAP}>
          <Text style={[styles.back, { color: colors.text }]}>‹ Geri</Text>
        </Pressable>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>{`${MODE_TITLES[mode]} · ${wordLength} harf`}</Text>
      </View>
      <GameBody mode={mode} game={game} colors={colors} />
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
