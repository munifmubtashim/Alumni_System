# TASK-004 — Feed data layer: hooks, cache edits, permissions

| Field | Value |
|---|---|
| REQ | REQ-009 |
| Tier | 2 |
| Status | complete |
| Repo | alumni-system |
| Depends on | TASK-003 |
| Blocks | TASK-005 |

## Goal

Server state and optimistic writes for the feed work and are tested without any UI.

## Files to touch

| Path | Action |
|---|---|
| `packages/frontend/src/features/feed/usePosts.ts` | create (`useInfiniteQuery`, key `['posts']`, 20/page, dedupe by id) |
| `.../useComments.ts` | create (key `['posts', id, 'comments']`, `enabled` flag) |
| `.../cacheEdits.ts` + test | create (pure) |
| `.../useFeedMutations.ts` + test | create (create/update/delete post; create/update/delete comment) |
| `.../permissions.ts` + test | create (`canModify`) |
| `.../constants.ts` | create (page size, max lengths mirroring the API: comment 2000) |

## Approach

- ADR-09: `onMutate` cancel + snapshot + cache edit with a negative temp id; `onError` restore; `onSettled` invalidate. Comment create bumps the post's `comment_count` in the posts cache and rolls it back; delete decrements (min 0, replies count).
- Optimistic author fields from `useCurrentUser()`.
- Mutations expose `error` text through the existing http error helpers; a 403/404 message from the API is shown as is.

## Acceptance

- [x] `cacheEdits` tests cover every function without mutating input
- [x] Hook tests: success path, failure rolls back, count correct after rollback
- [x] `permissions` tests: owner, admin, other, student

## Notes

No UI in this task. No `index.ts` in `features/feed` (ADR-08).

Done 2026-10-07. typecheck, lint, format:check, `npm test` (70 files, 957 tests) all pass.

- **Hook API (for TASK-005):** `usePosts()` (`data` = flat deduped `FeedPost[]`, plus `hasNextPage`/`fetchNextPage`), `useComments(postId, enabled)`, `useCreatePost()` `{caption}`, `useUpdatePost()` `{id, caption}`, `useDeletePost()` `{id}`, `useCreateComment(postId)` `{content, parent_id?}`, `useUpdateComment(postId)` `{id, content}`, `useDeleteComment(postId)` `{id}`. Each mutation adds `errorMessage: string | null`. Pending items have a negative `id` and a `clientKey` (use as React key). `canModify(me, authorId)`.
- **Pages keep `fetched`** (server length) so offset = previous offset + `fetched`, and "more" = `fetched === 20`, whatever the cache edits did.
- **Mutation keys:** posts `['feed','posts',action]`, comments `['feed','comments',postId,action]`. Posts refetch only when `isMutating(['feed']) === 1` (comment create/delete change the count too); a thread refetches when `isMutating(['feed','comments',postId]) === 1`. Invalidate and edits use exact keys.
- **Comment delete** removes replies too and drops the count by that many; rollback adds back only what the 0 clamp really took off.
- **Post create/update** trim the caption; the API's bare row is merged over the temp post, so author fields stay. Delete success also removes that post's thread cache.
- **Deviation:** added `feedErrors.ts` (+ test), not in the file list: `feedErrorMessage(error)`, the API's 4xx message as is, "Couldn't reach the server" for 5xx/no response. Reuses the auth message constants. Inside `features/feed`, so within the architecture's blast radius.
- **Follow-up:** the hook test builds its own JWT (8th copy, G26 / QUAL-002 shared helper still open). ADR-09's Consequences line says "the rollback runs" after a 401, while its Decision says it is skipped; the code follows the Decision. Fix the ADR wording at wrapup.

## Related

- Architecture: [[specs/2026-10/m/REQ-009-post-feed-page/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-008-6-copying-between-lazy-features-needs-a-home]], G26, G28, G29, G30

## Added after stress-test

- Query keys: `['feed','posts']`, `['feed','comments',postId]`; all cache edits exact-key.
- Rollback = inverse edit; `onSettled` invalidates only when `queryClient.isMutating({ mutationKey })` is 1 (give each mutation a `mutationKey`). Skip rollback if `getLiveToken()` is null.
- `usePosts`: offset from the sum of raw page lengths, `hasNextPage` from the last raw page length === page size; dedupe by id only for display.
- `deletePost`/`deleteComment`: a 404 counts as success (keep it removed, refetch).
- Temp items carry a stable `clientKey`.
- Tests: two overlapping creates where one fails; failure after a 401 does not restore; 404 delete.
