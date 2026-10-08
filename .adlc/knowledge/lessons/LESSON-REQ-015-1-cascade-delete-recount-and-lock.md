# A cascade delete must recount counters on the rows it leaves, and lock the parent first ^L-REQ-015-1

| Field | Value |
|---|---|
| ID | LESSON-REQ-015-1 |
| Captured | 2026-10-08 |
| REQ | REQ-015 |
| Component | dal |
| Tags | backend, sql, postgres, admin |
| Severity | trap |

## The lesson

When deleting a row whose foreign keys cascade, find every surviving row that holds a denormalised counter over the deleted children (e.g. `posts.comment_count` on other people's posts) and recount those rows in the same transaction. Read the ids before the `DELETE` (afterwards the children are gone), and lock the parent row first (`SELECT … FOR UPDATE`) so a child inserted between the read and the delete cannot escape the recount.

## Saw it in

- `packages/backend/src/dal/query/AdminQuery.ts` (`deleteAlumniAccount`) — the recount was in the design; the lock came from review (CORR-001)
