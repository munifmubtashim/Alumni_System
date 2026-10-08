import { describe, expect, it } from 'vitest';
import { formatCount } from './formatCount';

describe('formatCount', () => {
  it.each([
    [0, '0'],
    [312, '312'],
    [1842, '1,842'],
    [1234567, '1,234,567'],
  ])('formats %d as %s', (value, expected) => {
    expect(formatCount(value)).toBe(expected);
  });
});
