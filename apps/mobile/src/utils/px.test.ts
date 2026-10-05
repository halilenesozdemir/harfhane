import { describe, expect, it } from 'vitest';
import { parsePx } from './px';

describe('parsePx', () => {
  it('should convert a px string to a number when the value is an integer', () => {
    expect(parsePx('14px')).toBe(14);
  });

  it('should convert a px string to a number when the value is a decimal', () => {
    expect(parsePx('10.5px')).toBe(10.5);
  });

  it('should throw when the value has no px suffix', () => {
    expect(() => parsePx('14')).toThrow('Invalid px value: 14');
  });

  it('should throw when the value is not numeric', () => {
    expect(() => parsePx('abcpx')).toThrow('Invalid px value: abcpx');
  });
});
