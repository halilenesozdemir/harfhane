import { describe, it, expect } from 'vitest';
import { timingSafeEqual } from '../../src/utils/timing-safe';

describe('timingSafeEqual', () => {
  it('should return true when both strings are identical', async () => {
    expect(await timingSafeEqual('abc123', 'abc123')).toBe(true);
  });

  it('should return false when same-length strings differ', async () => {
    expect(await timingSafeEqual('abc123', 'abc124')).toBe(false);
  });

  it('should return false when one string is a prefix of the other', async () => {
    expect(await timingSafeEqual('abc', 'abc123')).toBe(false);
    expect(await timingSafeEqual('abc123', 'abc')).toBe(false);
  });

  it('should return false when one side is empty', async () => {
    expect(await timingSafeEqual('', 'abc')).toBe(false);
  });

  it('should return true when both strings hold the same multi-byte characters', async () => {
    expect(await timingSafeEqual('şifreİ', 'şifreİ')).toBe(true);
    expect(await timingSafeEqual('şifreİ', 'şifreI')).toBe(false);
  });
});
