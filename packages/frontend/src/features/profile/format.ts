import type { Alumni } from '@alumni/shared';

/** The trimmed text, or undefined when the value is missing or blank. */
export function present(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed === undefined || trimmed === '' ? undefined : trimmed;
}

function classOf(year: number | null | undefined): string | undefined {
  return typeof year === 'number' && Number.isFinite(year) ? `Class of ${String(year)}` : undefined;
}

function joinParts(parts: (string | undefined)[], separator: string): string | undefined {
  const kept = parts.filter((part): part is string => part !== undefined);
  return kept.length > 0 ? kept.join(separator) : undefined;
}

function yearOf(year: number | null | undefined): string | undefined {
  return typeof year === 'number' && Number.isFinite(year) ? String(year) : undefined;
}

/**
 * The line under the name: "<headline> · Class of YYYY", where the headline is
 * the alumnus's own text or, when they wrote none, "Job title at Company" (as
 * before REQ-011). Any missing part is left out with its separator.
 */
export function headline(
  alumni: Pick<Alumni, 'headline' | 'job_title' | 'current_company' | 'graduation_year'>,
): string | undefined {
  const role =
    present(alumni.headline) ??
    joinParts([present(alumni.job_title), present(alumni.current_company)], ' at ');
  return joinParts([role, classOf(alumni.graduation_year)], ' · ');
}

/**
 * "B.Sc. Product Design · 2013–2017" (S3). With one year, that year alone; with
 * no degree, the years alone; undefined when all three are missing.
 */
export function degreeLine(
  degree: string | null | undefined,
  startYear: number | null | undefined,
  graduationYear: number | null | undefined,
): string | undefined {
  const start = yearOf(startYear);
  const end = yearOf(graduationYear);
  const years =
    start !== undefined && end !== undefined && start !== end ? `${start}–${end}` : (start ?? end);
  return joinParts([present(degree), years], ' · ');
}

/**
 * The Education entry's line. With a degree or a start year: the degree line,
 * the department standing in for a missing degree ("Design · 2013–2017").
 * Otherwise "Department · Class of YYYY", as before REQ-011.
 */
export function educationLine(
  alumni: Pick<Alumni, 'department' | 'graduation_year' | 'degree' | 'start_year'>,
): string | undefined {
  const degree = present(alumni.degree);
  const department = present(alumni.department);
  if (degree !== undefined || yearOf(alumni.start_year) !== undefined) {
    return degreeLine(degree ?? department, alumni.start_year, alumni.graduation_year);
  }
  return joinParts([department, classOf(alumni.graduation_year)], ' · ');
}

/** "Job title · Company", for the Employment entry. */
export function employmentTitle(
  alumni: Pick<Alumni, 'job_title' | 'current_company'>,
): string | undefined {
  return joinParts([present(alumni.job_title), present(alumni.current_company)], ' · ');
}

/** A normalised absolute http(s) URL, or undefined for anything else (javascript:, data:, relative, malformed). */
export function safeLinkedInUrl(raw: string | null | undefined): string | undefined {
  const value = present(raw);
  if (value === undefined) return undefined;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return undefined;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return undefined;
  if (url.hostname === '') return undefined;
  return url.href;
}

/** "0 comments", "1 comment", "14 comments". */
export function commentCountText(count: number): string {
  const n = Number.isFinite(count) && count > 0 ? Math.trunc(count) : 0;
  return n === 1 ? '1 comment' : `${String(n)} comments`;
}
