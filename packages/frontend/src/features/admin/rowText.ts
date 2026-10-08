import type { AlumniListItem } from '@alumni/shared';
import { present } from '@/config/text';

/** The toast when an edit or delete finds the alumni already deleted (404). */
export const GONE_TEXT = 'This alumni no longer exists';

/** Shown in place of a missing name in the row and in the action buttons' names. */
export const UNNAMED = 'Unnamed alumni';

/** The row's trimmed name, or `UNNAMED`. */
export function alumniName(row: AlumniListItem): string {
  const name = row.name?.trim() ?? '';
  return name === '' ? UNNAMED : name;
}

/** The phone card's second line, "2017 · Product Design", from whichever parts exist. */
export function cardDetail(row: AlumniListItem): string {
  const year =
    row.graduation_year === null || row.graduation_year === undefined
      ? undefined
      : String(row.graduation_year);
  return [year, present(row.department)].filter((part) => part !== undefined).join(' · ');
}
