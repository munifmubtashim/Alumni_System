# On a full-replace endpoint, a NOT NULL boolean must be sent every time: omitted means false ^L-REQ-011-3

| Field | Value |
|---|---|
| ID | LESSON-REQ-011-3 |
| Captured | 2026-10-07 |
| REQ | REQ-011 |
| Component | backend, frontend |
| Tags | api, put, boolean, defaults |
| Severity | guideline |

## The lesson

`PUT /api/me` and `PUT /api/alumni/:id` replace every field, so a client that omits `mentorship_available` turns it off. Make the client always send it (`toUpdateInput` does for alumni) and state the rule in the API conventions; the alternative (omitted keeps the stored value) would make the API inconsistent with every other field.

## Saw it in

- `optionalBoolean` in `businessLogic/src/validation.ts`; documented in `.adlc/context/conventions-api.md` (CAND-019).
