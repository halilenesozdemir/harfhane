import { ArrowLeft } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../ThemeProvider';
import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';
import { TopBar } from '../ui/TopBar';
import { FONT_SIZE, ICON_SIZE, RADIUS, SCREEN_PADDING, SPACING } from '../ui/layout';
import type { ThemeColors } from '../theme';

export interface HowToPlayScreenProps {
  readonly onClose: () => void;
  // R7/AE5: a first launch that has never seen this screen gets a welcoming
  // primary action instead of the plain "Kapat" close button; both lead to
  // the same place (home), so they share onClose.
  readonly isFirstLaunch?: boolean;
}

type ExampleStatus = 'correct' | 'present' | 'absent' | null;

interface ExampleRow {
  readonly letters: readonly { readonly letter: string; readonly status: ExampleStatus }[];
  readonly explanation: string;
  readonly highlight: string;
}

const EXAMPLE_ROWS: readonly ExampleRow[] = [
  {
    letters: [
      { letter: 'S', status: 'correct' },
      { letter: 'A', status: null },
      { letter: 'B', status: null },
      { letter: 'A', status: null },
      { letter: 'H', status: null },
    ],
    highlight: 'S',
    explanation: 'harfi kelimede var ve doğru yerde.',
  },
  {
    letters: [
      { letter: 'S', status: null },
      { letter: 'A', status: 'present' },
      { letter: 'B', status: null },
      { letter: 'I', status: null },
      { letter: 'R', status: null },
    ],
    highlight: 'A',
    explanation: 'harfi kelimede var ama yanlış yerde.',
  },
  {
    letters: [
      { letter: 'Ş', status: null },
      { letter: 'Ü', status: null },
      { letter: 'K', status: 'absent' },
      { letter: 'Ü', status: null },
      { letter: 'R', status: null },
    ],
    highlight: 'K',
    explanation: 'harfi kelimede hiç yok.',
  },
];

function tileColor(colors: ThemeColors, status: ExampleStatus): { bg: string; fg: string } {
  if (status === 'correct') return { bg: colors.correct, fg: colors.correctFg };
  if (status === 'present') return { bg: colors.present, fg: colors.presentFg };
  if (status === 'absent') return { bg: colors.absent, fg: colors.absentFg };
  return { bg: colors.tileEmptyBg, fg: colors.text };
}

interface ExampleTileProps {
  readonly letter: string;
  readonly status: ExampleStatus;
}

function ExampleTile({ letter, status }: ExampleTileProps) {
  const { colors } = useTheme();
  const { bg, fg } = tileColor(colors, status);
  return (
    <View style={[styles.tile, { backgroundColor: bg, borderColor: colors.tileEmptyBorder }]}>
      <Text style={[styles.tileLetter, { color: fg }]}>{letter}</Text>
    </View>
  );
}

function ExampleBlock({ row }: { readonly row: ExampleRow }) {
  const { colors } = useTheme();
  return (
    <View style={styles.exampleBlock}>
      <View style={styles.tileRow}>
        {row.letters.map((entry, index) => (
          <ExampleTile key={index} letter={entry.letter} status={entry.status} />
        ))}
      </View>
      <Text style={[styles.exampleText, { color: colors.textMuted }]}>
        <Text style={[styles.exampleHighlight, { color: colors.text }]}>{row.highlight}</Text> {row.explanation}
      </Text>
    </View>
  );
}

const FIRST_LAUNCH_LABEL = 'Oynamaya başla';

export function HowToPlayScreen({ onClose, isFirstLaunch = false }: HowToPlayScreenProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <TopBar
        title="Nasıl oynanır"
        // R9/B6: no screen renders a text "Geri"/"Kapat" button for navigation — a first launch
        // has no way out except its own "Oynamaya başla" action below, so it gets no back icon.
        leading={isFirstLaunch ? undefined : <IconButton icon={<ArrowLeft size={ICON_SIZE.lg} color={colors.text} />} accessibilityLabel="Geri" onPress={onClose} />}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.paragraph, { color: colors.text }]}>Gizli kelimeyi 6 denemede tahmin et.</Text>
        <Text style={[styles.paragraph, { color: colors.textMuted }]}>
          Her tahmin, listeden geçerli bir kelime olmalı. Tahmini göndermek için Enter tuşuna bas.
        </Text>
        <Text style={[styles.paragraph, { color: colors.textMuted }]}>
          Her tahminden sonra, kutucukların rengi harflerin doğru kelimeye ne kadar yakın olduğunu gösterecek
          şekilde değişecektir.
        </Text>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Örnekler</Text>
        {EXAMPLE_ROWS.map((row, index) => (
          <ExampleBlock key={index} row={row} />
        ))}
        <Text style={[styles.paragraph, { color: colors.textMuted }]}>Her gün yeni bir kelime gelir!</Text>
      </ScrollView>
      {isFirstLaunch && (
        <View style={styles.primaryButtonWrap}>
          <Button label={FIRST_LAUNCH_LABEL} variant="primary" onPress={onClose} />
        </View>
      )}
    </View>
  );
}

const TILE_SIZE = 40;
const TILE_BORDER_WIDTH = 2;
const PARAGRAPH_LINE_HEIGHT = 20;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: SCREEN_PADDING,
    gap: SPACING.md,
  },
  primaryButtonWrap: {
    padding: SCREEN_PADDING,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.bodyLarge,
    fontWeight: '700',
    marginTop: SPACING.sm,
  },
  paragraph: {
    fontSize: FONT_SIZE.body,
    lineHeight: PARAGRAPH_LINE_HEIGHT,
  },
  exampleBlock: {
    gap: SPACING.sm,
  },
  tileRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: RADIUS.sm,
    borderWidth: TILE_BORDER_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLetter: {
    fontSize: FONT_SIZE.title,
    fontWeight: '800',
  },
  exampleText: {
    fontSize: FONT_SIZE.caption,
  },
  exampleHighlight: {
    fontWeight: '800',
  },
});
