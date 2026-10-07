import type { ReactNode } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { useTheme } from '../ThemeProvider';
import { FONT_SIZE, RADIUS, SPACING, TOP_BAR_HEIGHT, TOUCH_TARGET } from './layout';

export interface TopBarProps {
  readonly title: string;
  /** A qualifier shown as its own chip after the title, never concatenated (B3). */
  readonly chip?: string;
  /** Typically an `IconButton` with a back icon; a 48 dp spacer renders when omitted. */
  readonly leading?: ReactNode;
  /** Up to two `IconButton`s; a 48 dp spacer renders when empty, keeping the title centred (B4). */
  readonly trailing?: ReadonlyArray<ReactNode>;
  readonly testID?: string;
}

const TITLE_FONT_SCALE_CAP = 1.3;

/**
 * M3 small centre-aligned top app bar (mobile-ui-standard.md section 8).
 * Pure layout: callers supply `leading`/`trailing` already wired to icons
 * and navigation (back behaviour, hardware back) in their own screens.
 */
export function TopBar({ title, chip, leading, trailing = [], testID }: TopBarProps) {
  const { colors } = useTheme();
  const headerLabel = chip ? `${title}, ${chip}` : title;

  return (
    <View testID={testID} style={[styles.bar, { backgroundColor: colors.bg }]}>
      <View style={styles.slot}>{leading ?? <View style={styles.spacer} />}</View>
      <View style={styles.titleArea} accessible accessibilityRole="header" accessibilityLabel={headerLabel}>
        <Text numberOfLines={1} maxFontSizeMultiplier={TITLE_FONT_SCALE_CAP} style={[styles.title, { color: colors.text }]}>
          {title}
        </Text>
        {chip ? (
          <View style={[styles.chip, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <Text style={[styles.chipLabel, { color: colors.textMuted }]}>{chip}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.trailingGroup}>{trailing.length > 0 ? trailing : <View style={styles.spacer} />}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { height: TOP_BAR_HEIGHT, flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.xs },
  slot: { width: TOUCH_TARGET, alignItems: 'flex-start' },
  spacer: { width: TOUCH_TARGET, height: TOUCH_TARGET },
  titleArea: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm },
  title: { fontSize: FONT_SIZE.titleSmall },
  chip: { borderRadius: RADIUS.full, borderWidth: 1, paddingHorizontal: SPACING.sm, height: 24, justifyContent: 'center' },
  chipLabel: { fontSize: FONT_SIZE.caption, fontWeight: '700' },
  trailingGroup: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: SPACING.sm, minWidth: TOUCH_TARGET },
});
