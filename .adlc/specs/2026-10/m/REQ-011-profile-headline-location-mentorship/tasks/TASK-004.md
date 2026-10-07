# TASK-004 — Backend DTOs, validation and managers

| Field | Value |
|---|---|
| REQ | REQ-011 |
| Tier | 1 |
| Status | done |
| Repo | alumni-system |
| Depends on | TASK-002 |
| Blocks | TASK-005 |

## Goal

Alumni writes accept and validate the five fields; owner-only holds (AC3, AC4, AC5, AC6).

## Files to touch

| Path | Action |
|---|---|
| `packages/backend/src/dal/dto/AlumniDTO.ts`, `RegisterDTO.ts` | edit |
| `packages/backend/src/businessLogic/src/validation.ts` + `validation.test.ts` | edit |
| `packages/backend/src/businessLogic/src/AlumniManager.ts` + test | edit |
| `packages/backend/src/businessLogic/src/UserManager.ts` + test | edit if needed |

## Approach

- Add `HEADLINE_MAX=120`, `LOCATION_MAX=100`, `DEGREE_MAX=100` and an `optionalBoolean` helper (omitted → false; non-boolean → 400 message starting with the field name).
- `validateAlumniFields` returns the five; order rule: both years set and start > graduation → AppError(400, "Graduation year can't be before the start year").
- Split `validateAlumniFields` into a shared-details helper and the alumni-only part; `validateStudentFields` uses only the shared helper (a student body with junk new fields must still succeed and never carry them). `createAlumni` passes validated fields (start_year via Number()).
- Rebuild businessLogic dist (`tsc` in that package) before typechecking other packages (G32).

## Acceptance

- [x] AC3, AC4, AC5 cases tested incl. NUL, trim, empty→cleared
- [x] Student body with junk headline/mentorship/start_year → no 400, keys absent from result (test)
- [x] non-owner and admin → 403, query not called (test)
- [x] `npm run test:backend` and `typecheck:backend` pass

## Notes

Query classes are TASK-005; use the mocked query in manager tests.

Done 2026-10-07. `validateAlumniFields` now = department + graduation year + `validateSharedDetails` (company, job title, experience, bio, LinkedIn) + headline/location/degree/start_year/mentorship_available; `validateStudentFields` uses only `validateSharedDetails`, so a student body's alumni-only keys (including `graduation_year`) are never validated or returned. Boolean error message: "Mentorship availability must be true or false" (no FIELD_PREFIXES match, so the form shows it at form level; the client always sends a boolean). Order error: "Graduation year can't be before the start year"; same year is allowed.

`AlumniEditableFields.mentorship_available` is a required `boolean` (only the validator builds this type). `MyProfileRow` also gained the five fields (optional) for TASK-005's `MY_PROFILE_SQL`. `createAlumni` builds `Object.assign(new AlumniDTO(userId), { ...validated, years as Number })` so `AlumniQuery.createAlumni(alumni: AlumniDTO)` keeps its signature; TASK-005 only adds the five columns to the INSERT (they are on the DTO now). Registration unchanged: inserts rely on column defaults.

Tests 427/427 (was 369). businessLogic `dist` rebuilt with `tsc`. `typecheck:backend` still fails only on the known TS1261 (G22/G32). Per-package `tsc --noEmit --forceConsistentCasingInFileNames false` on api, businessLogic, dal: 0 errors; scratch tsconfig extending `tsconfig.test.json` (casing check off, `typeRoots` pointed at root `node_modules/@types` because the scratch path is outside the repo): 0 errors, 13 test files included.

## Related

- Architecture: [[specs/2026-10/m/REQ-011-profile-headline-location-mentorship/architecture]]
- Lessons checked: see architecture.md
