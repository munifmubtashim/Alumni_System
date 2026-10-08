# TASK-004 — Frontend: admin services, RequireAdmin + 403 page, lazy ADMIN_ROUTE, admin-only links

| Field | Value |
|---|---|
| REQ | REQ-015 |
| Tier | 1 |
| Status | done |
| Repo | alumni-system |
| Depends on | TASK-001, TASK-002 |
| Blocks | TASK-005 |

## Goal

The frontend can call every admin endpoint and the sort params; /admin is a lazy route guarded by RequireAdmin (403 page for non-admins); admins see Admin in header nav and tab bar and "Admin settings" in the avatar menu.

## Files to touch

| Path | Action |
|---|---|
| `packages/frontend/src/services/adminApi.ts` | create |
| `packages/frontend/src/services/adminApi.test.ts` | create |
| `packages/frontend/src/services/alumniApi.ts` | edit (sort, order) |
| `packages/frontend/src/services/alumniApi.test.ts` | edit |
| `packages/frontend/src/config/adminPath.ts` | create |
| `packages/frontend/src/features/auth/guards.tsx` | edit (RequireAdmin, useIsAdmin, ForbiddenPage) |
| `packages/frontend/src/features/auth/guards.test.tsx` | edit |
| `packages/frontend/src/features/auth/index.ts` | edit |
| `packages/frontend/src/features/admin/AdminPage.tsx` | create (heading-only placeholder, filled by TASK-005) |
| `packages/frontend/src/app/router.tsx` | edit |
| `packages/frontend/src/app/lazyRoutes.test.ts` | edit (LAZY_FEATURES) |
| `packages/frontend/eslint.config.js` | edit if its lazy ban list is not derived |
| `packages/frontend/scripts/enforcement.test.ts` | edit if needed |
| `packages/frontend/src/app/AppShell/navItems.tsx` | edit |
| `packages/frontend/src/app/AppShell/NavIcons.tsx` | edit (ShieldIcon) |
| `packages/frontend/src/app/AppShell/MainNav.tsx` | edit |
| `packages/frontend/src/app/AppShell/BottomTabs.tsx` | edit |
| `packages/frontend/src/app/AppShell/HeaderAuth.tsx` | edit |
| `packages/frontend/src/app/AppShell/AppShell.test.tsx` | edit |

## Approach

- adminApi: getAdminStats, createAlumniAccount, updateAlumniAccount, deleteAlumniAccount (data only, through httpClient). searchAlumni passes sort/order when set.
- RequireAdmin: useCurrentUser pending → "Loading…" in main; error → existing error + Retry pattern; role admin → <Outlet/>; else ForbiddenPage (h1 "You don't have access to this page", short text, ButtonLink home). Router: `{ element: <RequireAdmin/>, children: [ADMIN_ROUTE] }` inside RequireAuth. ADMIN_ROUTE lazy with HydrateFallback on the route object; add to LAZY_FEATURES (lists derive from it, L-REQ-014-1; follow the six-list checklist in L-REQ-009-4).
- Nav: `adminOnly` flag on NavItem; ADMIN_NAV_ITEM appended to HEADER_NAV_ITEMS and TAB_NAV_ITEMS; MainNav/BottomTabs filter by useIsAdmin(). HeaderAuth adds "Admin settings" after Account settings for admins (navigate ADMIN_PATH). Update the doc comments that say "add Admin when its page is built".

## Acceptance

- [ ] Guest at /admin → /login, back to /admin after login (existing RequireAuth behaviour, tested)
- [ ] Alumni and student at /admin → 403 page, no request to /api/admin (asserted via adapter)
- [ ] Admin sees Admin link (aria-current on /admin), Admin tab, Admin settings; alumni/student see none
- [ ] lazyRoutes + enforcement tests green; `npm run build` emits a separate AdminPage chunk
- [ ] typecheck, lint, format:check, tests pass

## Notes

The 403 page must not log out (403 ≠ 401, ADR-03). Keep `features/admin` without an index.ts.

Implementation notes (2026-10-08):
- Files outside the list: `features/auth/useIsAdmin.ts` (react-refresh lint rejects a hook exported from `guards.tsx`) and `features/auth/guards.module.css` (ForbiddenPage styles). Both inside `features/auth`.
- The failed-['me'] box is now a shared `AccountError` in `guards.tsx`, used by both guards (same text, Retry + Log out).
- `RequireAdmin` is data-first: with cached ['me'] data it never shows the error box (L-REQ-010-2); a 401 keeps the loading line, as in RequireAuth. Inside the real tree RequireAuth handles pending/error first; `guards.test.tsx` mounts RequireAdmin alone at `/bare-admin` to reach those branches.
- `TAB_NAV_ITEMS` order follows S6 phone: Directory, Feed, Account, Admin. `visibleNavItems(items, isAdmin)` in `navItems.tsx` does the filtering.
- ShieldIcon path copied from `docs/design/screens/app/S6-Phone-Light.dc.html`.
- READMEs and vault lists (L-REQ-009-4 doc half, L-REQ-010-5) are left for TASK-008.
- Gates: frontend tests 1407/1407, typecheck, lint, format:check green; `npm run build` emits `AdminPage-*.js`.

## Related

- Architecture: [[specs/2026-10/m/REQ-015-admin-page/architecture]]
- Lessons checked: L-REQ-009-4, L-REQ-010-2, L-REQ-010-5, L-REQ-014-1, G19, G42
