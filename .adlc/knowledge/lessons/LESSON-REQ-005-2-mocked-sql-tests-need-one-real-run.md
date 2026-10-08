# Mocked query tests never run the SQL: check new SQL once against a real database ^L-REQ-005-2

| Field | Value |
|---|---|
| ID | LESSON-REQ-005-2 |
| Captured | 2026-10-06 |
| REQ | REQ-005 |
| Component | backend |
| Tags | backend, testing, sql, postgres |
| Severity | trap |

## The lesson

ADR-05's query tests mock `pool.query` and only compare SQL text and params, so invalid SQL, a wrong column type or a rejected escape clause still pass. When a REQ adds or changes SQL, run each new statement once against a real Postgres (psql or a local API call) and record the result in the review log.

## Saw it in

- REQ-005's first design had `ESCAPE '\'` in a template literal, which reaches Postgres as `ESCAPE ''` and fails every search; the mocked tests would have passed ([[knowledge/gotchas#^g21|G21]])
- The explorer and stress-test both called `alumni.graduation_year` VARCHAR; it is `integer` ([[knowledge/gotchas#^g15|G15]])
- Related: [[architecture/adr-05-backend-tests-vitest-supertest|ADR-05]]
