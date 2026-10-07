# TASK-007 — Public profile and directory card

| Field | Value |
|---|---|
| REQ | REQ-011 |
| Tier | 1 |
| Status | pending |
| Repo | alumni-system |
| Depends on | TASK-002 |
| Blocks | TASK-008, TASK-009 |

## Goal

The public profile and the directory show the new data as in S3 and S2 (AC11, AC12).

## Files to touch

| Path | Action |
|---|---|
| `features/profile/ProfileHeader.tsx` (+ css, test) | edit |
| `features/profile/EducationSection.tsx`, `format.ts` + tests | edit |
| `features/profile/README.md` | edit |
| `features/directory/AlumniCard.tsx` (+ css, test) | edit; also drop the comment 'No Mentor tag' |

## Approach

- `degreeLine` pure helper in `format.ts`; Education timeline item shows it; section hides when nothing to show.
- Header: headline, location, badge "Available for mentorship" per S3; each hides when empty.
- Card: `Tag` "Mentor" when `mentorship_available === true`; slot per S2 (read the S2 file).

## Acceptance

- [ ] Each piece hides when empty; a profile with none looks as today
- [ ] Mentor tag present/absent tests
- [ ] lint, typecheck, tests pass

## Notes

Don't import across lazy features.

## Related

- Architecture: [[specs/2026-10/m/REQ-011-profile-headline-location-mentorship/architecture]]
- Lessons checked: see architecture.md
