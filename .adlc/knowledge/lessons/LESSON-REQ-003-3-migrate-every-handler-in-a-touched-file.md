# When you change error handling in a controller, move every handler in that file to the shared helper ^L-REQ-003-3

| Field | Value |
|---|---|
| ID | LESSON-REQ-003-3 |
| Captured | 2026-10-06 |
| REQ | REQ-003 |
| Component | backend |
| Tags | backend, api, errors |
| Severity | guideline |

## The lesson

Map errors through one shared `sendError` (`AppError` → its status + `{ message }`, anything else → generic 500). When a REQ touches one handler's catch, convert the untouched siblings in the same file too. Half-migrated files mix `{ error }` and `{ message }`, leak raw pg text, and turn a DB outage into a 404.

## Saw it in

- `packages/backend/src/api/controllers/sendError.ts` — the helper, added in review round 2
- `UserController.ts` / `AlumniController.ts` — after round 1, auth-touched handlers used `{ message }` while their neighbours still sent `(error as Error).message` (CORR-002, QUAL-001)
- `MeController.ts` still has its own copy — the next REQ touching it should switch
