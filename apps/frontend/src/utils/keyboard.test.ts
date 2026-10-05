import { describe, expect, it } from 'vitest';
import { letterFromKey } from './keyboard';

describe('letterFromKey', () => {
  it('should return dotted capital İ when the key is lowercase i', () => {
    expect(letterFromKey('i')).toBe('İ');
  });

  it('should return dotless capital I when the key is ı', () => {
    expect(letterFromKey('ı')).toBe('I');
  });

  it('should uppercase Turkish letters when the key is lowercase', () => {
    expect(['ğ', 'ü', 'ş', 'ö', 'ç', 'a'].map(letterFromKey)).toEqual(['Ğ', 'Ü', 'Ş', 'Ö', 'Ç', 'A']);
  });

  it('should keep capital letters when shift is held', () => {
    expect(['İ', 'I', 'Ş'].map(letterFromKey)).toEqual(['İ', 'I', 'Ş']);
  });

  it('should return null when the key is not a single letter', () => {
    expect(['Enter', 'Backspace', '1', ' ', 'é'].map(letterFromKey)).toEqual([null, null, null, null, null]);
  });
});
