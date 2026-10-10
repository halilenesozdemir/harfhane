import { describe, it, expect } from 'vitest';
import { useEntitlements } from './useEntitlements';

describe('useEntitlements', () => {
  it('should report non-premium when no purchase exists', () => {
    expect(useEntitlements()).toEqual({ isSupporter: false });
  });
});
