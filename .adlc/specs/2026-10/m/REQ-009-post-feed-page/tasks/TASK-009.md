# TASK-009 — Return author_alumni_id on posts and comments

| Field | Value |
|---|---|
| REQ | REQ-009 |
| Tier | 2 |
| Status | done |
| Repo | alumni-system |
| Depends on | TASK-001 |
| Blocks | TASK-005 |

## Goal

Every post and comment row the feed reads carries `author_alumni_id` (the author's `alumni.id`, or null when the author has no alumni profile), so the UI can link to `/alumni/:id` correctly.

## Files to touch

| Path | Action |
|---|---|
| `packages/backend/src/dal/query/PostQuery.ts` + test | edit: `getAllPosts`, `getPostsByUserId` |
| `packages/backend/src/dal/query/CommentQuery.ts` + test | edit: list, create's re-select and the new update's select |
| `packages/shared/src/types/post.types.ts`, `comment.types.ts` | edit: `author_alumni_id?: number | null` |

## Approach

- `LEFT JOIN alumni a ON a.user_id = posts.user_id`, select `a.id AS author_alumni_id`. A user can in theory have more than one alumni row (`findAlumniByUserId` uses `ORDER BY id LIMIT 1`): pick the same row, e.g. `(SELECT MIN(id) FROM alumni WHERE user_id = posts.user_id)`, so rows are never duplicated.
- Additive only: no existing field changes, no schema change. Rebuild `businessLogic/dist` is not needed (dal is read live) but run the backend tests and typecheck.

## Acceptance

- [x] A post/comment by a user with an alumni row returns that row's id; by a student returns null; no duplicate rows for a user with two alumni rows
- [x] SQL tests updated; `npm run test:backend` passes; typecheck passes (the `baseDTO.ts` case error already on this machine is unrelated)

## Notes

Found by the TASK-005 implementer: `/alumni/:id` uses `alumni.id`, not `users.id`.

Implemented (2026-10-07): used the scalar-subquery option from the Approach, not a LEFT JOIN, in shared `POST_COLUMNS` / `COMMENT_COLUMNS` fragments, so every comment read (list, create's re-select, update's CTE select) and both post lists get it from one place. In the update CTE, `c` is the CTE alias, so `c.user_id` in the subquery resolves to the edited row. The 2026-10-03 DB backup shows a UNIQUE(user_id) on alumni, but nothing in `db/migrations/` guarantees it, so the subquery stays. Tests check SQL shape only (pool is mocked); null-for-students and no-duplicates follow from the subquery form, not from a live DB run. `findPostById` / `updatePost` still return bare rows (no author fields), as before; not in scope. Typecheck: `typecheck:backend` stops at dal on the known TS1261, so `tsconfig.test.json` was run by hand: only TS1261 remains.

## Related

- Architecture: [[specs/2026-10/m/REQ-009-post-feed-page/architecture]]
