import { Pressable, StyleSheet, Text } from 'react-native';
import type { LetterHint } from '@harfhane/shared';
import { useTheme } from '../ThemeProvider';
import { FONT_SIZE, RADIUS, SPACING } from '../ui/layout';

export interface HintControlProps {
  readonly canReveal: boolean;
  readonly hints: readonly LetterHint[];
  readonly isUsed: boolean;
  readonly onReveal: () => void;
}

const LABEL_AVAILABLE = 'İpucu göster';
const LABEL_USED = 'İpucu kullanıldı';
const DISABLED_OPACITY = 0.6;

function hintLineLabel(hint: LetterHint): string {
  return `${hint.position + 1}. harf: ${hint.letter}`;
}

// Once a hint reveals, the pill with its letter takes the button's place (parity with web); the
// disabled "İpucu kullanıldı" button only ever reappears as a fallback if a position was used
// but, for some reason, could not be rendered as hint text (e.g. it fell outside the solution).
export function HintControl({ canReveal, hints, isUsed, onReveal }: HintControlProps) {
  const { colors } = useTheme();
  if (hints.length > 0) {
    return (
      <Text testID="hint-text" style={[styles.hintText, { color: colors.textMuted }]}>
        {hints.map(hintLineLabel).join(', ')}
      </Text>
    );
  }
  const label = isUsed ? LABEL_USED : LABEL_AVAILABLE;
  return (
    <Pressable
      testID="hint-button"
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !canReveal }}
      disabled={!canReveal}
      onPress={onReveal}
      style={[styles.button, { borderColor: colors.brand, opacity: canReveal ? 1 : DISABLED_OPACITY }]}
    >
      <Text style={[styles.label, { color: colors.brand }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  label: { fontSize: FONT_SIZE.body, fontWeight: '700' },
  hintText: { textAlign: 'center', fontSize: FONT_SIZE.caption },
});
