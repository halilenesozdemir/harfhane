// Type declarations for brand-mark.mjs, so a TypeScript consumer (apps/frontend's BrandMark.tsx)
// can import its geometry constants without pulling the whole module into `allowJs`. The Node
// generator scripts (apps/mobile, apps/frontend) import the .mjs directly by relative path and
// don't need these types.

export interface BrandMarkTile {
  readonly left: number;
  readonly top: number;
  readonly size: number;
  readonly radius: number;
  readonly depth: number;
  readonly rotationDeg: number;
}

export const CANVAS_SIZE: number;
export const REFERENCE_SIZE: number;
export const CANVAS_SCALE: number;
export const PRESENT_TILE: BrandMarkTile;
export const CORRECT_TILE: BrandMarkTile;
export const GLYPH_HEIGHT: number;
export const ICON_SAFE_ZONE_SCALE: number;
export const SPLASH_MASK_SCALE: number;
export const H_GLYPH_PATH: string;
