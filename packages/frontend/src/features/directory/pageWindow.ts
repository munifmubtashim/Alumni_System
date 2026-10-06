/** One slot in the pagination row: a page number or a gap ("…"). */
export type PageSlot = number | 'ellipsis';

/**
 * The page numbers to show for `page` of `totalPages`, with gaps as
 * 'ellipsis'. Always the first and last page, plus a run of three around
 * the current page (current ± 1), shifted inward at the ends so page 1 of 24
 * reads 1 2 3 … 24 as in the design. A gap that would hide a single page
 * shows that page instead, since "…" is no shorter than the number.
 * Out-of-range input is clamped; returns [] when there are no pages.
 */
export function pageWindow(page: number, totalPages: number): PageSlot[] {
  const total = Math.max(0, Math.floor(totalPages));
  if (total === 0) return [];
  const current = Math.min(Math.max(1, Math.floor(page)), total);

  let start = Math.max(1, current - 1);
  let end = Math.min(total, current + 1);
  if (current === 1) end = Math.min(total, 3);
  if (current === total) start = Math.max(1, total - 2);

  const slots: PageSlot[] = [1];
  if (start > 3) slots.push('ellipsis');
  else for (let n = 2; n < start; n++) slots.push(n);
  for (let n = Math.max(2, start); n <= Math.min(end, total - 1); n++) slots.push(n);
  if (end < total - 2) slots.push('ellipsis');
  else for (let n = Math.max(end + 1, 2); n < total; n++) slots.push(n);
  if (total > 1) slots.push(total);
  return slots;
}
