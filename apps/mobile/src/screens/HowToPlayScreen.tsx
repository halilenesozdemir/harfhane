import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../ThemeProvider';
import { FONT_SIZE, RADIUS, SPACING } from '../ui/layout';
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

export function HowToPlayScreen({ onClose, isFirstLaunch = false }: HowToPlayScreenProps) {
  const { colors } = useTheme();
  const primaryLabel = isFirstLaunch ? 'Oyna' : 'Kapat';

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Nasıl Oynanır?</Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>Gizli kelimeyi 6 denemede tahmin edin.</Text>
        <Text style={[styles.paragraph, { color: colors.textMuted }]}>
          Her tahmin, listeden geçerli bir kelime olmalıdır. Tahmini göndermek için Enter tuşuna basın.
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
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={primaryLabel}
        onPress={onClose}
        style={[styles.closeButton, { backgroundColor: colors.correct }]}
      >
        <Text style={[styles.closeLabel, { color: colors.correctFg }]}>{primaryLabel}</Text>
      </Pressable>
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
    padding: SPACING.xl,
    gap: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZE.title,
    fontWeight: '800',
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
  closeButton: {
    margin: SPACING.xl,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  closeLabel: {
    fontSize: FONT_SIZE.bodyLarge,
    fontWeight: '700',
  },
});
