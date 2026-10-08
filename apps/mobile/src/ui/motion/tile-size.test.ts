import { describe, expect, it } from 'vitest';
import { TILE_SIZE_FALLBACK, TILE_SIZE_MAX, TILE_SIZE_MIN, computeTileSize } from './tile-size';

const ROWS = 6;
const GAP = 6;

describe('computeTileSize', () => {
  it('should return the fallback size when the box has not been measured yet', () => {
    expect(computeTileSize(null, 5)).toBe(TILE_SIZE_FALLBACK);
  });

  it('should size tiles from the available width when width is the tighter budget', () => {
    // width budget: (300 - 4*6) / 5 = 55.2; height budget: (900 - 5*6) / 6 = 145
    const size = computeTileSize({ width: 300, height: 900 }, 5);
    expect(size).toBeCloseTo(55.2, 1);
  });

  it('should size tiles from the available height when height is the tighter budget', () => {
    // width budget: (400 - 4*6) / 5 = 75.2; height budget: (300 - 5*6) / 6 = 45
    const size = computeTileSize({ width: 400, height: 300 }, 5);
    expect(size).toBe(45);
  });

  it('should clamp to the minimum tile size when the computed size is smaller', () => {
    const size = computeTileSize({ width: 100, height: 100 }, 5);
    expect(size).toBe(TILE_SIZE_MIN);
  });

  it('should clamp to the maximum tile size when the computed size is larger', () => {
    const size = computeTileSize({ width: 1000, height: 1000 }, 5);
    expect(size).toBe(TILE_SIZE_MAX);
  });

  it('should subtract the row gaps from the height budget, not ignore them', () => {
    const withGap = computeTileSize({ width: 400, height: 300 }, 5, { rows: ROWS, columnGap: GAP, rowGap: GAP });
    const withoutGap = computeTileSize({ width: 400, height: 300 }, 5, { rows: ROWS, columnGap: GAP, rowGap: 0 });
    expect(withoutGap).toBeGreaterThan(withGap);
  });

  it('should subtract the column gaps from the width budget, not ignore them', () => {
    const withGap = computeTileSize({ width: 300, height: 900 }, 5, { rows: ROWS, columnGap: GAP, rowGap: GAP });
    const withoutGap = computeTileSize({ width: 300, height: 900 }, 5, { rows: ROWS, columnGap: 0, rowGap: GAP });
    expect(withoutGap).toBeGreaterThan(withGap);
  });
});
