const LOCALE = 'en';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
/** Up to this many weeks old reads "N weeks ago"; anything older shows a plain date. */
const MAX_WEEKS = 5;

const relative = new Intl.RelativeTimeFormat(LOCALE, { numeric: 'always', style: 'long' });
const plainDate = new Intl.DateTimeFormat(LOCALE, { dateStyle: 'medium' });

/**
 * "just now", "5 minutes ago", "3 hours ago", "3 days ago", "2 weeks ago"; older than 5 weeks
 * gives a medium date ("Aug 26, 2026"). A future time (clock skew) reads "just now"; an
 * invalid date gives an empty string, never "NaN" or "Invalid Date".
 */
export function relativeTime(iso: string | Date, now: Date = new Date()): string {
  const date = iso instanceof Date ? iso : new Date(iso);
  const time = date.getTime();
  if (Number.isNaN(time) || Number.isNaN(now.getTime())) return '';

  const elapsed = now.getTime() - time;
  if (elapsed < MINUTE) return 'just now';
  if (elapsed < HOUR) return relative.format(-Math.floor(elapsed / MINUTE), 'minute');
  if (elapsed < DAY) return relative.format(-Math.floor(elapsed / HOUR), 'hour');
  if (elapsed < WEEK) return relative.format(-Math.floor(elapsed / DAY), 'day');
  const weeks = Math.floor(elapsed / WEEK);
  if (weeks <= MAX_WEEKS) return relative.format(-weeks, 'week');
  return plainDate.format(date);
}
