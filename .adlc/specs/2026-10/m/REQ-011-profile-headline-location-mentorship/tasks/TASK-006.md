# TASK-006 — My Profile fields and Mentorship card

| Field | Value |
|---|---|
| REQ | REQ-011 |
| Tier | 1 |
| Status | done |
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

- [x] Fields appear for alumni only; none for student/none
- [x] Switch state counts as unsaved, is sent, survives a refetch
- [x] Server 400 lands on the right field
- [x] lint, typecheck, tests, format pass

## Notes

Follow S5 desktop and phone for order and grouping; screenshots happen in TASK-009.

**Implementation (2026-10-07):**
- Types: `ProfileTextValues` (all string fields; `ProfileField`/`MeField` key on it) and `ProfileValues extends` it with `mentorship_available: boolean`, so the binder, errors and checks stay string-only. `hasMentorship(kind)` is alumni only.
- Layout (S5 desktop): Personal = [Full name, Headline] row, Location, About. Education (alumni) = [University, Degree] row, Department (not in S5, kept full width), [Start year, Graduation year] row. Students keep the old Education layout. Mentorship card sits between Career and Password. `FIELDS.alumni` follows that order so "first invalid field" focus matches the page.
- Start year sits in a `.wideOnly` wrapper (`display: none` only inside `@media (width < 48rem)`, so no `display` is set otherwise, G18). ProfileForm checks `getComputedStyle` up the ancestors; a hidden field's client or server error becomes the form alert `"<message>. Open My Profile on a wider screen to change it."`, focused.
- Order rule: `YEAR_ORDER_MESSAGE` = the backend's text, on graduation_year, only when both years pass their own checks. Leaving Start year shows it; editing Start year clears it.
- Deviations: no `MentorshipSection.module.css` (the shared `Section.module.css` card and the Switch's own CSS were enough). Help text differs from S5 ("...and a Mentor tag on your directory card" instead of "appear in mentor search", which does not exist). Location/Headline use `autoComplete="off"` (free text).
- Tests: frontend `npm test` 1287 passed (87 files), typecheck, lint (ESLint + Stylelint), format:check all clean.

## Related

- Architecture: [[specs/2026-10/m/REQ-011-profile-headline-location-mentorship/architecture]]
- Lessons checked: see architecture.md
