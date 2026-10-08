import { describe, expect, it } from 'vitest';
import { pageWindow } from './pageWindow';

describe('pageWindow', () => {
  it('returns nothing for zero pages and a single page for one', () => {
    expect(pageWindow(1, 0)).toEqual([]);
    expect(pageWindow(1, 1)).toEqual([1]);
  });

  it('shows every page when there are few', () => {
    expect(pageWindow(1, 2)).toEqual([1, 2]);
    expect(pageWindow(2, 2)).toEqual([1, 2]);
    expect(pageWindow(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(pageWindow(3, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(pageWindow(5, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it('matches the design on the first page of 24', () => {
    expect(pageWindow(1, 24)).toEqual([1, 2, 3, 'ellipsis', 24]);
  });

  it('keeps current ± 1 with gaps on both sides in the middle', () => {
    expect(pageWindow(12, 24)).toEqual([1, 'ellipsis', 11, 12, 13, 'ellipsis', 24]);
  });

  it('mirrors the first page on the last page', () => {
    expect(pageWindow(24, 24)).toEqual([1, 'ellipsis', 22, 23, 24]);
  });

  it('shows a lone hidden page instead of an ellipsis', () => {
    expect(pageWindow(4, 24)).toEqual([1, 2, 3, 4, 5, 'ellipsis', 24]);
    expect(pageWindow(21, 24)).toEqual([1, 'ellipsis', 20, 21, 22, 23, 24]);
  });

  it('clamps an out-of-range page', () => {
    expect(pageWindow(0, 24)).toEqual(pageWindow(1, 24));
    expect(pageWindow(99, 24)).toEqual(pageWindow(24, 24));
  });
});
