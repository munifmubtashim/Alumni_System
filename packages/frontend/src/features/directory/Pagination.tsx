import { Button } from '@/components/ui/Button';
import { pageWindow } from './pageWindow';
import styles from './Pagination.module.css';

export interface PaginationProps {
  /** The current page, 1-based. */
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/**
 * Prev / page numbers / Next. From 48rem the numbers show (with "…" gaps);
 * below it they are swapped for "Page x of y". Both are always in the DOM
 * and toggled by CSS class, never by the hidden attribute (G18).
 * Renders nothing when there is only one page.
 */
export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Pagination" className={styles.pagination}>
      <Button
        className={styles.step}
        aria-label="Previous page"
        disabled={page <= 1}
        onClick={() => {
          onPageChange(page - 1);
        }}
      >
        Prev
      </Button>
      <ul className={styles.pages}>
        {pageWindow(page, totalPages).map((slot, index) =>
          slot === 'ellipsis' ? (
            // Two gaps never sit next to each other, so the index is stable.
            <li key={`gap-${String(index)}`} aria-hidden="true" className={styles.gap}>
              …
            </li>
          ) : (
            <li key={slot}>
              <Button
                className={styles.number}
                variant={slot === page ? 'primary' : 'secondary'}
                aria-label={`Page ${String(slot)}`}
                aria-current={slot === page ? 'page' : undefined}
                onClick={() => {
                  onPageChange(slot);
                }}
              >
                {slot}
              </Button>
            </li>
          ),
        )}
      </ul>
      <span className={styles.summary}>
        Page {page} of {totalPages}
      </span>
      <Button
        className={styles.step}
        aria-label="Next page"
        disabled={page >= totalPages}
        onClick={() => {
          onPageChange(page + 1);
        }}
      >
        Next
      </Button>
    </nav>
  );
}
