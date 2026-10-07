# TASK-005 — Lazy route wiring and the six lists

| Field | Value |
|---|---|
| REQ | REQ-010 |
| Tier | 2 |
| Status | done |
| Repo | alumni-system |
| Depends on | TASK-004 |
| Blocks | TASK-006, TASK-007, TASK-008 |

## Goal

`/me` is a lazy route in the router, guarded by RequireAuth, and every list that names the lazy features includes it.

## Files to touch

| Path | Action |
|---|---|
| `packages/frontend/src/app/router.tsx` | edit (`ME_ROUTE`) |
| `packages/frontend/src/app/lazyRoutes.test.ts` | edit (`LAZY_FEATURES`) |
| `packages/frontend/eslint.config.js` | edit (`LAZY_FEATURES`) |
| `packages/frontend/src/app/README.md`, `src/features/README.md`, `packages/frontend/README.md` | edit |

## Approach

- Follow `FEED_ROUTE` exactly: static `HydrateFallback` on the route object, `lazy` dynamic import of `@/features/me/MePage`, child of RequireAuth.
- Update the lazy-page count wherever it is stated (grep 'three lazy' and 'LAZY_FEATURES').
- Run `npm run build` and confirm a separate chunk for the page.

## Acceptance

- [ ] `lazyRoutes.test.ts` passes with the new entry (no static import, route has lazy and HydrateFallback)
- [ ] A guest visiting `/me` goes to `/login`
- [ ] Build output shows the page as its own chunk
- [ ] Lint, typecheck, tests pass

## Notes

A direct visit to /me must keep the shell (fallback on the route object itself).

**Implementation (2026-10-07).** `ME_ROUTE` (`path: 'me'`) added after `FEED_ROUTE`, same shape. `'me'` added to `LAZY_FEATURES` in `eslint.config.js` and `lazyRoutes.test.ts` (plus flag/allow cases). Two files beyond the task's list: `scripts/enforcement.test.ts` (LESSON-REQ-009-4 names its fixtures as one of the lists; added `me` reject cases, and allow cases for `features/me` importing `features/auth` per ADV-006 and for `@/features/media`) and `AppShell.test.tsx` (a "My Profile route" block like the Feed one: signed-in render, guest sent to `/login` without `GET /me`, shell kept with "Loading…" while the chunk loads). `config/README.md` got the `mePath.ts` line. Build: `dist/assets/MePage-*.js` (16.8 kB) and `MePage-*.css` are separate chunks; the index bundle has no ProfileForm text.

**Flaky test (not mine, not fixed).** `features/me/ProfileForm.test.tsx:402` ("blocks leaving while a save is in flight...") failed 1 run in 5: the leave prompt is still in the DOM right after the toast appears, because `blocker.reset()` runs in an effect (`ProfileForm.tsx:96`) a tick later. Fix: wrap lines 402-403 in `await waitFor(...)`. Belongs to TASK-004's file. See CAND-013.

## Related

- Architecture: [[specs/2026-10/m/REQ-010-my-profile-page/architecture]]
- Lessons checked: [[LESSON-REQ-006-3-client-copies-of-api-limits]], [[LESSON-REQ-002-3-must-succeed-steps-inside-mutationfn]], [[LESSON-REQ-009-4-adding-a-lazy-feature-touches-six-lists]], [[LESSON-REQ-007-1-sticky-bottom-bar-needs-scroll-padding]], [[LESSON-REQ-004-2-check-design-colours-against-token-pairs]]
