# TASK-003 — Remove lookup and login/logout-time routes; no password in user responses

| Field | Value |
|---|---|
| REQ | REQ-003 |
| Tier | 1 |
| Status | done |
| Repo | alumni-system |
| Depends on | TASK-001 |
| Blocks | TASK-004, TASK-005 |

## Goal

The four removed routes and their dead methods are gone. No user query used by a route returns the password column. `POST /api/alumni` takes the user from the token.

## Files to touch

| Path | Action |
|---|---|
| `packages/backend/src/api/routes/UserRoutes.ts` | edit — delete `/email/:email`, `/:id/login`, `/:id/logout` lines + imports |
| `packages/backend/src/api/routes/AlumniRoutes.ts` | edit — delete `/email/:email` line + import |
| `packages/backend/src/api/controllers/UserController.ts` | edit — delete `findUserByEmail`, `updateLoginTime`, `updateLogoutTime` handlers (keep `login`, which uses the manager's `findUserByEmail`) |
| `packages/backend/src/api/controllers/AlumniController.ts` | edit — delete `findAlumniByEmail`; `createAlumni` uses `Number(req.user.sub)`, ignores `body.user_id` |
| `packages/backend/src/businessLogic/src/UserManager.ts` | edit — delete `updateLoginTime`, `updateLogoutTime` |
| `packages/backend/src/businessLogic/src/AlumniManager.ts` | edit — delete `findAlumniByEmail` |
| `packages/backend/src/dal/query/UserQuery.ts` | edit — `createUser` `RETURNING ${PUBLIC_USER_COLUMNS}`; `findUserById`, `getAllUsers` `SELECT ${PUBLIC_USER_COLUMNS}`; delete `updateLoginTime`, `updateLogoutTime`; fix return types (`PublicUserRow`) |
| `packages/backend/src/dal/query/AlumniQuery.ts` | edit — delete `findAlumniByEmail` |
| `packages/backend/src/dal/query/UserQuery.test.ts` | create |
| `packages/backend/src/businessLogic/src/UserManager.test.ts` | create — `createUser` validation |
| `packages/backend/src/businessLogic/src/AlumniManager.test.ts` | create — `createAlumni` uses the given user id, 409 when a profile exists, 400 on invalid fields |

## Approach

- Before deleting each method, `grep -rn` its name across `packages/` (excluding `node_modules`, `dist`) and `TestManager.ts`. If anything besides the removed route uses it, keep it and say so. `TestManager.ts` is scratch code: if it references a deleted method, delete those commented lines too.
- `PUBLIC_USER_COLUMNS` is `private static`; reuse it inside the class.
- `createUser` validation (AC8b): move it into `UserManager.createUser(body, ...)` (or a `validateNewUser(body)` next to `validateRegistration`). Use `requiredText(name, "Name", 100)`, `requiredEmail`, `validateNewPassword`, and role ∈ `admin | alumni | student`, else `AppError(400)`. The controller hashes after validation and maps `AppError` like `updateUser` does. Duplicate email → 409 if the query surfaces a unique violation (mirror `register`).
- `createAlumni` (AC6): `AlumniManager.createAlumni(userId, body)` checks for an existing alumni row for `userId` (add `AlumniQuery.findAlumniByUserId` if none exists) → `AppError(409, "You already have an alumni profile")`; then `validateAlumniFields(body)` and insert. Map `AppError` in the controller. The role restriction is route wiring, done in TASK-004.
- `UserManager.createUser` / `findUserById` / `getAllUsers` return types follow the query's.
- `UserQuery.test.ts`: the global setup mocks the pool. For `createUser`, `findUserById` and `getAllUsers`, assert the select/returning list is exactly `id, name, email, role, photo_url, university, created_at` (for `createUser`, `password` appears only in the INSERT column list). Also assert `findUserByEmail` still selects the password, since login depends on it.

## Acceptance

- [ ] `grep -rn "updateLoginTime\|updateLogoutTime\|findAlumniByEmail" packages --include=*.ts` finds nothing outside `node_modules`/`dist`
- [ ] `UserQuery.test.ts` passes
- [ ] `tsc` in `businessLogic` succeeds, then `npx tsc --noEmit -p packages/backend/src/api` succeeds
- [ ] Login still works: `login()` still gets the hash from `findUserByEmail` (covered by a route test in TASK-004)

## Notes

- Don't add `authMiddleware` here; TASK-004 owns all auth wiring in the route files.
- **Done 2026-10-05.** `npm test` in packages/backend: 6 files, 45 tests pass. `tsc` in businessLogic, `tsc --noEmit -p` api and dal all clean (TASK-002's files included). Acceptance grep finds nothing outside dist/node_modules.
- Removal checks: only the deleted routes used `updateLoginTime`, `updateLogoutTime`, `findAlumniByEmail`; `TestManager.ts` had three commented calls, deleted. `findUserByEmail` manager/query kept for `login()`; only its controller and route went.
- `createUser`: new `UserManager.validateNewUser(body)` (role `admin|alumni|student`, name ≤100, `requiredEmail`, `validateNewPassword`) and `createUser(input, passwordHash)`, which maps 23505 to 409 like `register`. `UserQuery.createUser` now takes `Pick<UserDTO, name|email|password|role>` so callers needn't build a full `UserDTO` (its constructor needs a photo_url the query never inserted). The controller no longer imports `UserDTO`. The old handler also accepted `photo_url` but never stored it; no behavior lost.
- `createAlumni`: added `AlumniQuery.findAlumniByUserId` (none existed). `AlumniManager.createAlumni(userId, body)`: 409 if a row exists, then `validateAlumniFields`, then insert; also maps 23505 to 409, because `alumni.user_id` is UNIQUE (seen in `db/backups`, alumni_profile_user_id_key) and two concurrent creates would otherwise 500. Errors map like `updateAlumni` (`{ message }`; non-AppError → 500 instead of the old 400).
- Interim state until TASK-004: `POST /api/alumni` and `POST /api/users` have no `authMiddleware` yet, so `createAlumni` reads `req.user.sub` on an undefined `req.user` and returns 500, and `POST /api/users` is still open to guests (now validated). TASK-004's `router.use(authMiddleware)` and `requireRole` close both. Do not ship TASK-003 without TASK-004.
- Small extras inside named files: removed the `console.log(user)` loop in `UserQuery.getAllUsers` (it logged password hashes); `findUserById` return type is now `PublicUserRow | undefined` (the old type hid the undefined case).
- Follow-up (not done, file not named): businessLogic `tsconfig.json` includes `src/**/*`, so `tsc` writes `*.test.js` into `dist/` (git-ignored). Exclude `**/*.test.ts` there. CAND-007.

## Related

- Architecture: [[specs/2026-10/m/REQ-003-backend-route-auth/architecture]]
