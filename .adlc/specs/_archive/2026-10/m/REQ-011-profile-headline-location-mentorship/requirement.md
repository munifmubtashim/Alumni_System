# Alumni profile: headline, location, degree, start year, mentorship

| Field | Value |
|---|---|
| REQ | REQ-011 |
| Status | validated |
| Phase | spec |
| Created | 2026-10-07 |
| Primary repo | alumni-system |
| Touched repos | alumni-system |
| Related | [[REQ-003]] (owner-only rules) · [[REQ-005]] (directory list) · [[REQ-008]] (public profile) · [[REQ-010]] (My Profile, "Not built" list) · [[knowledge/lessons/LESSON-REQ-005-2-mocked-sql-tests-need-one-real-run\|L-REQ-005-2]] · [[knowledge/lessons/LESSON-REQ-006-3-client-copies-of-api-limits\|L-REQ-006-3]] · [[knowledge/lessons/LESSON-REQ-010-5-nav-and-menu-changes-touch-every-readme-list\|L-REQ-010-5]] |

## Problem

The S2 (directory), S3 (public profile) and S5 (My Profile) designs show a headline, a location, a degree, a start year and a mentorship toggle with badge. The API has no column for any of them, so REQ-010 left them out (CLAUDE.md, "Not built"). Alumni cannot say what they do in one line, where they are, what they studied or that they offer mentorship, and nobody browsing the directory or a profile can see it. The screens as built differ from the designs in exactly these places.

## Goal

An alumni user can enter a headline, a location, a degree, a start year and a mentorship switch on My Profile, and save them. Anyone signed in sees the headline, location, degree with years and an "Available for mentorship" badge on that alumnus's public profile, and a "Mentor" tag on their directory card. Only the owner can change these values. Photo upload is not part of this. The changed pages match the S2, S3 and S5 designs at desktop and phone width in light and dark.

## Non-goals

- Photo upload / "Change photo" (stays unbuilt).
- Filtering or searching the directory by mentorship (S5's "appear in mentor search"). The tag shows; a mentor filter is a separate REQ.
- The S2 "Available" tag (a different state from "Mentor") and S3's employment history list. No data for either.
- The same fields for students or users without an alumni profile (see assumptions).
- Backfilling existing rows with guessed values.

## Acceptance criteria

Fields: `headline`, `location`, `degree` (text), `start_year` (4-digit year), `mentorship_available` (boolean, default false).

**Database**
- [ ] AC1. One new file in `db/migrations/` adds the five columns to `alumni`. `headline`, `location`, `degree`, `start_year` are nullable; `mentorship_available` is `NOT NULL DEFAULT false`. Running it twice in a row on a database that already has the columns succeeds without error and changes nothing. Existing rows keep their data and get `mentorship_available = false`.

**API and validation**
- [ ] AC2. `GET /api/alumni/:id`, the `GET /api/alumni` items, and `GET /api/me` (for a user with an alumni row) return all five fields. `mentorship_available` is always a boolean.
- [ ] AC3. `PUT /api/alumni/:id`, `POST /api/alumni` and `PUT /api/me` (alumni user with a profile) accept the five fields. Text fields are trimmed; empty means cleared (null). Limits: headline at most 120 characters, location at most 100, degree at most 100. Over a limit, non-text, or a NUL character → 400 `{ message }` naming the field.
- [ ] AC4. `start_year` follows the existing year rule (4 digits, 1900 to this year + 10, else 400). When both `start_year` and `graduation_year` are set and start is after graduation → 400.
- [ ] AC5. `mentorship_available` must be `true` or `false`; anything else (string, number, null) → 400. When omitted it is treated as `false`, like every other field in a full-replace save.
- [ ] AC6. Owner-only per REQ-003: only the profile's owner can change the five fields; another signed-in user, an admin and a guest get 403 / 403 / 401 and the row is unchanged. `user_id` in a body is still ignored.
- [ ] AC7. The shared types (`Alumni`, `AlumniListItem`, `MyProfile`, `UpdateMyProfileInput`) carry the five fields.

**My Profile (S5)**
- [ ] AC8. For an alumni user with a profile, My Profile shows Headline and Location in Personal, Degree and Start year in Education, and a Mentorship card with a labelled switch "Available for mentorship" and its help text, in the places and order S5 shows. A phone has no Start year field (S5 phone omits it); the field still exists on desktop only, as designed. *(See open question 2.)*
- [ ] AC9. The fields load with the saved values, validate with the same limits as the API (messages shown when a field is left or Save is tried), count toward "Unsaved changes", and are sent by Save. After a save, the public profile and the directory show the new values without a manual reload.
- [ ] AC10. The switch is operable by keyboard and announces its state to a screen reader.

**Public profile (S3) and directory (S2)**
- [ ] AC11. The public profile shows the headline under the name, the location beside it, the "Available for mentorship" badge when true, and degree with years ("B.Sc. Product Design · 2013–2017") in Education. Each hides when empty; a profile with none of the new values looks as it does today.
- [ ] AC12. A directory card shows a "Mentor" tag when `mentorship_available` is true and none otherwise.

**Tests and design check**
- [ ] AC13. Backend tests cover AC2–AC6 (validation limits, year order, boolean rule, owner-only 403/401, responses). One real-database run proves the migration twice (AC1).
- [ ] AC14. Frontend tests cover AC8–AC12 (form fields, validation, dirty state, save payload, badge and tag present/absent, empty hiding).
- [ ] AC15. Screenshots of My Profile, a public profile and the directory sit next to their designs (S5, S3, S2) at desktop and phone width in light and dark, saved under this REQ's `ui-evidence/`. Differences are fixed or written down with a reason.

## Assumptions

- The five fields live on `alumni` only, as asked. Students (own `students` table) and users with no profile row do not see them on My Profile and have no values. — `STATUS: decided at the spec gate, 2026-10-07
- "Current role" and "Company" in S5 are the existing `job_title` and `current_company`; no new column.
- Headline is free text the user writes; it is not built from job title and company.
- A year range such as "2013–2017" is rendered from `start_year` and `graduation_year`; with only one of them it shows that one alone.
- Location is free text, not a structured place.
- Existing clients that send no `mentorship_available` on a full replace reset it to false. The only client is our frontend, which always sends it.

## Open questions

- [x] 1. (Decided: alumni only) Students: S5 draws these fields for every user. Alumni only (as asked, no change to `students`), or also add them to `students` so students get them too?
- [x] 2. (Decided: desktop only, as S5) Start year on phone: S5 phone omits it, desktop has it. Match the design (desktop only), or show it at both widths?

## Out of scope (for now)

Mentor filter in directory search · photo upload · employment history · the S2 "Available" tag · structured locations.

## Related

- Concepts: _(none yet)_
- Components: `features/me`, `features/profile`, `features/directory`
- Lessons: [[knowledge/lessons/LESSON-REQ-005-2-mocked-sql-tests-need-one-real-run]] (run the migration for real) · [[knowledge/lessons/LESSON-REQ-006-3-client-copies-of-api-limits]] (limits copied to the client) · [[knowledge/lessons/LESSON-REQ-010-5-nav-and-menu-changes-touch-every-readme-list]] (update every README list)
- ADRs: [[architecture/adr-04-forms-without-a-library]] · [[architecture/adr-09-optimistic-updates-by-cache-edit]]

## Backlinks

_(populated by /wrapup or manually)_
