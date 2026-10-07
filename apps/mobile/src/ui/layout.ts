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

/**
 * Lucide icon sizes by context (mobile-ui-standard.md, section 6, I2).
 * @deferred No screen passes a sized Lucide icon into these primitives yet
 * (Plan 011 U7b/U7c wire screens). See docs/backlog.md.
 */
export const ICON_SIZE = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 28,
} as const;

/**
 * Horizontal screen padding (mobile-ui-standard.md, L1).
 * @deferred No screen applies it yet (Plan 011 U7b/U7c wire screens). See docs/backlog.md.
 */
export const SCREEN_PADDING = SPACING.lg;

/**
 * R4: Baloo 2 ExtraBold, matching the web tokens' `font-display`
 * (`packages/ui-tokens/tokens.json`). Owned here so Tile and Key can adopt
 * it without this agent editing those files (see PR follow-up).
 */
export const FONT_FAMILY_DISPLAY = 'Baloo2_800ExtraBold';
