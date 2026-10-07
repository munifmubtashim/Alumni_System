# TASK-007 — Compare with S5 designs and fix differences

| Field | Value |
|---|---|
| REQ | REQ-010 |
| Tier | 3 |
| Status | partial (see ui-evidence/s5-differences.md, Open) |
| Repo | alumni-system |
| Depends on | TASK-005, TASK-006 |
| Blocks | none |

## Goal

The built page has been screenshotted next to every S5 design at desktop and phone widths in light and dark (plus unsaved and toast states), every difference is listed, and each is fixed or recorded as expected.

## Files to touch

| Path | Action |
|---|---|
| `packages/frontend/src/features/me/**`, `components/ui/{Textarea,Toast}/**` | edit as needed |
| `.adlc/specs/2026-10/m/REQ-010-my-profile-page/ui-evidence/` | create (screenshots, `s5-differences.md`) |

## Approach

- Start the API and Vite (root `npm run dev`), sign in with a seeded alumni account, drive a real browser at 1440 and 390 px, light and dark, with unsaved changes (bar showing) and just after saving (toast). Open the matching S5 file (`S5-Desktop-Light`, `-Dark`, `-Phone-Light`, `-Phone-Dark`, `S5-UnsavedToast`) alongside and take paired screenshots.
- Also check 360 px width, 200% zoom and the system theme (spec criteria), and that the save bar clears the phone tab bar.
- Write `s5-differences.md`: one row per difference (layout, spacing, type size, colour pair, radius, copy, states, element missing) with: fix applied / expected (cause: token mapping, API gap, brand rename Alma, older accent) / open. Fix everything that is not expected, re-shoot, and re-list.
- Never copy hex from the design files; map to tokens.

## Acceptance

- [ ] Paired screenshots for all five S5 files plus unsaved-changes bar and toast
- [ ] `s5-differences.md` lists every difference, each with a disposition
- [ ] No non-expected difference left open
- [ ] Contrast of toast and bar pairs verified in both themes

## Notes

Expected differences already known: no headline, location, degree, start year, mentorship toggle, change photo (API gaps); Alma branding vs 'Alumni Network'; token colours vs older accent hex; no soft shadows; added About, Department, Experience fields. Admin nav entry absent (page does not exist).

## Related

- Architecture: [[specs/2026-10/m/REQ-010-my-profile-page/architecture]]
- Lessons checked: [[LESSON-REQ-006-3-client-copies-of-api-limits]], [[LESSON-REQ-002-3-must-succeed-steps-inside-mutationfn]], [[LESSON-REQ-009-4-adding-a-lazy-feature-touches-six-lists]], [[LESSON-REQ-007-1-sticky-bottom-bar-needs-scroll-padding]], [[LESSON-REQ-004-2-check-design-colours-against-token-pairs]]
