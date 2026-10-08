# TASK-003 — Navigation: Home link and Profile tab

| Field | Value |
|---|---|
| REQ | REQ-016 |
| Tier | 0 |
| Status | pending |
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

- [ ] Header: Home, Directory, Feed, Admin(admin only), nothing else
- [ ] Tabs: icon + label each; Profile href correct for alumni and for a user without a profile (-> /me)
- [ ] Home current only at `/`
- [ ] Tests updated; READMEs no longer say Account tab

## Notes

Spec: requirement.md in this folder. Conventions: tokens only, no hex; TanStack Query for server data; layers route -> controller -> Manager -> Query. Rebuild `packages/backend/src/businessLogic` (`tsc`) before running the API (CLAUDE.md). Draft the commit message into commits-draft.md.

## Related

- Architecture: [[specs/2026-10/m/REQ-016-nav-home-feed-sidebar/architecture]]
- Lessons checked: [[LESSON-REQ-008-6-copying-between-lazy-features-needs-a-home]], [[LESSON-REQ-010-5-nav-and-menu-changes-touch-every-readme-list]], [[LESSON-REQ-009-1-profile-links-need-the-alumni-id]]
