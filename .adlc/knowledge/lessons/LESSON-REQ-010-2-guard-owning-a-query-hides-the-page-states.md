# A route guard that owns a query's loading and error state makes the page's own states unreachable; guard on `data === undefined` ^L-REQ-010-2

| Field | Value |
|---|---|
| ID | LESSON-REQ-010-2 |
| Captured | 2026-10-07 |
| REQ | REQ-010 |
| Component | frontend, auth, tanstack-query |
| Tags | frontend, auth, guards, tanstack-query |
| Severity | guideline |

## The lesson

Before specifying a page's loading and error views, check whether `RequireAuth` (`features/auth/guards.tsx`) reads the same query: it does for `['me']`, so the page never shows its own skeleton or Retry on first load, and a failed background refetch (`isError` with cached data) unmounts the page and any unsaved form. Pick one owner; the guard should show its error only when `data === undefined`.

## Saw it in

- `features/auth/guards.tsx:37-58` vs `features/me/MePage.tsx` (ARCH-002, TASK-006 note); left as a follow-up in REQ-010
