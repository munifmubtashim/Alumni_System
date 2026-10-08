# TASK-008 — Docs, full checks and screenshot sweep

| Field | Value |
|---|---|
| REQ | REQ-016 |
| Tier | 4 |
| Status | complete |
| Repo | alumni-system |
| Depends on | 006, 007 |
| Blocks | none |

## Goal

Docs match the code, every check is green, and the screenshot matrix shows no unfixed difference from the spec.

## Files to touch (paths under `packages/` unless noted)

- frontend/README.md, root CLAUDE.md (Architecture: nav, Home, Feed, new endpoint, `people` folder), .adlc/context/conventions-api.md
- screenshots in the scratchpad (not committed)

## Approach

- Run: frontend typecheck, lint, format:check, tokens:check, test, build; backend typecheck + tests.
- Start API + Vite; screenshot Home, Feed and the phone tab bar at ~1280px and 390px, light and dark (12 shots max); compare each against every spec line; list every difference; fix; re-shoot.
- Measure footer vs content edges.

## Acceptance

- [x] All checks pass (output quoted)
- [x] Difference list written to the REQ folder (`screenshot-diff.md`) with each item fixed or flagged
- [x] Production build shows the Feed and Directory still as separate chunks

## Notes

Spec: requirement.md in this folder. Conventions: tokens only, no hex; TanStack Query for server data; layers route -> controller -> Manager -> Query. Rebuild `packages/backend/src/businessLogic` (`tsc`) before running the API (CLAUDE.md). Draft the commit message into commits-draft.md.

Implementation (2026-10-08):
- Checks (after fixes): frontend typecheck, lint (ESLint + Stylelint), format:check, tokens:check all clean; `npm test` 112 files, 1627 passed; build OK with `FeedPage-*.js` (23.8 kB) and `DirectoryPage-*.js` (24.3 kB) separate chunks. Backend: test:backend 16 files, 664 passed; typecheck:backend exit 0.
- Screenshots: headless Brave over CDP (scratchpad `harness.mjs`), `/api/*` faked in the browser; the running API and DB were not used for them. Results and open items: `screenshot-diff.md`.
- Real DB used once, read-only: `AlumniQuery.suggestAlumni` for three users ranks department > university > name, and a caller with neither gets name order (the check TASK-002 asked for).
- Fixes (in TASK-005/006/007 files): Feed sidebar 16rem from 48rem, 20rem from 64rem (posts 424px at 768, was 352px); Home kept 20rem because 16rem cut mentor names; the sidebar `aside aria-label` is now a plain div (the card's region already carries the name); `PersonRow` role line wraps to 2 lines. FeedPage tests now find the card by role `region`.
- Footer edges equal on Home, Directory, Feed, Profile at 768/1024/1440 (32/736, 32/992, 144/1296).
- Docs: `people/` in `features/README.md`, `packages/frontend/README.md` (folder map, new Home section, Feed sidebar, `homePath.ts`) and CLAUDE.md (feature list, `GET /api/alumni` `mentorship`, `GET /api/alumni/suggestions`, Feed sidebar); `mentorship` added to `conventions-api.md`. Root CLAUDE.md already failed Prettier at HEAD; it is outside the frontend check.
- Not fixed (outside this REQ's files): underlined initials in feed avatars (`Byline.module.css`, since REQ-009); stale comments in `HeaderAuth.tsx:17` and `useLeaveGuard.ts:22`.

## Related

- Architecture: [[specs/2026-10/m/REQ-016-nav-home-feed-sidebar/architecture]]
- Lessons checked: [[LESSON-REQ-008-6-copying-between-lazy-features-needs-a-home]], [[LESSON-REQ-010-5-nav-and-menu-changes-touch-every-readme-list]], [[LESSON-REQ-009-1-profile-links-need-the-alumni-id]]
