import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { formatCount } from './formatCount';
import styles from './AdminPagination.module.css';

export interface AdminPaginationProps {
  /** The current page, 1-based. */
  page: number;
  totalPages: number;
  /** Rows on this page. */
  shown: number;
  /** Every match, on all pages. */
  total: number;
  onPageChange: (page: number) => void;
}

/**
 * The table footer (S6): "Showing <n> of <total>" and Prev / Next, on phones
 * too (S6 phone has none: a recorded deviation). Prev is disabled on page 1,
 * Next on the last page. The count is a polite live region, so a page change
 * is announced. A click that reaches an edge disables the clicked button, so
 * focus moves to the other one instead of falling to the page.
 */
export function AdminPagination({
  page,
  totalPages,
  shown,
  total,
  onPageChange,
}: AdminPaginationProps) {
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  // The other button is still disabled until the new page renders, so focus
  // moves after that render, once it can take focus.
  const pendingFocus = useRef<'prev' | 'next' | null>(null);
  useEffect(() => {
    const target = pendingFocus.current === 'prev' ? prevRef.current : nextRef.current;
    if (pendingFocus.current === null || target === null || target.disabled) return;
    pendingFocus.current = null;
    target.focus();
  });

  const goTo = (target: number) => {
    if (target <= 1) pendingFocus.current = 'next';
    else if (target >= totalPages) pendingFocus.current = 'prev';
    onPageChange(target);
  };

  return (
    <div className={styles.footer}>
      <p className={styles.count} aria-live="polite">
        Showing {formatCount(shown)} of {formatCount(total)}
      </p>
      <nav aria-label="Pagination" className={styles.buttons}>
        <Button
          ref={prevRef}
          className={styles.step}
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => {
            goTo(page - 1);
          }}
        >
          Prev
        </Button>
        <Button
          ref={nextRef}
          className={styles.step}
          aria-label="Next page"
          disabled={page >= totalPages}
          onClick={() => {
            goTo(page + 1);
          }}
        >
          Next
        </Button>
      </nav>
    </div>
  );
}
