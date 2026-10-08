# TASK-004 — Shared page width and footer alignment

| Field | Value |
|---|---|
| REQ | REQ-016 |
| Tier | 0 |
| Status | done |
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

- [x] Measured edges (getBoundingClientRect in the browser) equal for footer inner and page container on /, /directory and /alumni/<id> at 768, 1024 and 1440px
- [x] Tokens only; stylelint passes

## Notes

Spec: requirement.md in this folder. Conventions: tokens only, no hex; TanStack Query for server data; layers route -> controller -> Manager -> Query. Rebuild `packages/backend/src/businessLogic` (`tsc`) before running the API (CLAUDE.md). Draft the commit message into commits-draft.md.

**Implementation (TASK-004, 2026-10-08):**
- `--page-max: 72rem` on `.shell`; Home (was 65rem, left-aligned), Directory (72rem literal), Profile (53.75rem) and `SiteFooter` `.inner` (was 56.25rem) all use `width: min(100%, var(--page-max)); margin-inline: auto`. Footer side padding already equalled `.main`'s (space-4 phone, space-6 from 48rem), so only the cap changed.
- README: the task named `app/AppShell/README.md`, which does not exist; the AppShell text lives in `src/app/README.md` (line 12, last sentence). Edited that sentence only; TASK-003 owns the nav part of the same paragraph.
- Test: `SiteFooter.test.tsx` pins the structure (one inner box holding © and the footer nav); jsdom has no layout.
- Measurement: Brave headless over CDP (Node 24 WebSocket, no new dependency), `/api/*` answered with fakes through `Fetch.requestPaused` and an unsigned JWT-shaped token in localStorage, so no login or DB write. Left/right of `footer > div` vs the page container: 768 → 32/736 (directory 32/721, a scrollbar, same for both), 1024 → 32/992, 1440 → 144/1296; equal on all nine.
- Checks: typecheck and lint (ESLint + Stylelint) clean; Vitest 1558 passed, 5 failed, all in `AppShell.test.tsx` tab-bar tests that TASK-003 is changing at the same time (Account tab removed); none touch these files.

## Related

- Architecture: [[specs/2026-10/m/REQ-016-nav-home-feed-sidebar/architecture]]
- Lessons checked: [[LESSON-REQ-008-6-copying-between-lazy-features-needs-a-home]], [[LESSON-REQ-010-5-nav-and-menu-changes-touch-every-readme-list]], [[LESSON-REQ-009-1-profile-links-need-the-alumni-id]]
