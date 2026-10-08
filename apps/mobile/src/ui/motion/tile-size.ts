import { base } from '@harfhane/ui-tokens';
import { parsePx } from '../../utils/px';

export const TILE_SIZE_MIN = parsePx(base.tileSizeMin);
export const TILE_SIZE_MAX = parsePx(base.tileSizeMax);
// Used before the board has been measured once (first layout pass) — the same token as the
// maximum, named separately so callers read intent rather than reusing the max by coincidence.
export const TILE_SIZE_FALLBACK = parsePx(base.tileSizeMax);

const DEFAULT_ROWS = 6;
const DEFAULT_GAP = 6;

export interface MeasuredBox {
  readonly width: number;
  readonly height: number;
}

export interface TileSizeOptions {
  readonly rows?: number;
  readonly columnGap?: number;
  readonly rowGap?: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function computeTileSize(box: MeasuredBox | null, wordLength: number, options: TileSizeOptions = {}): number {
  if (box === null) return TILE_SIZE_FALLBACK;
  const rows = options.rows ?? DEFAULT_ROWS;
  const columnGap = options.columnGap ?? DEFAULT_GAP;
  const rowGap = options.rowGap ?? DEFAULT_GAP;
  const widthBudget = (box.width - columnGap * (wordLength - 1)) / wordLength;
  const heightBudget = (box.height - rowGap * (rows - 1)) / rows;
  return clamp(Math.min(widthBudget, heightBudget), TILE_SIZE_MIN, TILE_SIZE_MAX);
}
