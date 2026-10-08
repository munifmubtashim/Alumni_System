import type { Post } from '@alumni/shared';
import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { profilePath } from '@/config/directoryReturn';
import { FEED_PATH } from '@/config/feedPath';
import { FEED_QUERY_ROOT } from '@/config/queryKeys';
import { relativeTime } from '@/config/relativeTime';
import { present } from '@/config/text';
import { SectionCard, SectionEmpty, SectionError, SectionLoadingStatus } from '@/features/people';
import { listPosts } from '@/services/postsApi';
import styles from './LatestPosts.module.css';

/** How many posts Home previews. */
export const LATEST_POSTS_LIMIT = 3;
/**
 * Home's own key under the feed root. The feed's optimistic writes touch only
 * their exact keys, so this entry refetches every time Home mounts instead
 * (ADV-004); an admin write's invalidation of `['feed']` reaches it too.
 */
const LATEST_POSTS_KEY = [FEED_QUERY_ROOT, 'latest'] as const;
const UNKNOWN_AUTHOR = 'Unknown member';

function useLatestPosts() {
  return useQuery({
    queryKey: LATEST_POSTS_KEY,
    queryFn: () => listPosts({ limit: LATEST_POSTS_LIMIT, offset: 0 }),
    refetchOnMount: 'always',
  });
}

/** An ISO timestamp for `<time dateTime>`, or undefined for a missing or invalid date. */
function isoDate(value: Date | string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

/**
 * One compact post: avatar, author name (a link to `/alumni/<author_alumni_id>`
 * only when that is set, L-REQ-009-1), relative time and the caption clamped
 * to three lines. Not the feed's PostCard: that lives in the lazy Feed, and
 * importing it would pull the Feed chunk into the main bundle (ADR-08).
 */
function PostPreview({ post }: { post: Post }) {
  const name = present(post.author_name) ?? UNKNOWN_AUTHOR;
  const caption = present(post.caption);
  const dateTime = isoDate(post.created_at);
  const when = dateTime === undefined ? '' : relativeTime(dateTime);
  const alumniId = post.author_alumni_id;

  return (
    <article className={styles.post}>
      <Avatar name={name} photoUrl={present(post.author_photo)} size="sm" />
      <div className={styles.body}>
        <p className={styles.byline}>
          {alumniId === null || alumniId === undefined ? (
            <span className={styles.author}>{name}</span>
          ) : (
            <Link to={profilePath(alumniId)} className={styles.author}>
              {name}
            </Link>
          )}
          {when !== '' && dateTime !== undefined && (
            <>
              <span aria-hidden="true"> · </span>
              <time dateTime={dateTime}>{when}</time>
            </>
          )}
        </p>
        {caption !== undefined && <p className={styles.caption}>{caption}</p>}
      </div>
    </article>
  );
}

/** A placeholder in the preview's shape. Decorative. */
function PostPreviewSkeleton() {
  return (
    <div aria-hidden="true" className={styles.post} data-skeleton="">
      <Skeleton shape="circle" className={styles.skeletonAvatar} />
      <div className={styles.body}>
        <Skeleton className={styles.skeletonByline} />
        <Skeleton />
      </div>
    </div>
  );
}

/**
 * "Latest from the feed": the 3 newest posts from `GET /api/posts?limit=3`,
 * with "See all" to `/feed`. Owns its loading, empty and error states, so a
 * failure never hides the rest of Home; a failed background refetch keeps the
 * posts already shown.
 */
export function LatestPosts() {
  const posts = useLatestPosts();

  let body: ReactNode;
  if (posts.isPending) {
    body = (
      <>
        <SectionLoadingStatus>Loading posts…</SectionLoadingStatus>
        <div className={styles.list} aria-busy="true">
          {Array.from({ length: LATEST_POSTS_LIMIT }, (_, index) => (
            <PostPreviewSkeleton key={index} />
          ))}
        </div>
      </>
    );
  } else if (posts.isError && posts.data === undefined) {
    body = (
      <SectionError
        title="Posts didn't load"
        retrying={posts.isFetching}
        onRetry={() => {
          void posts.refetch();
        }}
      />
    );
  } else if (posts.data.length === 0) {
    body = <SectionEmpty>No posts yet. Be the first to share something on the feed.</SectionEmpty>;
  } else {
    body = (
      <ul className={styles.list}>
        {posts.data.slice(0, LATEST_POSTS_LIMIT).map((post) => (
          <li key={post.id}>
            <PostPreview post={post} />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <SectionCard
      title="Latest from the feed"
      action={{ to: FEED_PATH, label: 'See all', name: 'See all posts' }}
    >
      {body}
    </SectionCard>
  );
}
