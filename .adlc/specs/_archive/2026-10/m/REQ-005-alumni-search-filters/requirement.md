# Search, filters and paging for the alumni directory API

| Field | Value |
|---|---|
| REQ | REQ-005 |
| Status | validated |
| Phase | spec |
| Created | 2026-10-06 |
| Primary repo | alumni-system |
| Touched repos | alumni-system |
| Related | [[knowledge/components/backend]] · [[architecture/adr-05-backend-tests-vitest-supertest\|ADR-05]] · [[knowledge/gotchas#^g14\|G14]] · [[knowledge/gotchas#^g15\|G15]] · [[REQ-003]] |

## Problem

`GET /api/alumni` returns every alumni profile as one array, ordered by name (checked 2026-10-06: `AlumniQuery.getAllAlumni`, no parameters). There is no way to search, filter or page. The directory screen (`docs/design/screens/app/S2-*`: "Showing 1–6 of 142 alumni", filters for department, graduation year and university) can't be built on it, and the response grows with every member.

## Goal

`GET /api/alumni` accepts optional query parameters for text search, filters and paging, and returns `{ items, total }`: one page of matching profiles, plus the number of all matches. All filtering happens in parameterized SQL in `AlumniQuery`. The route stays behind `authMiddleware`.

## Non-goals

- The directory screen itself (frontend).
- Full-text search, ranking or fuzzy matching. Plain case-insensitive "contains" is enough for now.
- New database columns or indexes (no migration in this REQ).
- Sorting options. Results stay ordered by name.

## Acceptance criteria

- [ ] AC1. `GET /api/alumni` with no parameters returns `{ items, total }`: the first page of all alumni, ordered by name (ties broken by id), with `total` = the number of all alumni. Each item has the same fields as today's list rows.
- [ ] AC2. `q` matches, case-insensitively, any part of the alumni's **name**, **current company** or **job title**. `%` and `_` in `q` are matched literally, not as wildcards. `q` is trimmed; an empty `q` is ignored.
- [ ] AC3. `department` and `university` match case-insensitively and in full: `department=computer science` matches "Computer Science", not "Computer Science Education". `graduationYear` matches exactly.
- [ ] AC4. Parameters combine with AND; `q` and the filters can be used together.
- [ ] AC5. `page` (default 1) and `pageSize` (default 20, max 100) select the page; `total` ignores paging. A page past the end returns `items: []` with the real `total`.
- [ ] AC6. Invalid input returns **400** with `{ message }` and runs no query: non-numeric, zero or negative `page`/`pageSize`; `pageSize` above 100; `page` above 10000 (a cap on deep offsets); a `graduationYear` that isn't a 4-digit year; any value over its length limit; a repeated parameter (`?q=a&q=b`). Unknown parameters are ignored. An empty value (`?page=`, `?q=`) counts as not given, so the default applies.
- [ ] AC7. All SQL lives in `AlumniQuery`, and every user value is a bound parameter (never concatenated into the SQL text). The WHERE clause is built only from a fixed set of fragments.
- [ ] AC8. The route stays behind `authMiddleware`: no token → 401. The guard test still passes.
- [ ] AC9. Tests:
  - query tests assert the generated SQL and parameters for each filter, combinations, wildcard escaping and paging
  - manager tests cover validation and defaults
  - route tests cover the response shape, 400s and 401

## Assumptions

- Nothing consumes `GET /api/alumni` yet, so changing the response from an array to `{ items, total }` breaks no caller. The frontend calls only `/auth/*` and `/me` (checked 2026-10-06). — `STATUS: needs verification` (also the Postman cloud collections, as in REQ-003)
- University comes from `users.university`; department, graduation year, company and job title come from the `alumni` row.
- `graduationYear` is a single year, not a range. The S2 design shows a range ("2015–2020"); a range can be added later without breaking this API.

## Open questions

None. Resolved at the spec gate (2026-10-06):

- [x] `field` is **dropped** from this REQ. No column stores a field of study; add it later together with a migration. A `field` parameter is ignored like any unknown parameter.

## Out of scope (for now)

- A `field` (field of study) filter, which needs a new column first.
- Graduation-year ranges, sorting, and filtering by mentorship status or role.
- An index on `lower(u.name)` etc. (worth it once the table is large).
- The S2 directory page.

## Related

- Components: [[knowledge/components/backend]]
- Lessons: [[knowledge/lessons/LESSON-REQ-003-1-partial-mocks-of-workspace-packages|L-REQ-003-1]], [[knowledge/lessons/LESSON-REQ-003-2-protect-at-router-prove-with-walker|L-REQ-003-2]], [[knowledge/lessons/LESSON-REQ-003-3-migrate-every-handler-in-a-touched-file|L-REQ-003-3]]
- Gotchas: [[knowledge/gotchas#^g14|G14]] (`requireId` → 404), [[knowledge/gotchas#^g15|G15]] (schema only in backups)
- ADRs: [[architecture/adr-05-backend-tests-vitest-supertest|ADR-05]]

## Backlinks

_(populated by /wrapup or manually)_
