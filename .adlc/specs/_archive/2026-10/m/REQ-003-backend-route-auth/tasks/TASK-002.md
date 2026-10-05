# TASK-002 — Post ownership in PostManager

| Field | Value |
|---|---|
| REQ | REQ-003 |
| Tier | 1 |
| Status | pending |
| Repo | alumni-system |
| Depends on | TASK-001 |
| Blocks | TASK-004, TASK-005 |

## Goal

Posts are created as the signed-in user, and only the author or an admin can edit or delete them. A missing post gives 404, and anyone else gets 403.

## Files to touch

| Path | Action |
|---|---|
| `packages/backend/src/dal/query/PostQuery.ts` | edit — add `findPostById(id): Promise<PostDTO \| undefined>` (`SELECT * FROM posts WHERE id = $1`) |
| `packages/backend/src/businessLogic/src/PostManager.ts` | edit |
| `packages/backend/src/businessLogic/src/PostManager.test.ts` | create |
| `packages/backend/src/dal/query/PostQuery.test.ts` | create — `updatePost` SQL never sets `user_id`; `findPostById` selects by id |
| `packages/backend/src/api/controllers/PostController.ts` | edit |

## Approach

- `PostManager`, mirroring `CommentManager.deleteComment`:
  - `createNewPost(userId: number, body)`: author is `userId`; `body.user_id` is never read. Caption and media pass through as today: no new required fields or length limits (spec non-goal).
  - `updatePost(requester: {id, role}, postId: unknown, body)` and `deletePost(requester, postId)`: `requireId(postId, "Post")` → `findPostById` → `AppError(404, "Post not found")` → `AppError(403, "You can only change your own posts")` unless owner or `role === "admin"` → call the query. The update keeps `user_id`.
  - `getPostsByUserId` takes a plain id (`requireId`) instead of building a DTO, so the controller stops constructing a DTO just to carry an id.
- `PostController`: add a `sendError` like `CommentController`'s (`AppError` → its status + `{message}`, else 500). Pass `req.user.sub` and `{ id: Number(req.user.sub), role: req.user.role }`. Use 201 for create, 200 + the updated row for update, 200 `{message}` for delete.
- Unit tests: `vi.mock("@alumni/dal")` with a fake `PostQuery`. Cases: owner edits/deletes; admin edits/deletes someone else's post and `updatePost` is not given a different `user_id`; other user → 403 and the query is not called; missing post → 404; bad id → 400; create ignores `body.user_id`.

## Acceptance

- [x] `PostManager.test.ts` covers every case above and passes
- [ ] `tsc` in `packages/backend/src/businessLogic` succeeds (rebuilds `dist/`), then `npx tsc --noEmit -p packages/backend/src/api` succeeds — businessLogic passes; api blocked only by TASK-003 files (see notes)
- [x] No SQL outside `dal/query`

## Notes

- The routes become authenticated only in TASK-004. Until then `req.user` can be undefined on these routes. That's fine because nothing ships between tasks, but don't add guards for it in the controller.
- Update semantics stay as today (an update with neither field writes NULL to both). Changing that is out of scope.

### Implementation notes (2026-10-05)

- **Bad id gives 404, not 400.** The Approach mandates `requireId`, which throws `AppError(404, "<What> not found")` for a non-positive-integer id (same as comments). Tests assert 404. Changing `requireId` would change every manager, so it was left alone.
- Owner/admin check lives in a private `findOwnedPost` shared by update and delete. Update rebuilds the DTO from the stored row's `user_id`/`comment_count`, and `PostQuery.updatePost` SQL never names `user_id` (pinned by `PostQuery.test.ts`).
- `getPostsByUserId(userId: unknown)` uses `requireId(_, "User")`; an unknown user still returns `[]`.
- `getAllPosts` errors now go through `sendError` (500 `{message}`) instead of leaking `error.message`.
- Build: `tsc` in businessLogic passed (exit 0). `tsc --noEmit -p packages/backend/src/api` reports 5 errors, all in TASK-003's in-progress `AlumniController.ts` / `UserController.ts`; `PostController.ts` is clean. Re-run once TASK-003 lands.
- `tsc` in businessLogic also emits `dist/PostManager.test.*` because its tsconfig includes all of `src/`. Harmless (dist is git-ignored, never imported) but worth an `exclude` for `**/*.test.ts` in a later task.

## Related

- Architecture: [[specs/2026-10/m/REQ-003-backend-route-auth/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-002-1-401-only-if-token-matches|L-REQ-002-1]] (403, never 401, for "not yours")
