# TASK-011 — Side-by-side design check and fixes

| Field | Value |
|---|---|
| REQ | REQ-006 |
| Tier | 4 |
| Status | done |
| Repo | alumni-system (worktree .worktrees/REQ-006-alumni-directory-page) |
| Depends on | TASK-010 |
| Blocks | — |

## Goal

The running page matches the S2 designs (desktop and phone, light and dark, no-results), with remaining differences listed and justified.

## Files to touch

| Path | Action |
|---|---|
| `src/features/directory/*.css`, `src/components/ui/{Avatar,Chip,SearchField,Popover,Skeleton}/*.css`, `src/app/AppShell/*.css` | edit — fixes only |
| `.adlc/specs/2026-10/m/REQ-006-alumni-directory-page/design-check.md` | create — table of screens, differences, fixed / accepted + why |

## Approach

- Copy the root `.env` from the main checkout into the worktree (gitignored; never commit or print it).
- Start the API and Postgres (root `.env`), or, if there is no database, a throwaway stub of `GET /api/alumni` kept outside the repo; start Vite (`npm run dev`). Use Claude in Chrome: open the design file (`docs/design/screens/app/S2-*.dc.html`) in one tab and the page in another at 1440 and 390 px, light and dark, plus a search with no results; screenshot each pair and compare.
- Fix differences with tokens only. Known deliberate differences: phone nav link in the header (no bottom tab bar), one heading "Alumni Directory" on phone, brand "Alma", 72rem column, existing user menu/theme toggle, no Mentor tag, no Field filter, single year not range.
- Never copy hex from the design files; map to tokens (README of screens).

## Acceptance

- [ ] A pair of screenshots per screen reviewed; `design-check.md` lists every remaining difference
- [ ] `lint`, `typecheck`, `test`, `build` still green

## Related

- Architecture: [[specs/2026-10/m/REQ-006-alumni-directory-page/architecture]]
- Spec: AC AC12, AC13
- All paths below are under `packages/frontend/`. Tokens only (`var(--…)`), CSS Modules, no inline styles, no raw hex, imports per the boundary rules. Import `describe/it/expect/vi` from vitest.

## Notes

- Done 2026-10-06 by the orchestrator (the implementer sub-agent has no browser). Result and the list of remaining differences: `design-check.md`.
- Browser check used the real API and DB (read-only; a short-lived token was minted for an existing user and the localStorage token removed afterwards). Servers stopped; the copied `.env` and token file deleted.
- One fix: search placeholder ellipsis. TASK-006's 360px header check: header wraps to 3 rows, no horizontal scroll.
