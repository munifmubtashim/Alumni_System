# TASK-009 — useAlumniSearch and DirectoryPage

| Field | Value |
|---|---|
| REQ | REQ-006 |
| Tier | 2 |
| Status | done |
| Repo | alumni-system (worktree .worktrees/REQ-006-alumni-directory-page) |
| Depends on | TASK-001, TASK-002, TASK-005, TASK-007, TASK-008 |
| Blocks | TASK-010 |

## Goal

`DirectoryPage` shows the heading and count, the filter bar, the right state and pagination, driven by the URL.

## Files to touch

| Path | Action |
|---|---|
| `src/features/directory/useAlumniSearch.ts` | create — `useQuery` with key `['alumni','search',params]` |
| `src/features/directory/DirectoryPage.tsx`, `DirectoryPage.module.css`, `DirectoryPage.test.tsx` | create |
| `src/features/directory/constants.ts` | create — `DIRECTORY_PAGE_SIZE = 12` |

## Approach

- Heading row: one h1 "Alumni Directory" (smaller on phone; the phone design says "Directory", an accepted difference to keep one heading) plus the count: "Showing a–b of N alumni" from 48rem, "N alumni" below, in an `aria-live="polite"` region; shown only for a loaded page with items (not while loading, on error, or past the end).
- State switch per architecture.md → Page states. Page change scrolls to the top of the results. No `keepPreviousData`.
- Do not create `features/directory/index.ts`: the lazy route imports `DirectoryPage` by its own file path, so no barrel can pull the page into the entry chunk (ADR-08).

## Acceptance

- [x] Tests (memory router + axios adapter): loading skeletons; results and count text; empty filtered and unfiltered; page past the end; error then Retry succeeds; URL → request params; changing a filter resets the page; back restores the previous results; a 401 triggers the session notice
- [x] `npm test`, `typecheck`, `lint`, `format:check` pass

## Related

- Architecture: [[specs/2026-10/m/REQ-006-alumni-directory-page/architecture]]
- Spec: AC AC4, AC5, AC9, AC10, AC11
- All paths below are under `packages/frontend/`. Tokens only (`var(--…)`), CSS Modules, no inline styles, no raw hex, imports per the boundary rules. Import `describe/it/expect/vi` from vitest.

## Notes

- **States.** `isPending` → 12 skeletons; `isError` → `LoadError` (Retry = `refetch`, busy while fetching); no items and `total > 0 && page > 1` → `pastEnd` (button goes to page 1); no items and any search/filter → `filtered` (Clear filters = `clearAll`); else `none`; items → grid + `Pagination` (`ceil(total / 12)` pages; hides itself at ≤ 1).
- **Count.** The `aria-live="polite"` `<p>` is always mounted (a live region added with its text is often not announced) and filled only for a loaded page with items; both texts are in the DOM and swapped by CSS at 48rem (G18). "1 alumnus" for a total of one; the design only shows plurals.
- **Scroll.** A page change (Pagination or "Back to page 1") calls `scrollIntoView({ block: 'start' })` on the page section. Back/forward do not scroll (the browser restores). Tests stub `Element.prototype.scrollIntoView` (jsdom lacks it; CAND-018).
- **Section.** `<section aria-labelledby>` with a `useId` heading id; the results list is unlabelled and the heading names the region (TASK-007 note).
- **Tests.** 14 tests with the real `createRoutes`, `RequireAuth`, `SessionBridge` and `LoginPage`; the fake API sits on `httpClient.defaults.adapter`. Error test uses a 400 to avoid the 5xx retry delays (CAND-019). Back/forward checked with `router.navigate(-1)` / `(1)`, served from cache.
- **Design residuals for TASK-011.** Heading heading-sm on phone (design 18px), heading-md from 48rem (design 22px); count caption size / label size at regular weight; page gap space-4 / space-5 (design 16 / 20px). Phone heading says "Alumni Directory" (design "Directory"), as agreed.
- Checks 2026-10-06: full suite 680 passed (49 files); page tests stable over 3 runs; typecheck, lint, format:check clean.
