import { describe, expect, it } from 'vitest';
import { parseCubicBezier } from './cubicBezier';

describe('parseCubicBezier', () => {
  it('should parse a cubic-bezier CSS string into its four control points', () => {
    expect(parseCubicBezier('cubic-bezier(0.34, 1.56, 0.64, 1)')).toEqual([0.34, 1.56, 0.64, 1]);
  });

  it('should parse values with no space after the commas', () => {
    expect(parseCubicBezier('cubic-bezier(0.34,1.56,0.64,1)')).toEqual([0.34, 1.56, 0.64, 1]);
  });

  it('should throw when the value is not a cubic-bezier string', () => {
    expect(() => parseCubicBezier('ease-in-out')).toThrow('Invalid cubic-bezier value: ease-in-out');
  });

  it('should throw when the value has the wrong number of control points', () => {
    expect(() => parseCubicBezier('cubic-bezier(0.34, 1.56, 0.64)')).toThrow('Invalid cubic-bezier value: cubic-bezier(0.34, 1.56, 0.64)');
  });
});
