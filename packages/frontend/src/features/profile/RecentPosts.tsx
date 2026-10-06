import { useId, type ReactNode } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { VisuallyHidden } from '@/components/ui/VisuallyHidden';
import { PostCard } from './PostCard';
import styles from './RecentPosts.module.css';
import sectionStyles from './Section.module.css';
import { usePostsByUser } from './usePostsByUser';

/** How many of the person's posts the profile shows (the API returns them all). */
export const RECENT_POSTS_LIMIT = 5;
const SKELETON_COUNT = 2;

export interface RecentPostsProps {
  /** The profile's `user_id` (the posts endpoint does not take the alumni id). */
  userId: number;
}

/**
 * Recent posts: the newest five, each as a PostCard. It owns its states, so a
 * posts failure never hides the rest of the profile (AC9): skeleton cards while
 * loading, an inline message with Retry on error, "No posts yet" when empty.
 */
export function RecentPosts({ userId }: RecentPostsProps) {
  const headingId = useId();
  const posts = usePostsByUser(userId);

  let body: ReactNode;
  if (posts.isPending) {
    body = (
      <div aria-busy="true">
        <VisuallyHidden as="p" role="status">
          Loading posts…
        </VisuallyHidden>
        <div className={styles.list}>
          {Array.from({ length: SKELETON_COUNT }, (_, index) => (
            <Card key={index} className={styles.card} aria-hidden="true">
              <Skeleton />
              <Skeleton className={styles.skeletonMeta} />
            </Card>
          ))}
        </div>
      </div>
    );
  } else if (posts.isError) {
    body = (
      <div className={styles.error}>
        <Alert tone="error" title="Posts didn't load">
          Something went wrong on our side or with the connection. Try again in a moment.
        </Alert>
        <Button
          className={styles.retry}
          loading={posts.isFetching}
          onClick={() => {
            void posts.refetch();
          }}
        >
          Retry
        </Button>
      </div>
    );
  } else if (posts.data.length === 0) {
    body = <p className={styles.empty}>No posts yet</p>;
  } else {
    body = (
      <ul className={styles.list}>
        {posts.data.slice(0, RECENT_POSTS_LIMIT).map((post) => (
          <li key={post.id}>
            <PostCard post={post} />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <section className={sectionStyles.section} aria-labelledby={headingId}>
      <h2 id={headingId} className={sectionStyles.heading}>
        Recent posts
      </h2>
      {body}
    </section>
  );
}
