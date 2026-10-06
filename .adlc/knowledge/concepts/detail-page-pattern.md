# Concept — detail page pattern (`/alumni/:id`)

| Field | Value |
|---|---|
| Status | current as of REQ-008 (2026-10-07) |
| Introduced in | [[REQ-008]] |
| Code | `packages/frontend/src/features/profile/` |

A page for one record, opened from a list. `features/profile` is the first; the feed's post page can follow it.

- **Route.** Lazy (`PROFILE_ROUTE`, ADR-08) under `RequireAuth` in the app shell, with the router's own error layers. No `index.ts`; nothing outside the folder imports it.
- **Data.** One query keyed by the route id (`['alumni','profile',id]`), no `placeholderData`. A second, dependent query (the posts) uses `skipToken` until the first has the `user_id`; it fails and retries on its own without hiding the page ([[knowledge/lessons/LESSON-REQ-008-1-detail-page-query-and-error-state|L-REQ-008-1]]).
- **States.** Loading (skeletons, hidden `h1` "Loading profile", polite status), not found (a 404 for an unknown or malformed id, [[knowledge/gotchas#^g14|G14]]), error + Retry, success. A failed refetch keeps loaded data.
- **Every state has an `h1`, a tab title and focus.** The title is a React 19 `<title>` element inside each state ("Profile · Alma", "<name> · Alma", "Profile not found · Alma"), not a `document.title` effect. One effect focuses the current `h1` when focus is on the body or on a node that left the page ([[knowledge/lessons/LESSON-REQ-008-2-heading-focus-only-when-focus-is-lost|L-REQ-008-2]]).
- **No invented data.** Each section returns `null` when its data is empty (About, Education, Employment); parts the API cannot fill (location, mentorship, degree, dates) are not built.
- **Back link.** The list hands its `location.search` through router state; `config/directoryReturn.ts` owns the contract and falls back to the plain list ([[knowledge/lessons/LESSON-REQ-008-3-cross-feature-handover-through-config|L-REQ-008-3]]).
- **Phone.** The shell's logo bar stays; the page adds a slim row, arrow + "Profile", whose link name is still "Back to directory".
