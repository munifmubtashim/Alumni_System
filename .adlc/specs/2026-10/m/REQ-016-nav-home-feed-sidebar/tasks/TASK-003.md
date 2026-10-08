# TASK-003 — Navigation: Home link and Profile tab

| Field | Value |
|---|---|
| REQ | REQ-016 |
| Tier | 0 |
| Status | complete |
| Repo | alumni-system |
| Depends on | none |
| Blocks | 007 |

## Goal

Header nav is Home, Directory, Feed (+Admin); phone tabs are Home, Directory, Feed, Profile (+Admin); Profile opens the user's own public profile.

## Files to touch (paths under `packages/` unless noted)

- frontend/src/app/AppShell/navItems.tsx: add `end`, `own`; Home first; drop Account
- frontend/src/app/AppShell/NavIcons.tsx: HomeIcon
- frontend/src/app/AppShell/MainNav.tsx, BottomTabs.tsx: pass `end`; resolve `own` from `useCurrentUser()` (alumni_id -> `/alumni/<id>`, else `/me`)
- frontend/src/config: a Home path constant if none exists (HOME_PATH)
- AppShell.test.tsx and nav tests
- frontend/src/app/AppShell/README.md, root CLAUDE.md nav paragraph, packages/frontend/README.md, features/me/README.md and any README that lists nav (grep 'Account' / 'HEADER_NAV_ITEMS', L-REQ-010-5)

## Approach

- Keep the single source in `navItems.tsx`; filter with `visibleNavItems`.
- Home uses NavLink `end`; Profile tab is current on its own `/alumni/<id>` only.
- Avatar menu untouched.

## Acceptance

- [x] Header: Home, Directory, Feed, Admin(admin only), nothing else
- [x] Tabs: icon + label each; Profile href correct for alumni and for a user without a profile (-> /me)
- [x] Home current only at `/`
- [x] Tests updated; READMEs no longer say Account tab

## Notes

Spec: requirement.md in this folder. Conventions: tokens only, no hex; TanStack Query for server data; layers route -> controller -> Manager -> Query. Rebuild `packages/backend/src/businessLogic` (`tsc`) before running the API (CLAUDE.md). Draft the commit message into commits-draft.md.

Implementation (2026-10-08):
- `NavItem` gained `end?: true` (Home) and `own?: true` (Profile). An `own` item's `to` is its fallback (`/me`); `navItemPath(item, alumniId)` returns `/alumni/<id>` when `alumni_id` is set. MainNav and BottomTabs both call it with `useCurrentUser().data?.alumni_id`, and key links by label (an `own` item's href changes once `['me']` loads).
- While `['me']` is loading, the Profile tab briefly points at `/me`, then switches. Accepted: no extra loading state for one tab.
- For an alumni user on `/me`, no tab is current (Profile points at their public page). Tests cover this.
- `HomeIcon` is not in the design bundle (S1 has no Home tab); it's a house drawn in the same line style.
- `features/me/README.md` didn't mention the tab, so it's unchanged. "the Home card" mentions of /me in the READMEs and CLAUDE.md were left alone: TASK-007 removes that card and must update those lines.
- The brand link in `AppShell.tsx` still uses a literal `"/"` (out of scope; could use HOME_PATH).

## Related

- Architecture: [[specs/2026-10/m/REQ-016-nav-home-feed-sidebar/architecture]]
- Lessons checked: [[LESSON-REQ-008-6-copying-between-lazy-features-needs-a-home]], [[LESSON-REQ-010-5-nav-and-menu-changes-touch-every-readme-list]], [[LESSON-REQ-009-1-profile-links-need-the-alumni-id]]
