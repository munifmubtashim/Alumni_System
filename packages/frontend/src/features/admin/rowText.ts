import type { AlumniListItem } from '@alumni/shared';

/** Shown in place of a missing name in the row and in the action buttons' names. */
export const UNNAMED = 'Unnamed alumni';

/** The row's trimmed name, or `UNNAMED`. */
export function alumniName(row: AlumniListItem): string {
  const name = row.name?.trim() ?? '';
  return name === '' ? UNNAMED : name;
}

/** Trimmed text, or undefined when there is none. */
export function present(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim() ?? '';
  return trimmed === '' ? undefined : trimmed;
}

/** The phone card's second line, "2017 · Product Design", from whichever parts exist. */
export function cardDetail(row: AlumniListItem): string {
  const year =
    row.graduation_year === null || row.graduation_year === undefined
      ? undefined
      : String(row.graduation_year);
  return [year, present(row.department)].filter((part) => part !== undefined).join(' · ');
}
