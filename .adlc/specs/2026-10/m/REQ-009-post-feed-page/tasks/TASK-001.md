# TASK-001 — Backend: edit a comment (PUT /api/comments/:id)

| Field | Value |
|---|---|
| REQ | REQ-009 |
| Tier | 0 |
| Status | pending |
| Repo | alumni-system |
| Depends on | — |
| Blocks | TASK-003 |

## Goal

A signed-in owner or admin can change a comment's text through `PUT /api/comments/:id`; nobody else can.

## Files to touch

| Path | Action |
|---|---|
| `packages/backend/src/api/routes/CommentRoutes.ts` | edit |
| `packages/backend/src/api/controllers/CommentController.ts` | edit |
| `packages/backend/src/businessLogic/src/CommentManager.ts` | edit |
| `packages/backend/src/businessLogic/src/CommentManager.test.ts` | create |
| `packages/backend/src/dal/query/CommentQuery.ts` | edit |
| `packages/backend/src/api/routes/routes.test.ts` | edit if it lists routes |
| `packages/shared/src/types/comment.types.ts` | edit (`UpdateCommentInput { content: string }`) |

## Approach

- `updateComment(requester, commentId, body)`: `requireId`, find (404 'Comment not found'), owner-or-admin else 403 'You can only change your own comments', then `requiredText(body.content, 'Comment', 2000)`; owner check first.
- `CommentQuery.updateComment(id, content)`: `UPDATE comments SET content=$1, updated_at=NOW() WHERE id=$2`, then select with the author join (`COMMENT_COLUMNS`) and return it.
- Controller returns 200 with the comment; `sendError` on catch; same style as `deleteComment`.
- Rebuild `packages/backend/src/businessLogic` (`tsc`) so `dist/` is current.

## Acceptance

- [ ] Manager tests: owner ok; admin ok; other user 403; missing 404; blank and >2000 chars 400; non-owner never sees a validation error; body `parent_id`/`post_id`/`user_id` ignored
- [ ] Route guard test passes (no token → 401)
- [ ] `npm run test:backend` and `npm run typecheck:backend` pass
- [ ] `dist/` rebuilt

## Notes

No schema change: `comments.updated_at` already exists (CommentDTO, seed). Reply threads: editing never changes `parent_id`.

## Related

- Architecture: [[specs/2026-10/m/REQ-009-post-feed-page/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-008-6-copying-between-lazy-features-needs-a-home]], G26, G28, G29, G30

## Added after stress-test

- `updateComment` SQL is one CTE statement (`WITH u AS (UPDATE … RETURNING *) SELECT u.*, author fields FROM u JOIN users`); zero rows → `AppError(404, 'Comment not found')`.
- `PostQuery.getAllPosts`: `ORDER BY posts.created_at DESC, posts.id DESC`; add/extend a test that the SQL carries the tie-break.
- Files added: `packages/backend/src/dal/query/PostQuery.ts` (+ its test).
- [ ] Acceptance: delete-between-find-and-update returns 404 not 200.
