# TASK-002 — Backend: /api/admin namespace (stats, create, edit, delete)

| Field | Value |
|---|---|
| REQ | REQ-015 |
| Tier | 0 |
| Status | done |
| Repo | alumni-system |
| Depends on | — |
| Blocks | TASK-004 |

## Goal

An admin-only router at /api/admin serves GET /stats, POST /alumni, PUT /alumni/:id and DELETE /alumni/:id per architecture.md, with Manager rules, transactional SQL and tests at all three levels.

## Files to touch

| Path | Action |
|---|---|
| `packages/backend/src/api/routes/AdminRoutes.ts` | create |
| `packages/backend/src/api/controllers/AdminController.ts` | create |
| `packages/backend/src/api/app.ts` | edit (mount /api/admin) |
| `packages/backend/src/api/routes/AdminRoutes.test.ts` | create |
| `packages/backend/src/api/routes/routeGuard.test.ts` | edit only if a route count/known list needs it |
| `packages/backend/src/businessLogic/src/AdminManager.ts` | create |
| `packages/backend/src/businessLogic/src/AdminManager.test.ts` | create |
| `packages/backend/src/businessLogic/src/UserManager.ts` | edit (export BCRYPT_ROUNDS only) |
| `packages/backend/src/businessLogic/src/validation.ts` | edit (admin alumni field validator) |
| `packages/backend/src/businessLogic/src/index.ts` | edit |
| `packages/backend/src/dal/query/AdminQuery.ts` | create |
| `packages/backend/src/dal/query/AdminQuery.test.ts` | create |
| `packages/backend/src/dal/index.ts` | edit |
| `packages/backend/src/dal/query/UserQuery.test.ts` | edit (pin createAlumniUser BEGIN → users insert → alumni insert → COMMIT; ROLLBACK + release on error) (ADV-001) |
| `packages/backend/src/dal/query/AlumniQuery.ts` | edit only if a find-by-user-id helper is missing (ADV-002) |
| `packages/shared/src/types/admin.types.ts` | create |
| `packages/shared/src/index.ts` | edit |

## Approach

- Router: `router.use(authMiddleware, requireRole("admin"))` first, then the four routes; controllers are exported functions using the shared `sendError`, delete passes `req.user.sub`.
- AdminManager: getStats; createAlumni (validate name/email/temporary password/university/graduation_year/department/job_title/current_company, bcrypt hash, `UserQuery.createAlumniUser`, 23505 → 409 "An account with this email already exists", 201 with the list row — `createAlumniUser` returns the user, so look up the alumni row by user id (existing `findByUserId`-style query) and then `findAlumniById` for the list shape; ADV-002); updateAlumni (requireId, 404, partial update of users.name/university + alumni department/graduation_year/job_title/current_company, ignore email/role/password/user_id); deleteAlumni (requireId, 404, self → 403 "You can't delete your own account", 23503 → 409, nothing deleted → 404).
- AdminQuery: `countStats` (one query, four counts: alumni, students, posts, alumni with mentorship_available = true); `updateAlumniAccount` (transaction); `deleteAlumniAccount(userId)` exactly as the SQL sketch in architecture.md: BEGIN → affected other-user post ids → DELETE FROM users → recount comment_count for those ids (skip when none) → COMMIT; ROLLBACK and release in finally; returns whether a user was deleted. Rebuild businessLogic dist at the end (G32).

## Acceptance

- [x] Each route: 401 without token, 403 for alumni and for student tokens, success status for admin
- [x] Manager tests cover every rule listed in Approach
- [x] Query tests pin statement order, rollback/release, recount skip, and that edit never writes email/password/role or REQ-011 columns
- [x] A Query test pins the create transaction order (BEGIN → users → alumni → COMMIT) and ROLLBACK + release on failure (ADV-001)
- [x] The 201 body is the list row with `id` = alumni id and `name` (ADV-002)
- [x] routeGuard.test.ts green
- [x] Manual check against the dev DB (L-REQ-005-2): create, edit and delete a seeded alumnus with posts and comments; other posts' comment_count correct afterwards; result noted in this task file

## Notes

Live dev DB verified 2026-10-08: all six FKs are ON DELETE CASCADE. Seed admin: admin@alumni.test / Password123!. Touches auth + destructive SQL: stay inside the listed files.

**Implemented 2026-10-08 (task-implementer).**

- Validation: `validateAdminAlumniFields` (validation.ts) checks name (required), university, graduation year, department, job title, company with the existing limits and messages ("Job title", "Company", not "Current role"; the drawer's error mapping should key on these). Create adds `requiredEmail` and `validateNewPassword(…, "Temporary password")`.
- Edit is partial by columns, full-replace within them: the six columns are always written, so an omitted optional one is cleared (the drawer always sends all six). 404 is checked before validation, per the architecture.
- Create passes `university` possibly undefined into `createAlumniUser`, whose `RegisterUserFields.university` is typed `string`; a cast with a comment (pg sends undefined as NULL). Widening the DTO type was outside the file list.
- 201/200 bodies come from `findAlumniById` (profile columns: the list row plus `email`), id = alumni id. DELETE answers 200 `{ message: "Alumni deleted" }`.
- `AlumniQuery.findAlumniByUserId` already existed (ADV-002), so AlumniQuery.ts is untouched. routeGuard.test.ts needed no change (min count still met; 28 routes now).
- businessLogic `dist/` rebuilt (`tsc`), so `dist/AdminManager.*` exist (G32). Note the user's dev API on :3000 needs a restart to see it.
- **Manual dev-DB check, done:** private API on :3999 (the user's :3000 instance untouched). Created a throwaway alumnus through POST (201, alumni id 18 / user 25), duplicate email → 409, set headline/mentorship/bio via its own PUT /api/me, edited through PUT /api/admin/alumni/18 (six fields changed; headline, mentorship, bio, email kept; email/role in body ignored). Added its own post with an admin comment, a comment on post 10 with an admin reply to it, and a comment on post 9. Counts went 1→3 and 1→2; after DELETE they were back to 1 and 1, the second DELETE answered 404, stats returned to the start values, and SQL confirmed zero leftover rows and zero posts whose comment_count differs from the real count. The deleted user's still-valid token got 403 on /api/admin (ADV-003 behaviour as expected).

## Related

- Architecture: [[specs/2026-10/m/REQ-015-admin-page/architecture]]
- Lessons checked: L-REQ-005-2, G23, G24, G31, G32, G41
