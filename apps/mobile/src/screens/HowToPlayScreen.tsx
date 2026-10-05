import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../ThemeProvider';
import type { ThemeColors } from '../theme';

export interface HowToPlayScreenProps {
  readonly onClose: () => void;
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

export function HowToPlayScreen({ onClose }: HowToPlayScreenProps) {
  const { colors } = useTheme();

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
        accessibilityLabel="Kapat"
        onPress={onClose}
        style={[styles.closeButton, { backgroundColor: colors.correct }]}
      >
        <Text style={[styles.closeLabel, { color: colors.correctFg }]}>Kapat</Text>
      </Pressable>
    </View>
  );
}

const TILE_SIZE = 40;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 20,
  },
  exampleBlock: {
    gap: 6,
  },
  tileRow: {
    flexDirection: 'row',
    gap: 4,
  },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLetter: {
    fontSize: 18,
    fontWeight: '800',
  },
  exampleText: {
    fontSize: 13,
  },
  exampleHighlight: {
    fontWeight: '800',
  },
  closeButton: {
    margin: 20,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
});
