import { describe, it, expect } from 'vitest';
import { timingSafeEqual } from '../../src/utils/timing-safe';

describe('timingSafeEqual', () => {
  it('should return true when both strings are identical', () => {
    expect(timingSafeEqual('abc123', 'abc123')).toBe(true);
  });

  it('should return false when same-length strings differ', () => {
    expect(timingSafeEqual('abc123', 'abc124')).toBe(false);
  });

  it('should return false when one string is a prefix of the other', () => {
    expect(timingSafeEqual('abc', 'abc123')).toBe(false);
    expect(timingSafeEqual('abc123', 'abc')).toBe(false);
  });

  it('should return false when one side is empty', () => {
    expect(timingSafeEqual('', 'abc')).toBe(false);
  });

  it('should return true when both strings hold the same multi-byte characters', () => {
    expect(timingSafeEqual('şifreİ', 'şifreİ')).toBe(true);
    expect(timingSafeEqual('şifreİ', 'şifreI')).toBe(false);
  });
});
