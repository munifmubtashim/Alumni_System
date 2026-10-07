# TASK-008 — Docs

| Field | Value |
|---|---|
| REQ | REQ-011 |
| Tier | 3 |
| Status | done |
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

- [x] No doc still says these fields are unbuilt

## Notes

Keep the unbuilt note for photo upload.

Done 2026-10-07. Edited CLAUDE.md (API alumni-fields sentence, deploy order under Environment, Switch in primitives and Base UI list, Directory Mentor tag, Profile headline/location/badge/degree line, My Profile Mentorship section and alumni-only fields, Start year hidden below 48rem, "Not built" = photo upload only, form size 17 controls), conventions-api.md (new "Alumni profile fields" bullet), knowledge/components/frontend.md (Switch, REQ-011 summary), packages/frontend/README.md (profile sections, Mentor tag, My Profile, Base UI row, primitive list; prettier rewrapped the stack table), me and profile READMEs (help text; badge no longer names a Tag tone, since TASK-009 may change it). components/ui README already listed Switch (TASK-003). There is no directory README. Frontend `format:check` clean.
Left alone: ADR-04's "up to 12 fields" (a decision record; wrapup may add a REQ-011 line), and features/README.md's home line ("directory and the feed", missing My Profile since REQ-010; unrelated to these fields).

## Related

- Architecture: [[specs/2026-10/m/REQ-011-profile-headline-location-mentorship/architecture]]
- Lessons checked: see architecture.md
