# TASK-007 — Lazy route, lint ban, lazy guard and docs

| Field | Value |
|---|---|
| REQ | REQ-008 |
| Tier | 3 |
| Status | done |
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

- [x] A guest at `/alumni/3` goes to `/login` and back; a signed-in user sees the page inside the shell; a failed chunk shows RouteError.
- [x] Lint fails on a static import of `@/features/profile` from `app/` (self-test) and the guard test fails the same way.
- [x] A static import from `features/profile` of `features/directory` (and reverse) fails both lint and the guard test (add fixtures).
- [x] Build shows a separate chunk; entry chunk has no profile code.
- [x] Docs and ADR-08 say two lazy pages; `npm test`, `typecheck`, `lint`, `format:check`, `build` all pass.

## Notes

Also update `packages/frontend/src/services/README.md` for `getAlumniProfile`, `getPostsByUser` and `httpErrors.ts` (flagged by TASK-001). `relativeTime` returns `''` for an invalid date (TASK-002): the post card hides the time then.

Run lint without `--fix` surprises on unrelated files.

**Done (2026-10-07).**
- Route tests live in the existing router test, `app/AppShell/AppShell.test.tsx` ("Profile route": signed in, guest to /login and back, Loading… in main, failed chunk shows RouteError). There is no `router.test.tsx`.
- ESLint: `LAZY_FEATURES = ['directory', 'profile']` and `lazyBan(feature)`. The rule's options don't merge across flat-config blocks, so `lazyFeatureBoundaries()` emits three non-overlapping blocks: the rest of `src/` (both bans), `features/directory/**` (profile ban only), `features/profile/**` (directory ban only). Fixtures in `scripts/enforcement.test.ts` cover both directions.
- Guard test: the glob now reads every non-test file (lazy folders included); `describe.each(LAZY_FEATURES)` runs the scan, the router `import()` check and the route-tree check per feature. Cross-feature fixtures added. Mutation check: a real `features/profile/*.ts` importing `../directory/params` failed both lint and the guard, then was removed.
- Build: `ProfilePage-*.js` (10.3 kB) and `.css` are their own chunks; the entry `index-*.js` has no profile text. Vite also emits a shared chunk named `Avatar-*.js` (177 kB, vendor + primitives) that the entry preloads; it holds no page code.
- Out-of-task fix: "opens the user menu from the keyboard" in `AppShell.test.tsx` failed 3 of 8 runs on HEAD (focus lands a tick after the item appears); now waits for focus with `waitFor`. 8 of 8 green after.
- Also edited `src/app/README.md` (lazy routes, route list), which still described one lazy page.

## Related

- Architecture: [[specs/2026-10/m/REQ-008-alumni-profile-page/architecture]]
- Lessons checked: L-REQ-006-1/2/3, L-REQ-004-2, L-REQ-001-5
