# TASK-004 — Backend DTOs, validation and managers

| Field | Value |
|---|---|
| REQ | REQ-011 |
| Tier | 1 |
| Status | pending |
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

- [ ] AC3, AC4, AC5 cases tested incl. NUL, trim, empty→cleared
- [ ] Student body with junk headline/mentorship/start_year → no 400, keys absent from result (test)
- [ ] non-owner and admin → 403, query not called (test)
- [ ] `npm run test:backend` and `typecheck:backend` pass

## Notes

Query classes are TASK-005; use the mocked query in manager tests.

## Related

- Architecture: [[specs/2026-10/m/REQ-011-profile-headline-location-mentorship/architecture]]
- Lessons checked: see architecture.md
