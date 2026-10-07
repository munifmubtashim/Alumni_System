import { useQuery } from '@tanstack/react-query';
import { listComments } from '@/services/postsApi';
import type { FeedComment } from './cacheEdits';
import { commentsQueryKey } from './constants';

/**
 * One post's comments, oldest first, from `GET /api/posts/:id/comments`.
 * Fetched only while `enabled` (the thread is open). The key shares no prefix
 * with the post list, so feed edits never touch it (ADR-09).
 */
export function useComments(postId: number, enabled: boolean) {
  return useQuery<FeedComment[]>({
    queryKey: commentsQueryKey(postId),
    queryFn: () => listComments(postId),
    enabled,
  });
}
