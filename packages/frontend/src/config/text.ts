/**
 * Trimmed text, or undefined when the value is missing or blank. Shared by the
 * directory, profile and admin pages: as lazy features none may import
 * another's copy (ADR-08).
 */
export function present(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed === undefined || trimmed === '' ? undefined : trimmed;
}
