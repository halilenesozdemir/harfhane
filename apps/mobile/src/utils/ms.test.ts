import { describe, expect, it } from 'vitest';
import { parseMs } from './ms';

describe('parseMs', () => {
  it('should convert a ms string to a number when the value is an integer', () => {
    expect(parseMs('500ms')).toBe(500);
  });

  it('should convert a ms string to a number when the value is a decimal', () => {
    expect(parseMs('10.5ms')).toBe(10.5);
  });

  it('should throw when the value has no ms suffix', () => {
    expect(() => parseMs('500')).toThrow('Invalid ms value: 500');
  });

  it('should throw when the value is not numeric', () => {
    expect(() => parseMs('abcms')).toThrow('Invalid ms value: abcms');
  });
});
