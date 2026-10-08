import { describe, expect, it } from 'vitest';
import { present } from './text';

describe('present', () => {
  it('trims text and treats missing or blank values as undefined', () => {
    expect(present('  Ana  ')).toBe('Ana');
    expect(present('   ')).toBeUndefined();
    expect(present('')).toBeUndefined();
    expect(present(null)).toBeUndefined();
    expect(present(undefined)).toBeUndefined();
  });
});
