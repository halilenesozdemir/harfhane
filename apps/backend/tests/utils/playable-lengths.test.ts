import { describe, it, expect } from 'vitest';
import { parsePlayableLengths } from '../../src/utils/playable-lengths';

describe('parsePlayableLengths', () => {
  it('should default to [5] when the value is undefined', () => {
    expect(parsePlayableLengths(undefined)).toEqual([5]);
  });

  it('should default to [5] when the value is empty', () => {
    expect(parsePlayableLengths('')).toEqual([5]);
  });

  it('should parse a single scheduled length', () => {
    expect(parsePlayableLengths('5')).toEqual([5]);
  });

  it('should parse multiple comma-separated scheduled lengths, sorted ascending', () => {
    expect(parsePlayableLengths('6,4')).toEqual([4, 6]);
  });

  it('should trim whitespace around values', () => {
    expect(parsePlayableLengths(' 4 , 5 ')).toEqual([4, 5]);
  });

  it('should drop duplicate lengths', () => {
    expect(parsePlayableLengths('5,5,4')).toEqual([4, 5]);
  });

  it('should drop lengths that are not scheduled', () => {
    expect(parsePlayableLengths('5,7,0,abc')).toEqual([5]);
  });

  it('should default to [5] when every value is invalid', () => {
    expect(parsePlayableLengths('7,0,abc')).toEqual([5]);
  });
});
