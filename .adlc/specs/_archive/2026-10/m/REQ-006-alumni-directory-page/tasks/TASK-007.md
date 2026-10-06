# TASK-007 — AlumniCard, ResultsGrid and the empty/error states

| Field | Value |
|---|---|
| REQ | REQ-006 |
| Tier | 1 |
| Status | pending |
| Repo | alumni-system (worktree .worktrees/REQ-006-alumni-directory-page) |
| Depends on | TASK-003 |
| Blocks | TASK-009 |

## Goal

A result card, the grid with its skeleton variant, and the empty and error layouts from S2 / S2-NoResults.

## Files to touch

| Path | Action |
|---|---|
| `src/features/directory/AlumniCard.tsx` (+ css, test) | create — one `Link` to `/alumni/:id`; `Avatar`, name (ellipsis), "Class of YYYY" (omitted when null), department, "job title, company" (parts omitted) |
| `src/features/directory/ResultsGrid.tsx` (+ css, test) | create — auto-fill grid minmax(260px,1fr); `loading` renders N skeleton cards; list semantics |
| `src/features/directory/DirectoryStates.tsx` (+ css, test) | create — `NoResults` (64px icon circle, heading, text naming the search and filters, "Clear filters"; variant for page past end with "Back to page 1"; variant "No alumni yet"), `LoadError` (`Alert` + Retry) |

## Approach

- Cards carry no Mentor tag. Name truncates with an ellipsis; long department/job wrap.
- Empty-state text built from the active search/filters, e.g. `"marine biology" with Grad. year 2022`.

## Acceptance

- [ ] Tests: card link and each missing-field combination, photo vs initials; grid skeleton count; each empty variant's text and button callback; error Retry callback
- [ ] `lint`, `typecheck` pass

## Related

- Architecture: [[specs/2026-10/m/REQ-006-alumni-directory-page/architecture]]
- Spec: AC AC8, AC9, AC11
- All paths below are under `packages/frontend/`. Tokens only (`var(--…)`), CSS Modules, no inline styles, no raw hex, imports per the boundary rules. Import `describe/it/expect/vi` from vitest.

## Notes

- **APIs for TASK-009.** `<AlumniCard alumnus={AlumniListItem} />` (+ `AlumniCardSkeleton`). `<ResultsGrid items={...} />` or `<ResultsGrid loading skeletonCount={n} />` (default `DEFAULT_SKELETON_COUNT` = 6; pass the page size). `<NoResults variant="filtered" filters={DirectoryFilters} onClearFilters />`, `variant="pastEnd" onFirstPage`, `variant="none"`. `<LoadError onRetry retrying? />`. Use `filtered` only when some search or filter is active.
- **Empty text.** Labels follow the chips without colons, per the task's example: `"marine biology" with Department X, University Y and Grad. year 2022`. Heading says "this search" when only `q` is set, else "these filters".
- **A11y.** Card lines are `div`/`p`, not `span`, so the link name has word gaps (CAND-013). Loading: a wrapper with `aria-busy`, a visually hidden `role="status"` "Loading alumni…", and the skeleton grid. The results list has no `aria-label`; the page heading labels the region. The visually hidden rule is a second copy (SearchField has the first); a shared utility would be a follow-up.
- **Lint.** `react-refresh/only-export-components` blocks exporting `jobLine` / `describeFilters`; they stay private and are tested through the components (CAND-014). No new file added.
- **Design residuals for TASK-011.** Card padding space-4 / space-5 from 48rem (design 16 / 20px); grid gap space-4 / space-5 (16 / 24px); avatar always md (44px; phone design is 40px); name 16px on phone too (design 15px); department is shown on phone (the phone design leaves it out, AC8 needs it); no-results padding space-8 (design 80px), heading text-heading-sm (design 17px). Card hover: border goes accent-strong (design had no card hover). Grid minimum is `min(16.25rem, 100%)` so 200% zoom on 360px doesn't overflow.
- Results 2026-10-06: 661 tests pass; the only 5 failures are in TASK-008's in-progress `FilterBar.test.tsx`. typecheck and lint clean; format:check clean for my files (it flags TASK-008's `FilterBar.test.tsx`).
