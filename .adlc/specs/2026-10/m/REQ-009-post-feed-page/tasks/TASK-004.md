# TASK-004 — Feed data layer: hooks, cache edits, permissions

| Field | Value |
|---|---|
| REQ | REQ-009 |
| Tier | 2 |
| Status | pending |
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

- [ ] `cacheEdits` tests cover every function without mutating input
- [ ] Hook tests: success path, failure rolls back, count correct after rollback
- [ ] `permissions` tests: owner, admin, other, student

## Notes

No UI in this task. No `index.ts` in `features/feed` (ADR-08).

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
