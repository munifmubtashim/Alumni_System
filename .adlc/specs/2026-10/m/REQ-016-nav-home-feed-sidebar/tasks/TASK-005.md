# TASK-005 — People feature: shared suggested-alumni component

| Field | Value |
|---|---|
| REQ | REQ-016 |
| Tier | 2 |
| Status | pending |
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

- [ ] Row shows avatar, name, role+company, Mentor badge only when true, link to /alumni/<id>
- [ ] Loading, empty, error+Retry states tested
- [ ] A failing request does not affect the parent

## Notes

Spec: requirement.md in this folder. Conventions: tokens only, no hex; TanStack Query for server data; layers route -> controller -> Manager -> Query. Rebuild `packages/backend/src/businessLogic` (`tsc`) before running the API (CLAUDE.md). Draft the commit message into commits-draft.md.

## Related

- Architecture: [[specs/2026-10/m/REQ-016-nav-home-feed-sidebar/architecture]]
- Lessons checked: [[LESSON-REQ-008-6-copying-between-lazy-features-needs-a-home]], [[LESSON-REQ-010-5-nav-and-menu-changes-touch-every-readme-list]], [[LESSON-REQ-009-1-profile-links-need-the-alumni-id]]
