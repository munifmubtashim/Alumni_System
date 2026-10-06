# A detail page keys its query by the route id and shows the error view only when it has no data ^L-REQ-008-1

| Field | Value |
|---|---|
| ID | LESSON-REQ-008-1 |
| Captured | 2026-10-07 |
| REQ | REQ-008 |
| Component | frontend |
| Tags | frontend, tanstack-query, detail-page, routing |
| Severity | trap |

## The lesson

For a page driven by a route param (`/alumni/:id`): key the query by the id, set no `placeholderData`, so a new id shows loading, never the previous person; encode the param with `encodeURIComponent` before it goes into an API path, so a stray `/` or `?` cannot change which endpoint is called. Gate the error view on `isError && data === undefined`: TanStack Query v5 keeps the cached data with status `error` after a failed refetch, and a check on `isError` alone replaces a loaded page with the error page whenever the API blips after the stale time. A 404 is the one error that should replace loaded data (the record is gone), and it is told apart from other failures with a small `isNotFoundError`.

## Saw it in

- `features/profile/ProfilePage.tsx`, `RecentPosts.tsx`, `useAlumniProfile.ts`; `services/alumniApi.ts`, `services/httpErrors.ts` — [[REQ-008]] (review findings CORR-001, CAND-023, CAND-024)

- Related: [[knowledge/concepts/detail-page-pattern]] · [[knowledge/gotchas#^g14|G14]] · [[knowledge/lessons/LESSON-REQ-006-2-list-skeletons-strand-focus|L-REQ-006-2]]
