# Require sign-in on every non-public backend route

| Field | Value |
|---|---|
| REQ | REQ-003 |
| Status | in-progress |
| Phase | spec |
| Created | 2026-10-05 |
| Primary repo | alumni-system |
| Touched repos | alumni-system |
| Related | [[architecture/adr-03-frontend-session-and-401-handling\|ADR-03]] · [[concepts/session-and-401]] · [[knowledge/lessons/LESSON-REQ-002-1-401-only-if-token-matches\|L-REQ-002-1]] |

## Problem

Most of the API can be called without signing in, and some of it can be called as somebody else. Checked against `packages/backend/src/api/routes/*.ts` on 2026-10-05:

- `GET /api/users`, `GET /api/users/:id` and `GET /api/users/email/:email` are public and return `SELECT *` from `users`, so anyone can read every user's email and **bcrypt password hash**.
- `POST /api/users` is public and accepts any `role`, so anyone can create an **admin** account.
- `PUT /api/posts/:id` and `DELETE /api/posts/:id` are public with no owner check: anyone can edit or delete any post. `POST /api/posts` takes the author from the request body, so anyone can post as anyone.
- `PUT /api/users/:id/login` and `/logout` are public and let anyone overwrite any user's login/logout times.
- `POST /api/alumni` is public and takes `user_id` from the body. `GET /api/alumni`, `GET /api/alumni/email/:email`, `GET /api/posts`, `GET /api/posts/user/:id` and `GET /api/posts/:id/comments` are public.

The project convention ("every non-public route uses authMiddleware, plus requireRole where needed") is written down but not enforced, and nothing stops a new route from shipping unprotected. The backend has no automated tests.

## Goal

Every backend route except `POST /api/auth/login`, `POST /api/auth/register` and `GET /api/health` rejects a request without a valid token. Admin-only actions also reject non-admins. Posts can be edited or deleted only by their author or an admin, and are always created as the signed-in user. No response from any endpoint contains a password hash. The email-lookup and login/logout-time routes are gone. Automated backend tests prove each of these, and a test fails if someone later adds a route without auth.

## Non-goals

- Turning controllers into classes and adding the shared error middleware from the redesign conventions. Separate REQ; this one changes who may call what, not how errors are mapped.
- Post content rules. Create and update keep today's behaviour (no new required fields or length limits); only who may call them changes.
- Rate limiting, refresh tokens, token revocation, or changing the 1-hour token lifetime.
- Any frontend change. The frontend only calls `/auth/login`, `/auth/register` and `/me`, all of which keep working as today.
- Recording login/logout times some other way. The routes are removed; nothing replaces them in this REQ.

## Acceptance criteria

Status codes: no or invalid token → **401**; signed in but not allowed → **403**; target doesn't exist → **404** (checked before ownership, for an allowed role). 401 stays reserved for token problems so the frontend's session handling (ADR-03) still logs the user out only when it should.

**Public routes**
- [ ] AC1. `POST /api/auth/login`, `POST /api/auth/register` and `GET /api/health` work without a token, as today.

**Every other route requires a token**
- [ ] AC2. Every other route returns 401 without a token and 401 with an invalid or expired token. That covers all routes under `/api/users`, `/api/alumni`, `/api/posts`, `/api/comments` and `/api/me`.

**Route-by-route rules**

| Route | Who may call it |
|---|---|
| `GET /api/users` | admin |
| `POST /api/users` | admin (the only way to create an admin) |
| `GET /api/users/:id` | any signed-in user |
| `PUT /api/users/:id` | the user themselves (unchanged) |
| `DELETE /api/users/:id` | admin (unchanged) |
| `GET /api/users/email/:email` | removed |
| `PUT /api/users/:id/login`, `PUT /api/users/:id/logout` | removed |
| `GET /api/alumni`, `GET /api/alumni/:id` | any signed-in user |
| `POST /api/alumni` | alumni users only, for themselves, once (decided at the architect gate) |
| `PUT /api/alumni/:id` | the owner (unchanged) |
| `GET /api/alumni/email/:email` | removed |
| `GET /api/posts`, `GET /api/posts/user/:id`, `GET /api/posts/:id/comments` | any signed-in user |
| `POST /api/posts`, `POST /api/posts/:id/comments` | any signed-in user, as themselves |
| `PUT /api/posts/:id`, `DELETE /api/posts/:id` | the post's author or an admin |
| `DELETE /api/comments/:id` | the comment's author or an admin (unchanged) |
| `/api/me/*` | the signed-in user (unchanged) |

