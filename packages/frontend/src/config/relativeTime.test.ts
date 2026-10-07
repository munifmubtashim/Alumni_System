import { describe, expect, it } from 'vitest';
import { relativeTime } from './relativeTime';

const NOW = new Date('2026-10-07T12:00:00Z');
const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function ago(ms: number): string {
  return new Date(NOW.getTime() - ms).toISOString();
}

describe('relativeTime', () => {
  it('reads "just now" under a minute', () => {
    expect(relativeTime(ago(30 * SECOND), NOW)).toBe('just now');
  });

  it('counts minutes, hours, days and weeks', () => {
    expect(relativeTime(ago(5 * MINUTE), NOW)).toBe('5 minutes ago');
    expect(relativeTime(ago(MINUTE), NOW)).toBe('1 minute ago');
    expect(relativeTime(ago(3 * HOUR), NOW)).toBe('3 hours ago');
    expect(relativeTime(ago(DAY), NOW)).toBe('1 day ago');
    expect(relativeTime(ago(3 * DAY), NOW)).toBe('3 days ago');
    expect(relativeTime(ago(14 * DAY), NOW)).toBe('2 weeks ago');
    expect(relativeTime(ago(35 * DAY), NOW)).toBe('5 weeks ago');
  });

  it('accepts a Date as well as a string', () => {
    expect(relativeTime(new Date(NOW.getTime() - 3 * DAY), NOW)).toBe('3 days ago');
  });

  it('shows a plain date from 6 weeks old', () => {
    const old = new Date(NOW.getTime() - 42 * DAY);
    const expected = new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(old);
    const result = relativeTime(old.toISOString(), NOW);
    expect(result).toBe(expected);
    expect(result).toMatch(/2026/);
    expect(result).not.toMatch(/ago/);
  });

  it('reads a future time as "just now"', () => {
    expect(relativeTime(new Date(NOW.getTime() + 5 * MINUTE).toISOString(), NOW)).toBe('just now');
  });

  it('gives an empty string for an invalid date, never NaN', () => {
    expect(relativeTime('not a date', NOW)).toBe('');
    expect(relativeTime('', NOW)).toBe('');
    expect(relativeTime(new Date(Number.NaN), NOW)).toBe('');
  });
});
