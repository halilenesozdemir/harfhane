export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

export const FONT_SIZE = {
  caption: 12,
  body: 14,
  bodyLarge: 16,
  title: 20,
  display: 32,
} as const;

export const RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
} as const;

export const CONTENT_MAX_WIDTH = 400;

/**
 * R4: Baloo 2 ExtraBold, matching the web tokens' `font-display`
 * (`packages/ui-tokens/tokens.json`). Owned here so Tile and Key can adopt
 * it without this agent editing those files (see PR follow-up).
 */
export const FONT_FAMILY_DISPLAY = 'Baloo2_800ExtraBold';
