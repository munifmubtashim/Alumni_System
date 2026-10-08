// One formatter, built once. The locale is pinned so a count always reads
// "1,842" (S6), whatever the browser's language (G29).
const COUNT_FORMAT = new Intl.NumberFormat('en-US');

/** `n` with thousands separators, e.g. 1842 → "1,842". */
export function formatCount(n: number): string {
  return COUNT_FORMAT.format(n);
}
