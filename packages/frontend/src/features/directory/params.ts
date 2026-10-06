/**
 * The directory's list state lives in the URL query string (ADR-08). These
 * pure helpers read and write it. Anything the API would answer 400 to is
 * ignored on read, so a hand-edited or stale URL never breaks the request.
 * Limits match `GET /api/alumni` (conventions.md → Pagination).
 *
 * The numbers below are copies of the backend's, not imports: keep them in sync
 * with `packages/backend/src/businessLogic/src/validation.ts` (`MAX_PAGE`,
 * `NAME_MAX` for `q`, `DEPARTMENT_MAX`, `UNIVERSITY_MAX`, and the 1900 / now + 10
 * year window in `optionalYear`). If the API's limit changes and this file does
 * not, the page sends a value the API answers 400 to and shows the error state.
 */

export const MAX_PAGE = 10000;
export const MIN_GRADUATION_YEAR = 1900;
/** The latest accepted year is the current year plus this many. */
export const GRADUATION_YEARS_AHEAD = 10;
export const Q_MAX_LENGTH = 100;
export const DEPARTMENT_MAX_LENGTH = 100;
export const UNIVERSITY_MAX_LENGTH = 150;

export interface DirectoryFilters {
  q?: string;
  department?: string;
  university?: string;
  graduationYear?: number;
}

export interface DirectoryParams extends DirectoryFilters {
  /** 1-based; 1 when absent or invalid. */
  page: number;
}

// NUL and other control characters: Postgres rejects NUL, the API answers 400 (G23).
// eslint-disable-next-line no-control-regex
const CONTROL_CHARACTER = /[\u0000-\u001f\u007f]/;
// eslint-disable-next-line no-control-regex
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/g;

/**
 * `value` with each control character (a pasted tab or line break) turned into
 * a space, so what is written to the URL is what the reader keeps.
 */
export function stripControlCharacters(value: string): string {
  return value.replace(CONTROL_CHARACTERS, ' ');
}

function writableText(value: string | undefined): string | undefined {
  return value === undefined ? undefined : stripControlCharacters(value).trim();
}

/** The one value of `key`, or undefined when it is missing or repeated. */
function singleValue(search: URLSearchParams, key: string): string | undefined {
  const values = search.getAll(key);
  return values.length === 1 ? values[0] : undefined;
}

function parseText(value: string | undefined, max: number): string | undefined {
  if (value === undefined || CONTROL_CHARACTER.test(value)) return undefined;
  const trimmed = value.trim();
  if (trimmed === '' || trimmed.length > max) return undefined;
  return trimmed;
}

/** True for a 4-digit year from 1900 to the current year + 10. */
export function isValidGraduationYear(value: string, now: Date = new Date()): boolean {
  const trimmed = value.trim();
  if (!/^\d{4}$/.test(trimmed)) return false;
  const year = Number(trimmed);
  return year >= MIN_GRADUATION_YEAR && year <= now.getFullYear() + GRADUATION_YEARS_AHEAD;
}

function parsePage(value: string | undefined): number {
  if (value === undefined || !/^\d+$/.test(value.trim())) return 1;
  const page = Number(value.trim());
  return page >= 1 && page <= MAX_PAGE ? page : 1;
}

export function parseDirectoryParams(
  search: URLSearchParams,
  now: Date = new Date(),
): DirectoryParams {
  const params: DirectoryParams = { page: parsePage(singleValue(search, 'page')) };
  const q = parseText(singleValue(search, 'q'), Q_MAX_LENGTH);
  const department = parseText(singleValue(search, 'department'), DEPARTMENT_MAX_LENGTH);
  const university = parseText(singleValue(search, 'university'), UNIVERSITY_MAX_LENGTH);
  const year = singleValue(search, 'graduationYear');
  if (q !== undefined) params.q = q;
  if (department !== undefined) params.department = department;
  if (university !== undefined) params.university = university;
  if (year !== undefined && isValidGraduationYear(year, now)) {
    params.graduationYear = Number(year.trim());
  }
  return params;
}

/**
 * The query string for `params`: empty values and page 1 are left out, so the
 * plain directory URL has no query string at all. Control characters become
 * spaces, since `parseDirectoryParams` would drop the whole value.
 */
export function toSearchParams(params: DirectoryParams): URLSearchParams {
  const search = new URLSearchParams();
  const q = writableText(params.q);
  const department = writableText(params.department);
  const university = writableText(params.university);
  if (q) search.set('q', q);
  if (department) search.set('department', department);
  if (university) search.set('university', university);
  if (params.graduationYear !== undefined) {
    search.set('graduationYear', String(params.graduationYear));
  }
  if (params.page > 1) search.set('page', String(params.page));
  return search;
}
