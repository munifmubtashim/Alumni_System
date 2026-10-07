# TASK-008 — Docs

| Field | Value |
|---|---|
| REQ | REQ-011 |
| Tier | 3 |
| Status | pending |
| Repo | alumni-system |
| Depends on | TASK-005, TASK-006, TASK-007 |
| Blocks | — |

## Goal

Docs say what is now built (L-REQ-010-5).

## Files to touch

| Path | Action |
|---|---|
| `CLAUDE.md` | edit (My Profile 'Not built', profile, directory, API paragraph) |
| `.adlc/context/conventions-api.md` | edit |
| `features/me|profile|directory/README.md`, `components/ui/README.md` | edit if still stale |

## Approach

- grep the repo docs for 'headline', 'Not built', 'Mentor' and fix each list.

## Acceptance

- [ ] No doc still says these fields are unbuilt

## Notes

Keep the unbuilt note for photo upload.

## Related

- Architecture: [[specs/2026-10/m/REQ-011-profile-headline-location-mentorship/architecture]]
- Lessons checked: see architecture.md
