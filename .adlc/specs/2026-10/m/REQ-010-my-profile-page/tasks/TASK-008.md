# TASK-008 — Docs and vault updates

| Field | Value |
|---|---|
| REQ | REQ-010 |
| Tier | 3 |
| Status | done |
| Repo | alumni-system |
| Depends on | TASK-005 |
| Blocks | none |

## Goal

User-facing and vault docs describe /me, the new primitives, the nav change and the new lazy-page count.

## Files to touch

| Path | Action |
|---|---|
| `CLAUDE.md` (repo root) | edit (Frontend: structure list, primitives list, routing, lazy routes, new My Profile paragraph) |
| `.adlc/architecture/adr-08-route-code-splitting-and-url-list-state.md` | edit (count) |
| `.adlc/knowledge/concepts/route-layout.md`, `.adlc/knowledge/components/frontend.md` | edit |
| `packages/frontend/src/features/me/README.md` | check against final code |

## Approach

- Mirror how REQ-009 recorded the feed in CLAUDE.md. State plainly that mentorship, headline, location, degree, start year and photo upload are not built and why.
- Do not write lessons or gotchas here; /wrapup owns those.

## Acceptance

- [x] Every doc that lists lazy pages, primitives or nav items includes the new ones
- [x] CLAUDE.md paragraph matches the code as built

## Notes

Do this after TASK-007 if the UI changed there.

- 2026-10-07: also fixed S5 difference #13 (the "All sections saved" caption in `ProfileForm`, `.allSaved`, label size at body weight, ink-secondary). Not re-shot in the browser.
- features/me/README.md checked against the code (save flow, invalidations, leave guard, prompt focus); only the caption line added.
- Left stale, out of scope: `features/feed/README.md` and `features/profile/README.md` do not name `me` among lazy features; `components/frontend.md`'s intro still describes the REQ-004 header.

## Related

- Architecture: [[specs/2026-10/m/REQ-010-my-profile-page/architecture]]
- Lessons checked: [[LESSON-REQ-006-3-client-copies-of-api-limits]], [[LESSON-REQ-002-3-must-succeed-steps-inside-mutationfn]], [[LESSON-REQ-009-4-adding-a-lazy-feature-touches-six-lists]], [[LESSON-REQ-007-1-sticky-bottom-bar-needs-scroll-padding]], [[LESSON-REQ-004-2-check-design-colours-against-token-pairs]]
