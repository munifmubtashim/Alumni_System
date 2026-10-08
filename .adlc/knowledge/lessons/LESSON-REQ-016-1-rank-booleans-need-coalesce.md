# A boolean used to rank with ORDER BY DESC must be wrapped in COALESCE(..., false) ^L-REQ-016-1

| Field | Value |
|---|---|
| ID | LESSON-REQ-016-1 |
| Captured | 2026-10-08 |
| REQ | REQ-016 |
| Component | frontend |
| Tags | backend, sql, postgres, ranking |
| Severity | trap |

## The lesson

Postgres sorts NULL first under `DESC`. A rank flag like `lower(a.department) = lower(me.department)` is NULL when either side is missing, so people with no department would outrank real department-mates. Wrap each flag as `COALESCE(<comparison>, false)`, and assert that text in the DB-free query test (tests here run no database).

## Saw it in

- `dal/query/AlumniQuery.ts` (`suggestAlumni`) — [[REQ-016]] (ADV-001, found by the architecture stress-test before any code existed; CAND-005, review CAND-002)
