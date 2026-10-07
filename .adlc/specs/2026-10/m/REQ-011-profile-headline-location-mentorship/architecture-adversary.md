# Architecture adversary — REQ-011

Transcribed from the architecture-adversary agent's hand-back (the harness stopped it writing this file). Verdict: found problems — 0 critical, 2 major, 2 minor. No critical finding is open.

| ID | Sev | Finding | Handling |
|---|---|---|---|
| ADV-001 | major | Required `mentorship_available` in shared types breaks ~15 fixtures no task owns (app, auth, home, feed, services tests) | **Fixed.** Field is optional in the types; server always sends a boolean; client treats missing as false (TASK-002, architecture blast radius) |
| ADV-002 | major | No deploy order for migration 004; code first makes `GET /api/me` 500 for everyone | **Fixed.** Risk row, TASK-001 header comment, wrapup checklist item; rollback = revert code, keep columns |
| ADV-003 | minor | Students' `PUT /api/me` still runs the new alumni-only validators (400s for fields they cannot set) | **Fixed.** Validator split; student path uses only the shared part; test added (TASK-004) |
| ADV-004 | minor | Hidden Start year on phone can hide its own error; `FIELD_PREFIXES` lacks the four new labels | **Fixed.** TASK-006 adds the prefixes and a fallback for hidden-field errors; width behaviour checked in TASK-009 |

Checked with nothing found: `MY_PROFILE_SQL` COALESCE plan, registration inserts (named columns, rely on defaults), post/comment author queries (only `MIN(a.id)`), `a.*` reads.
