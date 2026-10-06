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

/** "Job title at Company · Class of YYYY"; any missing part is left out with its separator. */
export function headline(
  alumni: Pick<Alumni, 'job_title' | 'current_company' | 'graduation_year'>,
): string | undefined {
  const role = joinParts([present(alumni.job_title), present(alumni.current_company)], ' at ');
  return joinParts([role, classOf(alumni.graduation_year)], ' · ');
}

/** "Department · Class of YYYY", for the Education entry. */
export function educationLine(
  alumni: Pick<Alumni, 'department' | 'graduation_year'>,
): string | undefined {
  return joinParts([present(alumni.department), classOf(alumni.graduation_year)], ' · ');
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
