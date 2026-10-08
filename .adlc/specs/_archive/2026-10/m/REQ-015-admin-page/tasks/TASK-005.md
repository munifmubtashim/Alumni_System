# TASK-005 — Frontend: admin page — stats, table/cards, search/sort/paging, states

| Field | Value |
|---|---|
| REQ | REQ-015 |
| Tier | 2 |
| Status | pending |
| Repo | alumni-system |
| Depends on | TASK-003, TASK-004 |
| Blocks | TASK-006 |

## Goal

AdminPage renders S6: header row (h1 "Admin" + Add alumni button, no-op until TASK-006), four live stat cards, and the alumni table (desktop) / card list (phone) with URL-held search, sort and paging and all loading/error/empty states.

## Files to touch

| Path | Action |
|---|---|
| `packages/frontend/src/features/admin/AdminPage.tsx (+.module.css, .test.tsx)` | edit/create |
| `packages/frontend/src/features/admin/AdminStats.tsx (+css, test)` | create |
| `packages/frontend/src/features/admin/AlumniTable.tsx (+css, test)` | create |
| `packages/frontend/src/features/admin/AlumniCardList.tsx (+css)` | create |
| `packages/frontend/src/features/admin/AdminPagination.tsx (+css)` | create |
| `packages/frontend/src/features/admin/params.ts (+test)` | create |
| `packages/frontend/src/features/admin/useAdminParams.ts (+test)` | create |
| `packages/frontend/src/features/admin/useDebouncedCallback.ts` | create (copy of directory's, comment why) |
| `packages/frontend/src/features/admin/queries.ts` | create (useAdminStats, useAdminAlumni, query keys) |
| `packages/frontend/src/features/admin/formatCount.ts (+test)` | create |
| `packages/frontend/src/features/admin/README.md` | create |

## Approach

- params.ts: parse q (≤100), sort (name|graduationYear), order (asc|desc), page (1..10000); drop invalid values; defaults name/asc/1. Sorting/search reset page to 1; header click and paging push history; typed search replaces after 300 ms (L-REQ-006-1 own-write guard).
- useAdminAlumni key `['admin','alumni',params]`, pageSize 10, keepPreviousData; useAdminStats key `['admin','stats']`. formatCount via a module-level Intl.NumberFormat('en-US').
- Table: caption/heading for focus return, `<th>` buttons for Name and Grad. year with ↓/↑ arrow and aria-sort; Mentor "Yes"/"No"; row action icon buttons "Edit <name>"/"Delete <name>" (callbacks props, wired later). Card list < 48rem. Pagination "Showing <n> of <total>" + Prev/Next disabled at edges. States: skeleton rows, error + Retry, no match "No alumni match “q”" + Clear search, "No alumni yet". Stats skeleton/error+Retry independent of the table. Tokens per the architecture design-mapping table.

## Acceptance

- [ ] Tests cover: stats values formatted and their loading/error states; rows rendered; sort click → URL + aria-sort + request params; search debounce → q and page 1; Prev/Next + disabled edges + count text; empty/no-match/error states; a page past the end clamps
- [ ] No hex/shadow; lint, typecheck, format, tests green
- [ ] README lists the S6 deviations from architecture.md

## Notes

Phone/desktop switch by CSS; respect G18 (no display on hidden elements). Use the existing SearchField, Skeleton, Alert, Button primitives.

### Implementation notes (2026-10-08)

- Extra files inside features/admin (in scope): `AdminSearch.tsx` (search box with the FilterBar own-write guard), `AdminStates.tsx/.module.css` (empty + error), `RowActions.tsx/.module.css`, `AdminIcons.tsx`, `rowText.ts`, `testKit.ts` (test-only fake API + render; no app/ import, so no session or shell needed).
- Row callbacks: `onEdit` / `onDelete` are `(row, triggerButton) => void` so TASK-007 can return focus to the pressed Delete button. The list heading is a visually hidden h2 "Alumni" with `tabIndex={-1}` and id `listTitleId`; it has no ref yet (VisuallyHidden's props omit `ref`), so TASK-007 needs to add one (or swap to a plain h2) for the post-delete focus.
- The API always gets `sort` and `order` (defaults name/asc); the URL leaves defaults out. ↓ = ascending (S6 draws ↓ on the default name-ascending view).
- keepPreviousData: rows stay (dimmed, `aria-busy`) while a new sort/page/search loads. Loading and loaded share one JSX tree so the table never remounts. "No items but total > 0" counts as loading while `clampPage` replaces the URL with the last page.
- Prev/Next: a click that reaches an edge queues focus to the other button and applies it in an effect after the render that enables it.
- "Showing n of total": n = rows on this page (S6 "Showing 6 of 1,842"), both via formatCount.
- Gates run: `npm test` (99 files, 1457 tests), `typecheck`, `lint`, `format:check`, `build` (AdminPage chunk present) all green in packages/frontend.

## Related

- Architecture: [[specs/2026-10/m/REQ-015-admin-page/architecture]]
- Lessons checked: L-REQ-006-1, L-REQ-006-2, L-REQ-006-3, L-REQ-008-6, L-REQ-009-3, L-REQ-012-2, G18, G26, G27, G30
