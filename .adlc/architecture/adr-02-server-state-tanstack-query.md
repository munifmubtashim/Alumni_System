# ADR-02 — TanStack Query for server state; Jotai for client state ^ADR-02

| Field | Value |
|---|---|
| Status | accepted |
| Decided | 2026-10-04 |
| Author | munifmubtashim (drafted by Claude) |
| Supersedes | (none) |
| Superseded by | (none) |
| Based on | [[REQ-001]] |

## Context

The redesign conventions say client state lives in Jotai atoms in `src/store/` and that UI components make no API calls. The old frontend put server data in Jotai too: `postsAtom` plus `postsLoadingAtom`, and hand-written hooks (`usePosts`, `useAlumni`, `useComments`, …) that each fetched, tracked loading/error and re-fetched after mutations by hand. Each hook re-solved caching, deduplication, refetch-after-write and error state slightly differently.

Upcoming pages — feed with comments, alumni directory with filters, profiles, "me" — are mostly reads of server data with a few writes that must refresh related views (posting a comment updates a post's comment count). That is exactly the workload a server-state cache solves.

`@tanstack/react-query` 5.104 supports React 18 and 19. Jotai 3 is current.

## Considered options

### Option 1 — Jotai only (async atoms / hand-written hooks)

Keep the old pattern: async atoms or hooks that fetch and store results in atoms.

**Pros:** one state library; small bundle.
**Cons:** we rebuild caching, request deduplication, stale/refetch rules, retries, pagination and cache invalidation by hand — the old code shows how that drifts per hook. Loading/error state ends up as more atoms.

### Option 2 — Jotai + `jotai-tanstack-query`

Query results exposed as atoms.

**Pros:** everything reads as atoms.
**Cons:** an extra adapter layer and another dependency; most TanStack docs/examples use hooks directly, and the atom bridge adds indirection without a clear win for this app.

### Option 3 — TanStack Query (hooks) for server state + Jotai for client state  *(recommended)*

`QueryClientProvider` at the app root. Feature folders own query hooks (`features/posts/usePostsQuery.ts`) that call endpoint functions in `services/`. Jotai holds only state that the server doesn't own.

**Pros:**
- Caching, dedupe, background refetch, retries, pagination and invalidation are solved and consistent.
- Loading/error/empty states come from one shape (`status`, `error`) everywhere — easier to render the design system's states consistently.
- Clear rule for where state goes.
- Well-known, heavily used, React 19 ready.

**Cons:**
- A second state library to learn (~13 kB gz).
- Need the discipline not to copy query data into atoms.

### Option 4 — SWR or RTK Query

**Pros:** SWR is smaller; RTK Query is solid with Redux.
**Cons:** SWR has weaker mutation/invalidation tooling; RTK Query brings Redux, which conflicts with the Jotai convention.

## Decision

**We choose Option 3 — TanStack Query for server state, Jotai for client state** (accepted at the REQ-001 architecture gate, 2026-10-04).

The coming pages are dominated by server reads with related invalidations, which is what TanStack Query exists for; the old code's per-hook fetching is the cost of not having it. Jotai stays the home for client state, as the convention says, and the line between the two is simple enough to write in one sentence.

**The line:** *if the server is the source of truth, it's a query (or mutation); if it exists only in this browser, it's an atom.*

| Lives in TanStack Query | Lives in Jotai atoms |
|---|---|
| posts, comments, alumni lists, profiles, `/api/me` | theme preference |
| any data returned by the API | decoded current-user claims (client-held), if the auth REQ wants them reactive |
| | UI state shared across components: open panels, draft text, directory filter selections (which then become query keys) |

Rules:
- The auth token itself lives in `services/authToken.ts` (localStorage), read by the shared `httpClient` — not in an atom, so non-React code has one place to read it.
- Never copy query data into an atom; derive from the query.
- Endpoint functions live in `services/` and use the shared `httpClient`; query hooks live in the owning `features/<domain>/`; UI primitives never call either.
- Mutations invalidate by query key (`['posts']`, `['posts', id, 'comments']`).

## Consequences

| Consequence | Type |
|---|---|
| `QueryClientProvider` with project defaults wired in REQ-001 (`staleTime` 30s, no refetch-on-focus, no retry on 4xx, mutations don't retry) | new work |
| Each feature REQ defines its query keys and hooks in its feature folder | convention |
| Devtools not installed yet; add `@tanstack/react-query-devtools` (dev-only, lazy) when the first feature lands if wanted | follow-up |
| Old `postsAtom`/`*LoadingAtom` pattern is retired | trade-off |

## Open questions

- [ ] Query-key naming scheme (key factory per feature?) — decide in the first feature REQ.
- [ ] Global 401 handling (clear token + redirect to login) — belongs to the auth REQ.

## Related

- Concepts: —
- Components: [[knowledge/components/frontend]]
- Gotchas: —
- Lessons: —
- ADRs: [[architecture/adr-01-ui-layer-headless-css-modules]] · optimistic writes are covered by [[architecture/adr-09-optimistic-updates-by-cache-edit|ADR-09]]
