const CUBIC_BEZIER_PATTERN = /^cubic-bezier\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)$/;

export type CubicBezierControlPoints = readonly [number, number, number, number];

// Reads a CSS cubic-bezier() token (e.g. ui-tokens' `ease-pop`) as the four control points
// RN's Easing.bezier(x1, y1, x2, y2) expects.
export function parseCubicBezier(value: string): CubicBezierControlPoints {
  const match = CUBIC_BEZIER_PATTERN.exec(value);
  if (!match) throw new Error(`Invalid cubic-bezier value: ${value}`);
  const [, x1, y1, x2, y2] = match;
  return [Number(x1), Number(y1), Number(x2), Number(y2)];
}
