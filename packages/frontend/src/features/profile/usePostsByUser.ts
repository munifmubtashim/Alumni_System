import { skipToken, useQuery } from '@tanstack/react-query';
import { POSTS_QUERY_ROOT } from '@/config/queryKeys';
import { getPostsByUser } from '@/services/alumniApi';

/**
 * One person's posts from `GET /api/posts/user/:userId`, newest first as the
 * API returns them (unpaged). Takes the profile's `user_id`, not the alumni
 * id, so it stays idle (`skipToken`, the type-safe form of `enabled: false`)
 * until the profile has loaded. The client's defaults apply (no retry on 4xx);
 * a 401 reaches the session handler like any other request (ADR-03).
 */
export function usePostsByUser(userId: number | undefined) {
  return useQuery({
    queryKey: [POSTS_QUERY_ROOT, 'user', userId],
    queryFn: userId === undefined ? skipToken : () => getPostsByUser(userId),
  });
}
