# TASK-006 — My Profile fields and Mentorship card

| Field | Value |
|---|---|
| REQ | REQ-011 |
| Tier | 1 |
| Status | pending |
| Repo | alumni-system |
| Depends on | TASK-002, TASK-003 |
| Blocks | TASK-008, TASK-009 |

## Goal

Alumni can see, edit, validate and save the five fields on My Profile (AC8, AC9, AC10).

## Files to touch

| Path | Action |
|---|---|
| `packages/frontend/src/features/me/validation.ts` + test | edit |
| `features/me/fields.ts`, `ProfileForm.tsx`, `PersonalSection.tsx`, `EducationSection.tsx` | edit |
| `features/me/MentorshipSection.tsx` (+ css) | create |
| `features/me/ProfileForm.test.tsx`, `MePage.test.tsx`, `profileErrors.ts` + test | edit |
| `features/me/README.md` | edit |

## Approach

- `ProfileValues` gets headline, location, degree, start_year (strings) and `mentorship_available` (boolean, outside the string binder). Add to `FIELDS.alumni` only; `toValues`, `toUpdateInput` (boolean sent for alumni only), `isDirty`, `fieldError`; limits copied with the backend source named.
- Add "Headline", "Location", "Degree", "Start year" to `FIELD_PREFIXES` in `profileErrors.ts` (G38). A Start year error while it is CSS-hidden (narrow screen) must not strand the user: map it to Graduation year's message or the form-level message instead of focusing a hidden input.
- Order rule on the client: start > graduation → error on Graduation year. Map the server message (G38).
- PersonalSection: Headline, Location after Full name. EducationSection: Degree, Start year (CSS-hidden below 48rem; value kept), Graduation year as in S5. MentorshipSection with Switch.
- Test that a save refreshes profile and directory data with the real query keys (L-REQ-010-1).

## Acceptance

- [ ] Fields appear for alumni only; none for student/none
- [ ] Switch state counts as unsaved, is sent, survives a refetch
- [ ] Server 400 lands on the right field
- [ ] lint, typecheck, tests, format pass

## Notes

Follow S5 desktop and phone for order and grouping; screenshots happen in TASK-009.

## Related

- Architecture: [[specs/2026-10/m/REQ-011-profile-headline-location-mentorship/architecture]]
- Lessons checked: see architecture.md
