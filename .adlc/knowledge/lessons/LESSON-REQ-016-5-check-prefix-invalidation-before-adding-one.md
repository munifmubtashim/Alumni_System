# `invalidateQueries` matches by key prefix: check what an existing root-key call already covers ^L-REQ-016-5

| Field | Value |
|---|---|
| ID | LESSON-REQ-016-5 |
| Captured | 2026-10-08 |
| REQ | REQ-016 |
| Component | frontend |
| Tags | frontend, tanstack-query, cache |
| Severity | guideline |

## The lesson

A reviewer asked for a new invalidation of `['alumni','suggestions']` after a profile save. `useUpdateProfile` already invalidated `['alumni']`, which matches every key under it, so the right change was a test that pins it, not code. Before adding an invalidation, read what the mutation already invalidates; and keep new keys under the shared roots (`ALUMNI_QUERY_ROOT`, `FEED_QUERY_ROOT`) so existing invalidations reach them.

## Saw it in

- `features/me/useUpdateProfile.ts` — [[REQ-016]] (CAND-103; review CORR-001 withdrawn in round 2)
