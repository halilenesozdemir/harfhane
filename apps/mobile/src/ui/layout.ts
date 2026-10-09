export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const FONT_SIZE = {
  caption: 12,
  body: 14,
  bodyLarge: 16,
  title: 20,
  titleSmall: 18,
  headline: 24,
  display: 32,
} as const;

export const RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  full: 999,
} as const;

export const CONTENT_MAX_WIDTH = 400;

/** Minimum hit area for any pressable, per the mobile UI standard (A1). */
export const TOUCH_TARGET = 48;

/** M3 small centre-aligned top app bar height (mobile-ui-standard.md, section 8). */
export const TOP_BAR_HEIGHT = 64;

/** Disabled opacity for any pressable (Button K3, IconButton). */
export const DISABLED_OPACITY = 0.5;

/** Lucide icon sizes by context (mobile-ui-standard.md, section 6, I2). */
export const ICON_SIZE = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 28,
} as const;

/** Bottom depth-edge heights in dp for the playful 3D look (mobile-ui-standard.md, section 5). */
export const DEPTH = {
  sm: 3,
  md: 4,
  lg: 6,
} as const;

/** Horizontal screen padding (mobile-ui-standard.md, L1). */
export const SCREEN_PADDING = SPACING.lg;

/** Line height per `FONT_SIZE` role, from the typography table (mobile-ui-standard.md section 2). */
export const LINE_HEIGHT = {
  caption: 16,
  body: 20,
  bodyLarge: 22,
  title: 26,
  titleSmall: 24,
  headline: 30,
  display: 40,
} as const;

/** Chip visual heights before `hitSlop` (mobile-ui-standard.md section 7, A3). */
export const CHIP_HEIGHT = {
  streak: 32,
  length: 40,
} as const;

/** Letters in a fixed-size game control (tile, key, hero tile) cap the system font scale (T3). */
export const TILE_LETTER_MAX_FONT_SCALE = 1.2;

/**
 * R4: Baloo 2 ExtraBold, matching the web tokens' `font-display`
 * (`packages/ui-tokens/tokens.json`). Owned here so Tile and Key can adopt
 * it without this agent editing those files (see PR follow-up).
 */
export const FONT_FAMILY_DISPLAY = 'Baloo2_800ExtraBold';

/**
 * Fixed width for the count slot beside a guess-distribution bar fill, always rendered
 * (empty when the count is 0) so every row's track gets the same remaining space and the
 * bars stay comparable widths (mobile-ui-standard.md C2). Shared by GameOverDistribution
 * and StatsScreen.
 */
export const DISTRIBUTION_COUNT_WIDTH = 20;
