/** Posts per `GET /api/posts` page. The API clamps `limit` to 1..100. */
export const FEED_PAGE_SIZE = 20;

/**
 * Longest comment the API accepts: a hand copy of
 * `requiredText(body.content, "Comment", 2000)` in
 * `packages/backend/src/businessLogic/src/CommentManager.ts` (L-REQ-006-3).
 */
export const COMMENT_MAX_LENGTH = 2000;

/**
 * Longest post text the client sends. The API has no cap on `caption`
 * (`PostManager.createNewPost`); this is the client's own limit, kept equal
 * to the comment limit.
 */
export const POST_MAX_LENGTH = 2000;

/**
 * Query keys (ADR-09). The two share no prefix beyond `feed`, so an edit or
 * invalidate of the post list never touches a thread, and every cache edit
 * uses the exact key.
 */
export const POSTS_QUERY_KEY = ['feed', 'posts'] as const;

export function commentsQueryKey(postId: number) {
  return ['feed', 'comments', postId] as const;
}

/**
 * Mutation keys. Every feed mutation starts with `feed`, post mutations with
 * `feed, posts`, comment mutations with `feed, comments, <postId>`, so
 * `isMutating` can tell when the last one on a key settles.
 */
export const FEED_MUTATION_KEY = ['feed'] as const;

export function postMutationKey(action: 'create' | 'update' | 'delete') {
  return ['feed', 'posts', action] as const;
}

export function commentsMutationKey(postId: number) {
  return ['feed', 'comments', postId] as const;
}

export function commentMutationKey(postId: number, action: 'create' | 'update' | 'delete') {
  return ['feed', 'comments', postId, action] as const;
}
