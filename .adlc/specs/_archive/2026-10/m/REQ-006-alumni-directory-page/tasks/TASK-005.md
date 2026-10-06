# TASK-005 — Pagination

| Field | Value |
|---|---|
| REQ | REQ-006 |
| Tier | 0 |
| Status | pending |
| Repo | alumni-system (worktree .worktrees/REQ-006-alumni-directory-page) |
| Depends on | — |
| Blocks | TASK-009 |

## Goal

A pagination nav: desktop Prev + page numbers with ellipsis + Next; phone Prev + "Page x of y" + Next.

## Files to touch

| Path | Action |
|---|---|
| `src/features/directory/Pagination.tsx`, `Pagination.module.css`, `Pagination.test.tsx` | create |
| `src/features/directory/pageWindow.ts` (+ test) | create — pure: list of numbers and ellipses for (page, totalPages) |

## Approach

- Props: `page`, `totalPages`, `onPageChange`. One `<nav aria-label="Pagination">`; the current page button has `aria-current="page"`; renders nothing when `totalPages ≤ 1`.
- Numbers list hidden below 48rem and the "Page x of y" text hidden from 48rem up, with a CSS class toggle (not the `hidden` attribute plus `display`, G18). Use `Button` where it fits the design (8px radius, 13px).
- Window as in the design: 1 2 3 … 24; always first and last, current ±1.

## Acceptance

- [ ] Tests: window cases (2, 5, 24 pages; first, middle, last page), Prev disabled on page 1, Next on the last, click calls `onPageChange(n)`, hidden for 1 page
- [ ] `lint`, `typecheck` pass

## Related

- Architecture: [[specs/2026-10/m/REQ-006-alumni-directory-page/architecture]]
- Spec: AC AC10
- All paths below are under `packages/frontend/`. Tokens only (`var(--…)`), CSS Modules, no inline styles, no raw hex, imports per the boundary rules. Import `describe/it/expect/vi` from vitest.

## Notes

- Window rule: first, last, and a run of three around the current page, shifted inward at page 1 and the last page (page 1 of 24 → 1 2 3 … 24, as in S2-Desktop). A gap that would hide a single page shows that page instead (page 4 → 1 2 3 4 5 … 24).
- Accessible names: "Previous page" / "Next page" (visible "Prev" / "Next"), numbers "Page n"; the "…" items are `aria-hidden`. In jsdom both the numbers row and "Page x of y" are present, since the swap is CSS only (`display` in a 48rem media query, no `hidden` attribute, G18).
- Uses `Button` (secondary; primary for the current page). Non-current numbers get the secondary `--border-strong` border, where the design mock shows `--border-subtle`; kept the primitive's look.
- Full `npm run lint` / `format:check` fail only on other concurrent tasks' files (Avatar, Chip.test, params.test, useDirectoryParams); this task's files are clean.
