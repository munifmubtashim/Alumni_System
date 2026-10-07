# TASK-007 — Public profile and directory card

| Field | Value |
|---|---|
| REQ | REQ-011 |
| Tier | 1 |
| Status | done |
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

- [x] Each piece hides when empty; a profile with none looks as today
- [x] Mentor tag present/absent tests
- [x] lint, typecheck, tests pass (one unrelated features/me failure from TASK-006 in flight)

## Notes

Don't import across lazy features.

Implementation (2026-10-07):
- **Headline slot.** S3 shows one line under the name, "Design Lead at Terra Climate · Class of 2017", and S5's headline value reads like "Role at Company". So `headline()` now uses the alumnus's own `headline` in place of "Job title at Company", keeping " · Class of YYYY"; with no headline it is exactly today's line. Job title/company still show in Employment.
- **Education.** `educationLine` uses `degreeLine` when a degree or start year exists; the department stands in for a missing degree ("Design · 2013–2017"). With a degree, the department is not shown (S3 shows only "B.Sc. Product Design · 2013–2017"). Same start and graduation year shows one year.
- **Badge (deviation, needs a call).** S3 draws a green pill (#e9efe5 fill, #4f6947 text, round). `Tag` has no such tone and the tokens have no success-soft colour. Per instructions Tag was not changed: the badge is `Tag tone="success"` (neutral fill, green dot, ink-secondary text, radius-sm), which is the design system's "status" form (Tag README: "Available" uses it). TASK-009 should list it as a difference or the user approves a new Tag tone + tokens in a follow-up.
- **Header layout.** Desktop: badge beside the h1 in `.nameRow` (gap 10px), then the line, then a row with location (pin icon, ink-muted, aria-hidden) and LinkedIn (gap 16px). Phone: `.nameRow` is `display: contents` and `order` puts the badge under the line and the links row last, matching S3 phone; icons hidden on phone. Location carries a visually hidden "Location:" prefix.
- **Mentor tag.** Accent `Tag` in its own block at the end of the card (S2 desktop). S2 phone draws no tag; it shows at every width (AC12 does not split by width).
- Full `npm test`: 1 failure in `features/me/ProfileForm.test.tsx` (section order), which is TASK-006's work in progress, not this task. profile + directory: 21 files, 254 tests pass.

## Related

- Architecture: [[specs/2026-10/m/REQ-011-profile-headline-location-mentorship/architecture]]
- Lessons checked: see architecture.md
