# TASK-010 — Lazy route, fallback, guard test, docs

| Field | Value |
|---|---|
| REQ | REQ-006 |
| Tier | 3 |
| Status | done |
| Repo | alumni-system (worktree .worktrees/REQ-006-alumni-directory-page) |
| Depends on | TASK-006, TASK-009 |
| Blocks | TASK-011 |

## Goal

`/directory` is a lazy route in its own chunk, and the docs say so.

## Files to touch

| Path | Action |
|---|---|
| `src/app/router.tsx` | edit — `directory` route with `lazy` under `RequireAuth`; `HydrateFallback` set as a property of the `directory` route object itself (ADV-003) |
| `src/app/HydrateFallback.tsx` (+ css) | create — small "Loading…" status |
| `src/app/lazyRoutes.test.ts` | create — guard: no static import of `features/directory` anywhere under `src/` outside that folder and tests (scan all of `src/`, ADV-004); route has `lazy` |
| `src/app/AppShell/AppShell.test.tsx` | edit — a rejecting `lazy` shows the inner `RouteError`; shell stays visible while the lazy route loads; signed-in visit to `/directory` renders the page; guest is sent to `/login` and back |
| `src/app/README.md`, `src/features/README.md`, `src/components/ui/README.md`, `README.md` (frontend), root `CLAUDE.md` (Frontend section: structure, routing, lazy rule) | edit — every folder README the change touches (L-REQ-002-6) |

## Approach

- Run `npm install` at the worktree root first if `node_modules` is missing.
- After the code: `npm run build`; confirm a separate chunk with the page code in `dist/assets` and none of it in the entry chunk (record the file names in the task notes).
- `tokens:check`, `format:check`, `lint`, `typecheck`, `test` all green.

## Acceptance

- [ ] Guard test and route tests pass; build shows the separate chunk
- [ ] Docs updated in every file listed

## Related

- Architecture: [[specs/2026-10/m/REQ-006-alumni-directory-page/architecture]]
- Spec: AC AC1, AC3, AC15
- All paths below are under `packages/frontend/`. Tokens only (`var(--…)`), CSS Modules, no inline styles, no raw hex, imports per the boundary rules. Import `describe/it/expect/vi` from vitest.

## Notes

- Done 2026-10-06. The first implementer run stopped on a rate limit after the code and most docs were written; the orchestrator verified and finished it (one lint fix in `AppShell.test.tsx`, notes, commit draft).
- `DIRECTORY_ROUTE` in `app/router.tsx` has `lazy` (dynamic import of `@/features/directory/DirectoryPage`) and a static `HydrateFallback`; `app/HydrateFallback.tsx`; guard `app/lazyRoutes.test.ts`; READMEs and root `CLAUDE.md` updated.
- Build: `dist/assets/DirectoryPage-BN7W-PpK.js` (25.38 kB, gzip 9.20) and `DirectoryPage-CBVquYjf.css` (8.83 kB) are separate chunks. The entry `index-CkpUvxMc.js` (586 kB) holds only the dynamic-import stub; the page text "Alumni Directory" appears only in the page chunk.
- Checks: typecheck, lint, format:check, tokens:check clean; 699 tests pass (50 files).
- The 586 kB entry chunk triggers Vite's 500 kB warning; it predates this REQ (Base UI, React, router) and is not addressed here.
