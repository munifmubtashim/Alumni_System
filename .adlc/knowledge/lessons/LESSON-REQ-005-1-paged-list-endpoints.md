# Paged list endpoints: single-value query checks, a stable order, a separate count, `{ items, total }` ^L-REQ-005-1

| Field | Value |
|---|---|
| ID | LESSON-REQ-005-1 |
| Captured | 2026-10-06 |
| REQ | REQ-005 |
| Component | backend |
| Tags | backend, api, pagination, validation |
| Severity | guideline |

## The lesson

For a list endpoint:
- pass raw `req.query` to the Manager and check that each value is a single string first (Express's `qs` gives arrays for `?a=1&a=2` and objects for `?a[b]=1`); empty means "not given"
- order by a unique tiebreaker (`ORDER BY u.name, a.id`), so pages never overlap
- compute `total` with a separate `COUNT(*)` over the same WHERE and params, not `COUNT(*) OVER()`, which returns nothing on a page past the end
- answer `{ items, total }`

## Saw it in

- `businessLogic/src/validation.ts` (`parseAlumniSearch`, `singleQueryValue`, `pagingNumber`), `dal/query/AlumniQuery.ts` (`searchAlumni`) — [[REQ-005]]
- conventions-api.md → Pagination (was conventions.md → Pagination before the 2026-10-06 split)
