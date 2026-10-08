# TASK-004 — Shared page width and footer alignment

| Field | Value |
|---|---|
| REQ | REQ-016 |
| Tier | 0 |
| Status | pending |
| Repo | alumni-system |
| Depends on | none |
| Blocks | 006 |

## Goal

The footer's content box has the same left and right edges as the page content on Home, Directory, Feed and Profile at desktop and tablet widths.

## Files to touch (paths under `packages/` unless noted)

- frontend/src/app/AppShell/AppShell.module.css: define `--page-max: 72rem` on `.shell`
- frontend/src/app/AppShell/SiteFooter.module.css: inner uses `min(100%, var(--page-max))`, padding like `.main`
- frontend/src/features/home/HomePage.module.css (centre, use `--page-max`), directory and profile CSS only where their column differs
- frontend/src/app/AppShell/SiteFooter.test.tsx (class/structure only; jsdom has no layout)
- frontend/src/app/AppShell/README.md

## Approach

- Footer horizontal padding matches `.main`'s so only the cap decides the edge.
- Check Profile's cap: widen Profile (`ProfilePage.module.css`, 53.75rem) to `--page-max` so its edges match; the user confirmed this at the architect gate (ADV-002). Measure only Home, Directory and Profile here; Feed is measured in TASK-006/008 once its grid exists.

## Acceptance

- [ ] Measured edges (getBoundingClientRect in the browser) equal for footer inner and page container on /, /directory and /alumni/<id> at 768, 1024 and 1440px
- [ ] Tokens only; stylelint passes

## Notes

Spec: requirement.md in this folder. Conventions: tokens only, no hex; TanStack Query for server data; layers route -> controller -> Manager -> Query. Rebuild `packages/backend/src/businessLogic` (`tsc`) before running the API (CLAUDE.md). Draft the commit message into commits-draft.md.

## Related

- Architecture: [[specs/2026-10/m/REQ-016-nav-home-feed-sidebar/architecture]]
- Lessons checked: [[LESSON-REQ-008-6-copying-between-lazy-features-needs-a-home]], [[LESSON-REQ-010-5-nav-and-menu-changes-touch-every-readme-list]], [[LESSON-REQ-009-1-profile-links-need-the-alumni-id]]
