# ADR-08 — Route-level code splitting with `lazy`; list state lives in the URL ^ADR-08

| Field | Value |
|---|---|
| Status | accepted |
| Decided | 2026-10-06 |
| Author | munifmubtashim (drafted by Claude) |
| Supersedes | (none) |
| Superseded by | (none) |
| Based on | [[REQ-006]] · [[architecture/adr-02-server-state-tanstack-query\|ADR-02]] · [[architecture/adr-07-root-layout-and-headerless-auth\|ADR-07]] |

## Context

Every page so far is imported statically in `router.tsx`, so the entry bundle grows with each screen. REQ-006 adds the first large page (directory) and starts code-splitting. The same page needs search text, filters and a page number that survive a reload, can be shared as a link and work with back/forward. ADR-02 puts server data in TanStack Query and client-only state in Jotai; it does not say where this "view state of a list" lives.

## Considered options

### Option 1 — React Router `lazy` on the route, view state in the URL
Each large page is a route with `lazy: () => import(...)`. List state (query, filters, page) is parsed from the query string by a pure function and written back with `navigate`.

**Pros:** built into the data router we already use; no new library; shareable links and back/forward for free; one source of truth.
**Cons:** every list needs a parse function that rejects bad values; typing needs debouncing before it touches the URL.

### Option 2 — `React.lazy` + `Suspense` inside the page element, view state in a Jotai atom
**Pros:** familiar. **Cons:** the router can't prefetch the chunk or run it before render; state is lost on reload and can't be linked.

### Option 3 — No splitting yet; state in component `useState`
**Pros:** least work. **Cons:** bundle keeps growing; results can't be linked; loses the search on reload.

## Decision

**We chose Option 1.** `lazy` is the router's own mechanism and gives per-route chunks without configuration. The URL is the natural home for list state a user may want to bookmark or send. Only the dynamic import may reference a lazily loaded feature's page; `router.tsx` never imports it statically, and a guard test checks that.

## Consequences

| Consequence | Type |
|---|---|
| New pages with more than a trivial size are added with `lazy` | convention |
| A route that can be opened directly needs a `HydrateFallback` | new work |
| List screens (directory now, feed later) parse the URL with a pure, tested function that ignores invalid values | convention |
| Lazy chunk presence is checked in the build, not only in unit tests | trade-off |
| Home stays eager (it is the landing page) | trade-off |

## Amendment — REQ-008 (2026-10-07)

The profile page (`/alumni/:id`) was the second lazy page and the feed (`/feed`, REQ-009) the third. The import guard (ESLint and `lazyRoutes.test.ts`) now runs one check per lazy feature from a `LAZY_FEATURES` list, each leaving out only that feature's own folder, so one lazy feature cannot import another statically either. Two lazy features that need to share something meet in `config/` (`relativeTime` moved there for the feed).

My Profile (`/me`, REQ-010, `ME_ROUTE` in `router.tsx`) is the fourth lazy page, added to `LAZY_FEATURES` like the others. Its path lives in `config/mePath.ts`, because the nav, the avatar menu and Home all link to it.

The About page (`/about`, REQ-014, `ABOUT_ROUTE`) is the fifth lazy page and the first one that is public: it sits in the `AppShell` branch as a sibling of the `RequireAuth` group, not inside it, and makes no API call. Its path lives in `config/aboutPath.ts` (the footer and the auth pages link to it).

## Open questions

- [ ] Prefetching a chunk on hover/focus of its nav link: not decided here.

## Related

- Components: [[knowledge/components/frontend]]
- Gotchas: [[knowledge/gotchas#^g08|G08]] (`react-router/dom`)
- ADRs: ADR-02, ADR-07
