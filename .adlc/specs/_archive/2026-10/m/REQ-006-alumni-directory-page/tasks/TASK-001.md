# TASK-001 — services/alumniApi.ts

| Field | Value |
|---|---|
| REQ | REQ-006 |
| Tier | 0 |
| Status | pending |
| Repo | alumni-system (worktree .worktrees/REQ-006-alumni-directory-page) |
| Depends on | — |
| Blocks | TASK-009 |

## Goal

`searchAlumni(params)` calls `GET /api/alumni` through `httpClient` and returns `AlumniListResponse`; empty values are never sent.

## Files to touch

| Path | Action |
|---|---|
| `src/services/alumniApi.ts` | create |
| `src/services/alumniApi.test.ts` | create |
| `src/services/README.md` | edit — list the new file |

## Approach

- Prerequisite for every task: `npm install` at the worktree root, then `npm run typecheck` once for a baseline (the worktree has no `node_modules`; ADV-006).

- Type `AlumniSearchParams { q?, department?, university?, graduationYear?: number, page, pageSize }`; build `params` omitting undefined / empty strings; follow `authApi.ts`.
- No React, no imports from features (boundary rule). Page size is the caller's argument; the constant lives in the feature.

## Acceptance

- [x] Tests (axios adapter): query string for all params; empty `q` / undefined filters omitted; `page` and `pageSize` always sent; returns `{ items, total }`; a non-2xx rejects with the axios error
- [x] `npm test`, `typecheck`, `lint` pass

## Related

- Architecture: [[specs/2026-10/m/REQ-006-alumni-directory-page/architecture]]
- Spec: AC AC4
- All paths below are under `packages/frontend/`. Tokens only (`var(--…)`), CSS Modules, no inline styles, no raw hex, imports per the boundary rules. Import `describe/it/expect/vi` from vitest.

## Notes

- `toQueryParams` drops `q`/`department`/`university` when undefined or whitespace-only (the API treats blank as absent anyway) but sends non-blank values untrimmed; the backend trims. `graduationYear` is dropped only when undefined.
- Tests read the wire query string via `httpClient.getUri(config)`, not `config.params`, so encoding (`R&D lead`) is checked too.
- Error test uses a rejecting adapter (`failWith`), copied from the `httpClient.test.ts` pattern; a resolving adapter with status 400 does not reject.
- Full `npm test`: 484/485 pass; the one failure is `AppShell.test.tsx` ("has no nav links"), which a concurrent task is editing (header Directory link), not this task.
