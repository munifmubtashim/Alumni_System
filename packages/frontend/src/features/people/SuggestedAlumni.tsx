import { useId, type ReactNode } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { VisuallyHidden } from '@/components/ui/VisuallyHidden';
import { cx } from '@/components/ui/cx';
import { PersonRow, PersonRowSkeleton } from './PersonRow';
import styles from './SuggestedAlumni.module.css';
import { useSuggestedAlumni } from './useSuggestedAlumni';

const SKELETON_COUNT = 3;

const HEADINGS = { 2: 'h2', 3: 'h3', 4: 'h4' } as const;

export interface SuggestedAlumniProps {
  /** The title's heading level, so it fits the parent page's outline. Default 2. */
  headingLevel?: keyof typeof HEADINGS;
  /** Placement from the parent (grid area, margins). */
  className?: string;
}

/**
 * "Suggested alumni": a card listing the people `GET /api/alumni/suggestions`
 * returns, each a `PersonRow`. Used by Home and the Feed sidebar (REQ-016).
 * It owns its states, so its failure never reaches the parent: skeleton rows
 * while loading, an inline message with Retry on error, a short note when
 * there is nobody to suggest. A failed background refetch keeps the people
 * already shown. The loading status sits outside the aria-busy skeletons so
 * it is announced (as in the profile's Recent posts).
 */
export function SuggestedAlumni({ headingLevel = 2, className }: SuggestedAlumniProps) {
  const headingId = useId();
  const suggestions = useSuggestedAlumni();
  const Heading = HEADINGS[headingLevel];

  let body: ReactNode;
  if (suggestions.isPending) {
    body = (
      <>
        <VisuallyHidden as="p" role="status">
          Loading suggestions…
        </VisuallyHidden>
        <div className={styles.list} aria-busy="true">
          {Array.from({ length: SKELETON_COUNT }, (_, index) => (
            <PersonRowSkeleton key={index} />
          ))}
        </div>
      </>
    );
  } else if (suggestions.isError && suggestions.data === undefined) {
    body = (
      <div className={styles.error}>
        <Alert tone="error" title="Suggestions didn't load">
          Something went wrong on our side or with the connection. Try again in a moment.
        </Alert>
        <Button
          className={styles.retry}
          loading={suggestions.isFetching}
          onClick={() => {
            void suggestions.refetch();
          }}
        >
          Retry
        </Button>
      </div>
    );
  } else if (suggestions.data.length === 0) {
    body = <p className={styles.empty}>No suggestions yet. Check back as more alumni join.</p>;
  } else {
    body = (
      <ul className={styles.list}>
        {suggestions.data.map((person) => (
          <li key={person.id}>
            <PersonRow person={person} />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <Card as="section" aria-labelledby={headingId} className={cx(styles.card, className)}>
      <Heading id={headingId} className={styles.heading}>
        Suggested alumni
      </Heading>
      {body}
    </Card>
  );
}
