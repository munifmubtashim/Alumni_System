# A client copy of an API's validation limits needs a pointer to its source ^L-REQ-006-3

| Field | Value |
|---|---|
| ID | LESSON-REQ-006-3 |
| Captured | 2026-10-06 |
| REQ | REQ-006 |
| Component | frontend, backend |
| Tags | frontend, backend, validation, api |
| Severity | guideline |

## The lesson

When the frontend parses user or URL input against the backend's limits (page 10000, year window, text lengths), the numbers are a hand copy, because `@alumni/shared` has no runtime code. Name the backend file and constants in a comment next to the copy, and make the client drop what the API would answer with 400, so a drift shows up as a wrong result in review rather than as an error state whose Retry can never work. If a second list screen copies them again, move the limits into shared with an ADR.

## Saw it in

- `features/directory/params.ts` (header comment names `businessLogic/src/validation.ts`: `MAX_PAGE`, `NAME_MAX`, `DEPARTMENT_MAX`, `UNIVERSITY_MAX`, `optionalYear`) — [[REQ-006]]
- Related: [[knowledge/lessons/LESSON-REQ-005-1-paged-list-endpoints|L-REQ-005-1]], [[knowledge/gotchas#^g23|G23]] (NUL → 400)
