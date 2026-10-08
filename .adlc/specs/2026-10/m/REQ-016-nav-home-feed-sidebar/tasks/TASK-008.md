# TASK-008 — Docs, full checks and screenshot sweep

| Field | Value |
|---|---|
| REQ | REQ-016 |
| Tier | 4 |
| Status | pending |
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

- [ ] All checks pass (output quoted)
- [ ] Difference list written to the REQ folder (`screenshot-diff.md`) with each item fixed or flagged
- [ ] Production build shows the Feed and Directory still as separate chunks

## Notes

Spec: requirement.md in this folder. Conventions: tokens only, no hex; TanStack Query for server data; layers route -> controller -> Manager -> Query. Rebuild `packages/backend/src/businessLogic` (`tsc`) before running the API (CLAUDE.md). Draft the commit message into commits-draft.md.

## Related

- Architecture: [[specs/2026-10/m/REQ-016-nav-home-feed-sidebar/architecture]]
- Lessons checked: [[LESSON-REQ-008-6-copying-between-lazy-features-needs-a-home]], [[LESSON-REQ-010-5-nav-and-menu-changes-touch-every-readme-list]], [[LESSON-REQ-009-1-profile-links-need-the-alumni-id]]
