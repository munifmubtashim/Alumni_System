import type { AdminStats as AdminStatsData } from '@alumni/shared';
import { useId } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { VisuallyHidden } from '@/components/ui/VisuallyHidden';
import { formatCount } from './formatCount';
import { useAdminStats } from './queries';
import styles from './AdminStats.module.css';

// The user's four labels (spec), in S6's card positions; not S6's own labels.
const CARDS: readonly { key: keyof AdminStatsData; label: string }[] = [
  { key: 'alumni', label: 'Total alumni' },
  { key: 'students', label: 'Students' },
  { key: 'posts', label: 'Posts' },
  { key: 'mentors', label: 'Mentors available' },
];

/**
 * The four stat cards (S6): a row of four from 48rem, a 2×2 grid below.
 * Loading shows a skeleton in each value; a failed request shows an error
 * with Retry in place of the cards. It owns its own query, so the table
 * below renders whatever happens here.
 */
export function AdminStats() {
  const titleId = useId();
  const { data, isPending, isError, isFetching, refetch } = useAdminStats();

  let body;
  if (isError) {
    body = (
      <div className={styles.error}>
        <Alert tone="error" title="The counts didn't load">
          Something went wrong on our side or with the connection. Try again in a moment.
        </Alert>
        <Button
          loading={isFetching}
          onClick={() => {
            void refetch();
          }}
        >
          Retry
        </Button>
      </div>
    );
  } else {
    body = (
      <dl className={styles.cards} aria-busy={isPending ? true : undefined}>
        {CARDS.map(({ key, label }) => (
          <div key={key} className={styles.card}>
            <dt className={styles.label}>{label}</dt>
            <dd className={styles.value}>
              {isPending ? <Skeleton className={styles.skeleton} /> : formatCount(data[key])}
            </dd>
          </div>
        ))}
      </dl>
    );
  }

  return (
    <section aria-labelledby={titleId}>
      <VisuallyHidden as="h2" id={titleId}>
        Overview
      </VisuallyHidden>
      {body}
    </section>
  );
}
