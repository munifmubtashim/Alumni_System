import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { VisuallyHidden } from '@/components/ui/VisuallyHidden';
import styles from './FeedStates.module.css';

const SKELETON_COUNT = 3;

export const EMPTY_HEADING = 'No posts yet';

/**
 * Loading: a polite status line, then decorative skeleton cards. The status
 * line sits outside the aria-busy region so it is announced (G30).
 */
export function FeedSkeleton() {
  return (
    <>
      <VisuallyHidden as="p" role="status">
        Loading posts…
      </VisuallyHidden>
      <div className={styles.list} aria-busy="true">
        {Array.from({ length: SKELETON_COUNT }, (_, index) => (
          <Card key={index} className={styles.card} aria-hidden="true">
            <div className={styles.skeletonHeader}>
              <Skeleton shape="circle" className={styles.skeletonAvatar} />
              <div className={styles.skeletonByline}>
                <Skeleton className={styles.skeletonName} />
                <Skeleton className={styles.skeletonTime} />
              </div>
            </div>
            <Skeleton />
            <Skeleton className={styles.skeletonShort} />
          </Card>
        ))}
      </div>
    </>
  );
}

/** S4-EmptyFeed: chat icon in a circle, "No posts yet" and a nudge to post. */
export function EmptyFeed() {
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
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </span>
      <div className={styles.copy}>
        <h2 className={styles.heading}>{EMPTY_HEADING}</h2>
        <p className={styles.text}>
          When alumni and students start sharing updates, they'll show up here. Be the first to post
          something.
        </p>
      </div>
    </div>
  );
}

export interface FeedLoadErrorProps {
  onRetry: () => void;
  /** True while the retry is in flight: the button shows busy and is disabled. */
  retrying?: boolean;
}

/** The feed failed to load: a message and Retry. A 401 never gets here (ADR-03). */
export function FeedLoadError({ onRetry, retrying = false }: FeedLoadErrorProps) {
  return (
    <div className={styles.error}>
      <Alert tone="error" title="The feed didn't load">
        Something went wrong on our side or with the connection. Try again in a moment.
      </Alert>
      <Button className={styles.button} loading={retrying} onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}

export interface LoadMoreProps {
  onLoadMore: () => void;
  /** True while the next page loads. */
  loading: boolean;
  /** True when loading the next page failed; Load more then retries it. */
  failed: boolean;
}

/** "Load more" under the list (the API has no total: a short page ends it). */
export function LoadMore({ onLoadMore, loading, failed }: LoadMoreProps) {
  return (
    <div className={styles.more}>
      {failed && <Alert tone="error">More posts didn't load. Try again in a moment.</Alert>}
      <Button className={styles.button} loading={loading} onClick={onLoadMore}>
        Load more
      </Button>
    </div>
  );
}
