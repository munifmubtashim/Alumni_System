# Link a person to their profile with the alumni id, and check which id a route takes before planning the link ^L-REQ-009-1

| Field | Value |
|---|---|
| ID | LESSON-REQ-009-1 |
| Captured | 2026-10-07 |
| REQ | REQ-009 |
| Component | feed, alumni api |
| Tags | frontend, api, routing, alumni, profile |
| Severity | trap |

## The lesson

A route named `/alumni/:id` takes `alumni.id`, not `users.id`; when a spec or plan says "link to the profile", read the route's query (`AlumniQuery.findAlumniById`) and confirm which id the data on screen carries before writing the task.

## Saw it in

- `packages/backend/src/dal/query/AlumniQuery.ts:43` — `WHERE a.id = $1`
- `packages/backend/src/dal/query/PostQuery.ts` — `author_alumni_id` added as TASK-009 after the TASK-005 implementer found posts only carry `user_id` (spec, architecture and the stress-test all said `/alumni/:user_id`)
