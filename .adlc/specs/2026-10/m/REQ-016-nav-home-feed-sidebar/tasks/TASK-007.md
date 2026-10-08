# TASK-007 — Home rewrite and copy fix

| Field | Value |
|---|---|
| REQ | REQ-016 |
| Tier | 3 |
| Status | done |
| Repo | alumni-system |
| Depends on | 001, 003, 005 |
| Blocks | 008 |

## Goal

Home shows greeting, completeness card (if incomplete), latest posts, mentors and suggested alumni, each with loading/empty/error states; the quick-link cards are gone.

## Files to touch (paths under `packages/` unless noted)

- frontend/src/features/home/{HomePage,HomePage.module.css,HomePage.test.tsx}
- frontend/src/features/home/{ProfileCompleteness,LatestPosts,MentorsAvailable}.tsx + css + tests
- frontend/src/features/home/profileCompleteness.ts (+ test): pure function
- frontend/src/features/home/README.md (create if absent)
- copy: grep -rn 'department or field' in packages/, root docs and .adlc/context (leave docs/design/*.dc.html alone) -> 'year, department or university'

## Approach

- Completeness (A2) per account type — alumni: photo, headline, job title, company, department, graduation year, bio; student: photo, job title, company, department, expected graduation year, bio (no headline); card hidden when complete or when the account has neither alumni nor student row; one next step = first missing field, linking to `ME_PATH`; `<progress>`-style bar with `role=progressbar` and value.
- Latest posts: `listPosts({limit:3})`, key `[FEED_QUERY_ROOT,'latest']` with `refetchOnMount: 'always'`; compact preview (Avatar, name linked via profilePath when author_alumni_id set, relativeTime, caption clamped); "See all" -> `FEED_PATH`. Do not import from `@/features/feed`.
- Mentors: `searchAlumni({mentorship:true,page:1,pageSize:5})`, drop own `alumni_id`, show up to 4 `PersonRow`; "Browse directory" -> `DIRECTORY_PATH`.
- Suggested alumni: `SuggestedAlumni` from people.
- Each section its own component/query; one failing never hides the others. No stats.

## Acceptance

- [x] Each section: loading, empty, error+Retry, data tests; sections fail independently
- [x] Completeness tested: 0 fields, partial, complete, a student (never asked for a headline; can reach 100%), no profile row (no card)
- [x] No 'department or field' left anywhere; no quick-link cards
- [x] lazyRoutes.test and lint boundaries pass

## Notes

Spec: requirement.md in this folder. Conventions: tokens only, no hex; TanStack Query for server data; layers route -> controller -> Manager -> Query. Rebuild `packages/backend/src/businessLogic` (`tsc`) before running the API (CLAUDE.md). Draft the commit message into commits-draft.md.

Implemented 2026-10-08:
- **Open decision (photo):** A2 counts the photo, but Account settings has no photo control (no upload API, REQ-010). A user who fills everything else is stuck at 86% (alumni) / 83% (students) with "Add a profile photo" linking to `/me`, where nothing lets them add one. Built as the spec says; options for the gate: (1) keep as is, (2) drop photo from the counted fields, (3) count it but never pick it as the next step and hide the card when only the photo is missing.
- Renamed the card file to `ProfileCompletenessCard.tsx` (+ css, test): `ProfileCompleteness.tsx` beside `profileCompleteness.ts` resolve to one file on macOS (CAND-008).
- Added `HomeSection.tsx` (section card, loading status, error+Retry, empty note) and `homeTestKit.tsx` (test-only fake API routed by URL) inside `features/home`; neither was in the file list.
- Mentors key `['alumni','mentors']` (under the alumni root, so admin writes refresh it). Latest posts key `['feed','latest']`, `refetchOnMount: 'always'`; the query-key tuples stay private (react-refresh rule, CAND-009).
- Layout: phone one column (completeness, posts, mentors, suggestions); from 48rem posts beside a 20rem side column, same grid as the Feed. `--page-max` rule kept on `.home`.
- Post preview: caption clamped to 3 lines, author link only with `author_alumni_id`, "Unknown member" without a joined name, null caption shows nothing (BUG-001).
- Copy: "department or field" existed only in the old Home card and its test; both are gone, so no "year, department or university" sentence remains.
- Docs: root CLAUDE.md Home and Account settings bullets, `app/README.md`, `packages/frontend/README.md` (Feed and Account settings entry points), `features/README.md` home line, new `features/home/README.md`.
- Not done (TASK-008): `people/` in `features/README.md` and the CLAUDE.md feature list; screenshots.
- Checks: frontend typecheck, lint, format:check, tokens:check, `npm test` (112 files, 1626 tests) and build all pass.

## Related

- Architecture: [[specs/2026-10/m/REQ-016-nav-home-feed-sidebar/architecture]]
- Lessons checked: [[LESSON-REQ-008-6-copying-between-lazy-features-needs-a-home]], [[LESSON-REQ-010-5-nav-and-menu-changes-touch-every-readme-list]], [[LESSON-REQ-009-1-profile-links-need-the-alumni-id]]
