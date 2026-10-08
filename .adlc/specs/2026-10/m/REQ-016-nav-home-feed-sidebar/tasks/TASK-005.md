# TASK-005 — People feature: shared suggested-alumni component

| Field | Value |
|---|---|
| REQ | REQ-016 |
| Tier | 2 |
| Status | done |
| Repo | alumni-system |
| Depends on | 002 |
| Blocks | 006, 007 |

## Goal

One eager `features/people` folder provides `PersonRow`, `SuggestedAlumni` and `useSuggestedAlumni`, used by Home and Feed.

## Files to touch (paths under `packages/` unless noted)

- frontend/src/services/alumniApi.ts (+ test): `getSuggestedAlumni()`
- frontend/src/config/queryKeys.ts: comment only (suggestions sit under `ALUMNI_QUERY_ROOT`)
- frontend/src/features/people/{PersonRow,SuggestedAlumni,useSuggestedAlumni}.ts(x) + css + tests
- frontend/src/features/people/README.md
- eslint.config.js: confirm `people` needs no lazy ban (it is not lazy); add an import-boundary test only if the repo pattern requires one

## Approach

- `PersonRow`: Avatar, name, "job title, company" (missing part left out), Mentor `Tag`, whole row is a Link to `profilePath(id)`; no directory router state.
- `SuggestedAlumni`: title "Suggested alumni"; skeleton rows; empty -> short note; error -> `Alert` with Retry; never throws into the parent. Props let the parent set the heading level.
- Query: key `[ALUMNI_QUERY_ROOT, 'suggestions']` (so admin deletes refresh it; ADV-004), staleTime moderate, `retry` as other queries.

## Acceptance

- [x] Row shows avatar, name, role+company, Mentor badge only when true, link to /alumni/<id>
- [x] Loading, empty, error+Retry states tested
- [x] A failing request does not affect the parent

## Notes

Spec: requirement.md in this folder. Conventions: tokens only, no hex; TanStack Query for server data; layers route -> controller -> Manager -> Query. Rebuild `packages/backend/src/businessLogic` (`tsc`) before running the API (CLAUDE.md). Draft the commit message into commits-draft.md.

Implemented 2026-10-08:
- Added `features/people/index.ts` (not in the file list) as the import surface, like `features/home/index.ts`; Home and Feed import `@/features/people`.
- Heading level prop: `headingLevel` 2 | 3 | 4 (default 2). `className` prop for placement.
- The card is a `Card as="section"` labelled by its heading, so tests find it as region "Suggested alumni".
- staleTime 5 min (`useSuggestedAlumni.ts`); retry left to the client default. Exported `SUGGESTED_ALUMNI_KEY` for callers that need to invalidate.
- No eslint change and no new boundary test: `people` is not lazy, and the existing lazy ban already applies to every file in it.
- No design screen exists for the row or card; styles follow the directory card (S2) and Recent posts' error layout.
- Not done here (TASK-008): add `people/` to `src/features/README.md` and the CLAUDE.md feature list.

## Related

- Architecture: [[specs/2026-10/m/REQ-016-nav-home-feed-sidebar/architecture]]
- Lessons checked: [[LESSON-REQ-008-6-copying-between-lazy-features-needs-a-home]], [[LESSON-REQ-010-5-nav-and-menu-changes-touch-every-readme-list]], [[LESSON-REQ-009-1-profile-links-need-the-alumni-id]]
