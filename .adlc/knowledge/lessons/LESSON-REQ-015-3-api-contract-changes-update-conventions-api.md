# Change an API contract, update conventions-api.md in the same REQ ^L-REQ-015-3

| Field | Value |
|---|---|
| ID | LESSON-REQ-015-3 |
| Captured | 2026-10-08 |
| REQ | REQ-015 |
| Component | vault, api |
| Tags | api, vault, docs, conventions |
| Severity | guideline |

## The lesson

A new route namespace, a new query param on a shared list endpoint, or a write that breaks the house pattern (a partial update where every other PUT is a full replace) goes into `context/conventions-api.md` in the same REQ, not just into `CLAUDE.md`. Reviewers check code against the vault file; a contract that only `CLAUDE.md` describes is invisible to them.

## Saw it in

- REQ-015 review ARCH-001 / REFL-005: `/api/admin/*`, `sort`/`order` on `GET /api/alumni`, and the admin PUT's partial update were in `CLAUDE.md` but not in `conventions-api.md`
