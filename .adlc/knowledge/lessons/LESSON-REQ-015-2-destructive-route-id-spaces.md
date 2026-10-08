# On an admin write, resolve the route id to the user id before comparing it with the token ^L-REQ-015-2

| Field | Value |
|---|---|
| ID | LESSON-REQ-015-2 |
| Captured | 2026-10-08 |
| REQ | REQ-015 |
| Component | businessLogic |
| Tags | backend, admin, auth, ids |
| Severity | guideline |

## The lesson

A route like `/api/admin/alumni/:id` takes an `alumni.id`, while `req.user.sub` is a `users.id`. Load the row in the Manager, take its `user_id`, and do every identity rule (self-delete refusal, ownership) on user ids. Comparing the route id with the token id passes tests that reuse small numbers and fails on real data. Same trap as [[knowledge/lessons/LESSON-REQ-009-1-profile-links-need-the-alumni-id|L-REQ-009-1]], on a write.

## Saw it in

- `packages/backend/src/businessLogic/src/AdminManager.ts` (`deleteAlumni`: 403 "You can't delete your own account")
