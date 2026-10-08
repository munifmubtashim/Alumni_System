import { useRef, useState, type ReactNode } from 'react';
import { Alert } from '@/components/ui/Alert';
import { BRAND_NAME } from '@/config/brand';
import { useCurrentUser } from '@/features/auth';
import type { FeedPost } from './cacheEdits';
import { Composer } from './Composer';
import { itemKey } from './feedFormat';
import { EmptyFeed, FeedLoadError, FeedSkeleton, LoadMore } from './FeedStates';
import { PostCard } from './PostCard';
import { useDeletePost } from './useFeedMutations';
import { usePosts } from './usePosts';
import styles from './FeedPage.module.css';

/**
 * The feed at `/feed` (S4): title, composer, then the posts newest first with
 * Load more, or one state (skeletons, error with Retry, "No posts yet").
 * Delete state lives here, not in the card, because a deleted card unmounts
 * before a failure puts it back: a post with comments asks first, inline in
 * its card ("Delete this post and its N comments?"); one without is removed at
 * once. After a delete, focus moves to the page heading (the card is gone).
 */
export function FeedPage() {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const { data: me } = useCurrentUser();
  const posts = usePosts();
  const remove = useDeletePost();
  const [confirmId, setConfirmId] = useState<number | null>(null);

  function deleteNow(post: FeedPost) {
    setConfirmId(null);
    remove.mutate({ id: post.id });
    requestAnimationFrame(() => {
      headingRef.current?.focus();
    });
  }

  function requestDelete(post: FeedPost) {
    if ((post.comment_count ?? 0) > 0) setConfirmId(post.id);
    else deleteNow(post);
  }

  let body: ReactNode;
  if (posts.isPending) {
    body = <FeedSkeleton />;
  } else if (posts.isError && posts.data === undefined) {
    body = (
      <FeedLoadError
        retrying={posts.isFetching}
        onRetry={() => {
          void posts.refetch();
        }}
      />
    );
  } else if (posts.data.length === 0) {
    body = <EmptyFeed />;
  } else {
    body = (
      <>
        <ul className={styles.list}>
          {posts.data.map((post) => (
            <li key={itemKey(post)}>
              <PostCard
                post={post}
                me={me}
                onDelete={requestDelete}
                confirmingDelete={confirmId === post.id}
                onConfirmDelete={deleteNow}
                onCancelDelete={() => {
                  setConfirmId(null);
                }}
              />
            </li>
          ))}
        </ul>
        {posts.hasNextPage && (
          <LoadMore
            loading={posts.isFetchingNextPage}
            failed={posts.isFetchNextPageError}
            onLoadMore={() => {
              void posts.fetchNextPage();
            }}
          />
        )}
      </>
    );
  }

  return (
    <div className={styles.page}>
      <title>{`Feed · ${BRAND_NAME}`}</title>
      <h1 ref={headingRef} className={styles.title} tabIndex={-1}>
        Feed
      </h1>
      <Composer me={me} />
      {remove.errorMessage !== null && (
        <Alert tone="error" title="The post wasn't deleted">
          {remove.errorMessage}
        </Alert>
      )}
      {body}
    </div>
  );
}
