# Offset-paged lists need an id tie-break in the query and offsets taken from the server page lengths ^L-REQ-009-3

| Field | Value |
|---|---|
| ID | LESSON-REQ-009-3 |
| Captured | 2026-10-07 |
| REQ | REQ-009 |
| Component | feed, posts query |
| Tags | api, frontend, pagination, tanstack-query |
| Severity | guideline |

## The lesson

For an offset-paged infinite list, add a unique tie-break (`id DESC`) to `ORDER BY`, keep each page's raw server length and compute the next offset and "has more" from it (not from the edited, deduped list), and dedupe by id only for display.

## Saw it in

- `packages/backend/src/dal/query/PostQuery.ts` (`getAllPosts` order)
- `packages/frontend/src/features/feed/usePosts.ts`, `cacheEdits.ts` (`PostsPage.fetched`)
- Extends LESSON-REQ-005-1 (tie-break) to the client half
