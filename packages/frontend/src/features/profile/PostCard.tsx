import type { Post } from '@alumni/shared';
import { Card } from '@/components/ui/Card';
import { relativeTime } from '@/config/relativeTime';
import { commentCountText, present } from './format';
import styles from './RecentPosts.module.css';

export interface PostCardProps {
  post: Pick<Post, 'caption' | 'created_at' | 'comment_count'>;
  /** The time "3 days ago" is measured from; defaults to now. */
  now?: Date;
}

/** An ISO timestamp for `<time dateTime>`, or undefined for a missing or invalid date. */
function isoDate(value: Date | string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

/**
 * One post in Recent posts: the caption (left out when blank), then
 * "<relative time> · <N comments>". Not a link: there is no post page yet.
 * The time is left out, with its separator, when the date is missing or invalid.
 */
export function PostCard({ post, now }: PostCardProps) {
  const caption = present(post.caption);
  const dateTime = isoDate(post.created_at);
  const when = dateTime === undefined ? '' : relativeTime(dateTime, now);

  return (
    <Card as="article" className={styles.card}>
      {caption !== undefined && <p className={styles.caption}>{caption}</p>}
      <p className={styles.meta}>
        {when !== '' && dateTime !== undefined && (
          <>
            <time dateTime={dateTime}>{when}</time>
            {' · '}
          </>
        )}
        {commentCountText(post.comment_count ?? 0)}
      </p>
    </Card>
  );
}
