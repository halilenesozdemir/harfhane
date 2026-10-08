import { ChevronRight, Infinity as InfinityIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../ThemeProvider';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { DepthTile } from '../ui/DepthTile';
import { AppText } from '../ui/Typography';
import { ICON_SIZE, RADIUS, SPACING, DEPTH } from '../ui/layout';
import type { WordLength } from '../stats/stats';

export interface UnlimitedCardProps {
  readonly wordLength: WordLength;
  /** mobile-redesign-spec.md section B: once the daily card is finished, this card's CTA becomes the screen's one primary action (K1). */
  readonly isDailyFinished: boolean;
  readonly onPress: () => void;
}

const ICON_TILE_SIZE = 48;

function accessibilityLabel(wordLength: WordLength, isDailyFinished: boolean): string {
  const base = `Sınırsız mod, ${wordLength} harf`;
  return isDailyFinished ? `${base}, yeni kelime oyna` : base;
}

/** The unlimited mode card: a chevron-led row normally, or the screen's one primary CTA once the daily is finished. */
export function UnlimitedCard({ wordLength, isDailyFinished, onPress }: UnlimitedCardProps) {
  const { colors } = useTheme();

  return (
    <Card onPress={onPress} accessibilityLabel={accessibilityLabel(wordLength, isDailyFinished)} testID="home-unlimited-card">
      <View style={styles.row}>
        <DepthTile
          icon={<InfinityIcon size={ICON_SIZE.lg} color={colors.presentFg} />}
          fill={colors.present}
          foreground={colors.presentFg}
          depthColor={colors.presentDepth}
          size={ICON_TILE_SIZE}
          depth={DEPTH.sm}
          radius={RADIUS.md}
        />
        <View style={styles.titleColumn}>
          <AppText role="title">Sınırsız</AppText>
          <AppText role="body" color={colors.textMuted}>
            Dilediğin kadar oyna, her seferinde yeni kelime
          </AppText>
        </View>
        {isDailyFinished ? (
          <Button label="Sınırsız oyna" variant="primary" />
        ) : (
          <View testID="unlimited-chevron" importantForAccessibility="no-hide-descendants">
            <ChevronRight size={ICON_SIZE.md} color={colors.textMuted} />
          </View>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  titleColumn: { flex: 1, gap: SPACING.xs },
});
