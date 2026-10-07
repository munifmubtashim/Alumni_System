# TASK-009 — Design comparison and fixes

| Field | Value |
|---|---|
| REQ | REQ-011 |
| Tier | 3 |
| Status | pending |
| Repo | alumni-system |
| Depends on | TASK-005, TASK-006, TASK-007 |
| Blocks | — |

## Goal

Screenshots of My Profile, a public profile and the directory sit beside S5, S3, S2 at desktop and phone, light and dark; differences are fixed or explained (AC15).

## Files to touch

| Path | Action |
|---|---|
| `.adlc/specs/2026-10/m/REQ-011-profile-headline-location-mentorship/ui-evidence/` | create |
| frontend CSS/components as needed | edit |

## Approach

- Apply 004 to the dev database (ask first), run API + frontend, seed one alumnus with all five fields.
- Capture 1440 px and 390 px, light and dark, for the three pages and the matching design files; write `differences.md`. Fix what differs.

## Acceptance

- [ ] 12 comparisons (3 pages × 2 widths × 2 themes) saved
- [ ] Remaining differences listed with reason

## Notes

Applying a migration to the dev database is a schema change: stop and confirm with the user first.

## Related

- Architecture: [[specs/2026-10/m/REQ-011-profile-headline-location-mentorship/architecture]]
- Lessons checked: see architecture.md