- [ ] AC3. Admin-only routes in the table return 403 for a signed-in student or alumni user, and succeed for an admin.
- [ ] AC4. Removed routes return 404 for a signed-in caller and 401 without a token (auth runs before routing, so a guest learns nothing about which paths exist), and their controller, manager and query methods are deleted if nothing else uses them.
- [ ] AC5. `POST /api/posts` stores the signed-in user as the author. A `user_id` in the body is ignored.
- [ ] AC6. `POST /api/alumni` creates the profile for the signed-in user. A `user_id` in the body is ignored, and the profile fields are validated with the same rules as editing a profile. Students and admins get 403; a caller who already has a profile gets 409.
- [ ] AC7. `PUT /api/posts/:id` and `DELETE /api/posts/:id` succeed for the author and for an admin, return 403 for any other signed-in user (post unchanged), and 404 for a post that doesn't exist. An admin editing someone's post does not change its author.
- [ ] AC8. No response body from any endpoint includes a `password` field (checked at least for every `/api/users` route and `POST /api/users`).
- [ ] AC8b. `POST /api/users` validates name, email, password and `role` (one of `admin`, `alumni`, `student`) with the same rules as sign-up, and returns 400 on bad input.
- [ ] AC9. `requireRole` returns 401 instead of throwing when it runs on a request with no signed-in user.

**Tests**
- [ ] AC10. The backend has a test command (`npm test` in the backend package, or from the root) that runs without a live Postgres database.
- [ ] AC11. Tests cover AC1–AC9: for every route, the no-token case; for admin-only and owner-only routes, the allowed and forbidden cases.
- [ ] AC12. A guard test lists every route registered on the Express app and fails if any route outside the public list (AC1) can be reached without a token. Adding an unprotected route makes this test fail.
- [ ] AC13. `CLAUDE.md`'s backend notes (the line saying not all routes apply `authMiddleware`) and the vault's `context/conventions.md` (API auth and backend testing) describe the new state.

## Assumptions

- No other client (mobile app, scripts, seed tooling) calls the routes being removed or locked down. The frontend calls only `/auth/login`, `/auth/register` and `/me` (checked in `packages/frontend/src/services/` on 2026-10-05). — `STATUS: needs verification`
- `register` already creates the user's alumni or student row, so `POST /api/alumni` is rarely needed; keeping it for signed-in users (for themselves) is enough.
- Admin accounts are made directly in the database or via `POST /api/users` by an existing admin. Bootstrapping the first admin is not this REQ's problem.
- Any signed-in user may read any other user's basic public info (`GET /api/users/:id`) and the alumni directory, since this is a members' network.

## Open questions

None. Resolved at the spec gate (2026-10-05):

- [x] Email lookups: **removed** (both `/users/email/:email` and `/alumni/email/:email`).
- [x] Reading posts, comments and the alumni directory: **signed-in users only**.

## Out of scope (for now)

- Controllers as classes + one shared error middleware (redesign convention).
- Pagination or field trimming on `GET /api/users` and `GET /api/alumni` beyond removing the password.
- Students' own profile routes (none exist yet).
- Auditing other business rules (e.g. comment count drift).

## Related

- Concepts: [[concepts/session-and-401]]
- Components: —
- Lessons: [[knowledge/lessons/LESSON-REQ-002-1-401-only-if-token-matches|L-REQ-002-1]] (the frontend logs out only on a 401 for the current token; 403 must stay distinct)
- ADRs: [[architecture/adr-03-frontend-session-and-401-handling|ADR-03]]

## Backlinks

_(populated by /wrapup or manually)_
