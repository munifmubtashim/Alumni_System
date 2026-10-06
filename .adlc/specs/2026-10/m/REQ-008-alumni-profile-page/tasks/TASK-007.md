# TASK-007 — Lazy route, lint ban, lazy guard and docs

| Field | Value |
|---|---|
| REQ | REQ-008 |
| Tier | 3 |
| Status | pending |
| Repo | alumni-system |
| Depends on | TASK-006 |
| Blocks | TASK-008 |

## Goal

Lazy route, lint ban, lazy guard and docs.

## Files to touch

| Path | Action |
|---|---|
| `packages/frontend/src/app/router.tsx` | edit (PROFILE_ROUTE, `alumni/:id`) |
| `packages/frontend/src/app/router.test.tsx` (or the existing router test) | edit |
| `packages/frontend/src/app/lazyRoutes.test.ts` | edit (list of lazy features) |
| `packages/frontend/eslint.config.js` | edit (ban covers profile) + its lint self-test fixtures |
| `packages/frontend/src/features/README.md`, `packages/frontend/README.md`, `CLAUDE.md` | edit |
| `.adlc/architecture/adr-08-route-code-splitting-and-url-list-state.md`, `.adlc/knowledge/concepts/route-layout.md` | edit (profile is the second lazy page) |

## Approach

- `PROFILE_ROUTE` mirrors `DIRECTORY_ROUTE` (`path: 'alumni/:id'`, static `HydrateFallback`, `lazy` with dynamic import) under `RequireAuth`.
- Generalise the ESLint ban and `lazyRoutes.test.ts` to a list of lazy features, but with **one check per feature**, each leaving out only that feature's own folder (ADV-006). A static import from `features/profile` to `features/directory`, or the reverse, must fail. Keep the sibling-form patterns; keep `import type` allowed.
- Run `npm run build`: confirm a separate profile chunk in `dist/assets` and none of its code in the entry chunk.

## Acceptance

- [ ] A guest at `/alumni/3` goes to `/login` and back; a signed-in user sees the page inside the shell; a failed chunk shows RouteError.
- [ ] Lint fails on a static import of `@/features/profile` from `app/` (self-test) and the guard test fails the same way.
- [ ] A static import from `features/profile` of `features/directory` (and reverse) fails both lint and the guard test (add fixtures).
- [ ] Build shows a separate chunk; entry chunk has no profile code.
- [ ] Docs and ADR-08 say two lazy pages; `npm test`, `typecheck`, `lint`, `format:check`, `build` all pass.

## Notes

Run lint without `--fix` surprises on unrelated files.

## Related

- Architecture: [[specs/2026-10/m/REQ-008-alumni-profile-page/architecture]]
- Lessons checked: L-REQ-006-1/2/3, L-REQ-004-2, L-REQ-001-5
