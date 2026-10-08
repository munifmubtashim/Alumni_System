import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import type { DirectoryFilters } from './params';
import styles from './DirectoryStates.module.css';

/**
 * Names the active search and filters for the empty state, e.g.
 * `"marine biology" with Grad. year 2022`. Labels match the filter chips.
 * Returns '' when nothing is active.
 */
function describeFilters({ q, department, university, graduationYear }: DirectoryFilters): string {
  const filters = [
    department !== undefined ? `Department ${department}` : undefined,
    university !== undefined ? `University ${university}` : undefined,
    graduationYear !== undefined ? `Grad. year ${String(graduationYear)}` : undefined,
  ].filter((part): part is string => part !== undefined);

  const filterText = joinWithAnd(filters);
  if (q === undefined) return filterText;
  return filterText === '' ? `"${q}"` : `"${q}" with ${filterText}`;
}

function joinWithAnd(parts: string[]): string {
  if (parts.length <= 1) return parts.join('');
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1] ?? ''}`;
}

export type NoResultsProps =
  /** A search or filter is active and nothing matches. */
  | { variant: 'filtered'; filters: DirectoryFilters; onClearFilters: () => void }
  /** The page number is past the last page (e.g. a stale link). */
  | { variant: 'pastEnd'; onFirstPage: () => void }
  /** No search, no filters, and the directory is empty. */
  | { variant: 'none' };

/** The S2-NoResults layout: icon circle, heading, explanation, one action. */
export function NoResults(props: NoResultsProps) {
  let heading: string;
  let text: string;
  let action: { label: string; onClick: () => void } | undefined;

  switch (props.variant) {
    case 'filtered': {
      const { q, ...rest } = props.filters;
      const description = describeFilters(props.filters);
      const onlySearch = q !== undefined && describeFilters(rest) === '';
      heading = onlySearch ? 'No alumni match this search' : 'No alumni match these filters';
      text = `Try removing a filter or searching a different term — ${description} doesn't match any profiles yet.`;
      action = { label: 'Clear filters', onClick: props.onClearFilters };
      break;
    }
    case 'pastEnd':
      heading = 'Nothing on this page';
      text =
        'This page is past the end of the results. The list may have changed since the link was made.';
      action = { label: 'Back to page 1', onClick: props.onFirstPage };
      break;
    case 'none':
      heading = 'No alumni yet';
      text = 'When alumni add their profiles, they will show up here.';
      action = undefined;
      break;
  }

  return (
    <div className={styles.empty}>
      <span className={styles.iconCircle} aria-hidden="true">
        <svg
          className={styles.icon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          focusable={false}
        >
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </span>
      <div className={styles.copy}>
        <h2 className={styles.heading}>{heading}</h2>
        <p className={styles.text}>{text}</p>
      </div>
      {action !== undefined && (
        <Button variant="primary" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

export interface LoadErrorProps {
  onRetry: () => void;
  /** True while the retry is in flight: the button shows busy and is disabled. */
  retrying?: boolean;
}

/** The directory failed to load: an error message and a Retry button. */
export function LoadError({ onRetry, retrying = false }: LoadErrorProps) {
  return (
    <div className={styles.error}>
      <Alert tone="error" title="The directory didn't load">
        Something went wrong on our side or with the connection. Try again in a moment.
      </Alert>
      <Button className={styles.retry} loading={retrying} onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}
