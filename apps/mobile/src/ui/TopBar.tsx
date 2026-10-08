import { Fragment, type ReactNode } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { useTheme } from '../ThemeProvider';
import { FONT_FAMILY_DISPLAY, FONT_SIZE, RADIUS, SPACING, TOP_BAR_HEIGHT, TOUCH_TARGET } from './layout';

export type TopBarVariant = 'default' | 'home';

export interface TopBarProps {
  /** Omitted on the home variant, which shows no title (mobile-redesign-spec.md section B). */
  readonly title?: string;
  /** A qualifier shown as its own chip after the title, never concatenated (B3). */
  readonly chip?: string;
  /** Typically an `IconButton` with a back icon, or the home streak chip; a spacer renders when omitted. */
  readonly leading?: ReactNode;
  /** Up to two `IconButton`s (three on the home variant, B4); a spacer renders when empty. */
  readonly trailing?: ReadonlyArray<ReactNode>;
  /** `home` drops the symmetric side width (its leading streak chip and three trailing actions aren't balanced) and allows an absent title. */
  readonly variant?: TopBarVariant;
  readonly testID?: string;
}

const TITLE_FONT_SCALE_CAP = 1.3;
/** mobile-ui-standard.md typography table, `titleSmall` row (T5): line height 24 for an 18 sp title. */
const TITLE_LINE_HEIGHT = 24;
const CHIP_HEIGHT = 24;
const ACTION_GAP = SPACING.sm;
/** Minimum gap between the title's bounds and a side slot (B4). */
const MIN_TITLE_GAP = SPACING.lg;
/** Home's leading streak chip can be taller than 24 dp inside its 48 dp target; let it grow. */
const HOME_LEADING_MIN_WIDTH = TOUCH_TARGET;

function getSideWidth(actionCount: number): number {
  const count = Math.max(actionCount, 1);
  return count * TOUCH_TARGET + (count - 1) * ACTION_GAP;
}

/**
 * M3 small centre-aligned top app bar (mobile-ui-standard.md section 8).
 * Pure layout: callers supply `leading`/`trailing` already wired to icons
 * and navigation (back behaviour, hardware back) in their own screens. The
 * default variant gives the leading and trailing slots the same width (the
 * wider of the two sides) so the title stays centred over the full bar
 * width no matter how many trailing actions there are (B3/B4).
 */
export function TopBar({ title, chip, leading, trailing = [], variant = 'default', testID }: TopBarProps) {
  const { colors } = useTheme();
  const headerLabel = chip ? `${title}, ${chip}` : title;
  const isHome = variant === 'home';
  const sideWidth = isHome ? undefined : getSideWidth(trailing.length);

  return (
    <View testID={testID} style={[styles.bar, { backgroundColor: colors.bg }]}>
      <View style={[styles.slot, isHome ? styles.homeLeadingSlot : { width: sideWidth }]}>
        {leading ?? <View style={styles.spacer} />}
      </View>
      <View style={styles.titleArea}>
        {title ? (
          <View accessible accessibilityRole="header" accessibilityLabel={headerLabel} style={styles.titleGroup}>
            <Text numberOfLines={1} maxFontSizeMultiplier={TITLE_FONT_SCALE_CAP} style={[styles.title, { color: colors.text }]}>
              {title}
            </Text>
            {chip ? (
              <View style={[styles.chip, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
                <Text style={[styles.chipLabel, { color: colors.textMuted }]}>{chip}</Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
      <View style={[styles.trailingGroup, isHome ? undefined : { width: sideWidth }]}>
        {trailing.length > 0 ? (
          trailing.map((action, index) => <Fragment key={index}>{action}</Fragment>)
        ) : (
          <View style={styles.spacer} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { height: TOP_BAR_HEIGHT, flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.xs },
  slot: { minWidth: TOUCH_TARGET, alignItems: 'flex-start' },
  homeLeadingSlot: { minWidth: HOME_LEADING_MIN_WIDTH, alignItems: 'flex-start' },
  spacer: { width: TOUCH_TARGET, height: TOUCH_TARGET },
  titleArea: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    flexShrink: 1,
    paddingHorizontal: MIN_TITLE_GAP,
  },
  title: { fontSize: FONT_SIZE.titleSmall, fontFamily: FONT_FAMILY_DISPLAY, lineHeight: TITLE_LINE_HEIGHT, flexShrink: 1 },
  chip: { borderRadius: RADIUS.full, borderWidth: 1, paddingHorizontal: SPACING.sm, minHeight: CHIP_HEIGHT, justifyContent: 'center' },
  chipLabel: { fontSize: FONT_SIZE.caption, fontWeight: '700' },
  trailingGroup: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: ACTION_GAP, minWidth: TOUCH_TARGET },
});
