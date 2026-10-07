---
kind: task
---
# Fix the BaseDTO casing typecheck error; show Start year at every width

| Field | Value |
|---|---|
| REQ | REQ-013 |
| Kind | task |
| Created | 2026-10-07 |
| Primary repo | alumni-system |
| Related | [[REQ-011]] (CORR-001: Start year hidden below 48rem; follow-up decided by the user) · [[knowledge/gotchas#^g22\|G22]] · [[knowledge/gotchas#^g32\|G32]] · [[knowledge/lessons/LESSON-REQ-011-2-css-hidden-fields\|L-REQ-011-2]] · [[knowledge/lessons/LESSON-REQ-012-2-record-design-deviations\|L-REQ-012-2]] |

## Goal

(1) `npm run typecheck:backend` passes on every checkout, with no TS1261 casing error. (2) My Profile shows the Start year input at every screen width, including phones and zoomed desktops, so no editable field is ever hidden.

## Acceptance criteria

- [ ] AC1. `npm run typecheck:backend` (root) exits 0: no TS1261 about `baseDTO.ts` / `BaseDTO.ts`. The git-tracked file name, the on-disk name and all four imports agree on one casing, `BaseDTO.ts` (like the other DTO files).
- [ ] AC2. The Start year field is rendered and visible at every width (no `display: none` rule, no `.wideOnly`), in Education between Degree and Graduation year on phones, as before on desktop. Its value, validation, dirty state and save payload are unchanged.
- [ ] AC3. The hidden-field machinery that existed only for the phone-hidden Start year (`isHidden` / `getComputedStyle`, `HIDDEN_FIELD_HINT`, `YEAR_ORDER_HIDDEN_MESSAGE`, `withOrderHint`, the hidden-error fallback to the form alert) is removed; the year-order error is the plain backend message on Graduation year. Tests are updated (hidden-field tests replaced by a check that Start year is always shown) and all tests, typecheck, lint, format pass. Docs and gotchas that name the old behaviour are corrected.

## Scope / non-goals

- No change to the API, validation rules, the migration, or any other field. No new design tokens.
- Deliberate deviation from the S5 phone design (it has no Start year); recorded on the route-layout concept page.
- The 48rem layout of the other fields is unchanged.

## Approach

- **Casing:** `git mv` the tracked `dal/dto/baseDTO.ts` to `BaseDTO.ts` (two steps; the working tree on this machine is case-insensitive), change the four imports (`AlumniDTO`, `CommentDTO`, `PostDTO`, `UserDTO`) from `./baseDTO` to `./BaseDTO`, then run `npm run typecheck:backend` and the backend tests. Update G22 (title and text) and G32 (no longer fails; keep the dist-rebuild bullet).
- **Start year:** in `features/me/EducationSection.tsx` drop the `.wideOnly` wrapper; in `Section.module.css` drop the `.wideOnly` rule; in `ProfileForm.tsx` remove the hidden-field helpers listed in AC3 and use the plain error paths. Check `profileErrors.ts` and `validation.ts` for leftovers.
- **Tests:** `ProfileForm.test.tsx` — remove the hidden-field tests and their `hideStartYear` helper, add one that the year-order error shows on Graduation year with the backend message and that Start year is present; `MePage.test.tsx` if it references the hint.
- **Docs (L-REQ-010-5):** `CLAUDE.md`, `packages/frontend/README.md`, `features/me/README.md` (Start year "hidden below 48rem"), `concepts/route-layout.md` (deviation from S5 phone), gotchas G22/G32, `LESSON-REQ-011-2` gets a one-line "REQ-013 chose to show it" note at wrapup.
