# Architecture adversary — REQ-005-alumni-search-filters

Written by: architecture-adversary (tier: balanced), dispatched sub-agent.

| Field | Value |
|---|---|
| Generated | 2026-10-06 |
| Trigger | sensitive-surface |
| Verdict | found problems |

## Summary

Checked the 4 tasks, 9 ACs and the pressure points the caller listed. 2 findings: 1 major, 1 minor. Biggest one: the `ESCAPE '\'` fragment, written inside a JS template literal, becomes `ESCAPE ''` and Postgres rejects it, so every `q` search would 500, and the planned pool-mocked tests cannot see it.

Dispatch questions:
- SQL injection / dynamic WHERE: checked, nothing (fragments are constants, all values are `$n`).
- Escape char coverage: checked, nothing beyond ADV-001 (`escapeLike` covers `\`, `%`, `_`).
- Param reuse 3x: checked, nothing (pg allows reusing `$n`; type is inferred once, consistently).
- ILIKE vs lower(), unicode: checked, nothing worth reporting.
- total vs items, LIMIT/OFFSET: checked, nothing (2 unlocked queries accepted in the design; the page cap is ADV-002).
- Express 4 qs edge cases (arrays, objects, `__proto__`, long strings): checked, nothing. Arrays and objects are caught by the string-type check; qs drops `__proto__`; very long URLs are rejected by Node (431) before the app.
- NULL company/title/department: checked, nothing (`NULL ILIKE` is NULL inside an OR; `lower(NULL) = x` excludes the row, which is right).
- Trim vs untrimmed DB values: checked, nothing (every write path goes through `optionalText`, which trims).
- Response shape change: checked, nothing beyond a note below.
- Task ordering and shared files: checked, nothing (TASK-001 owns `dal/index.ts`; TASK-002 has a stated fallback).
- No node_modules in the worktree: checked, nothing (`npm install` is in both task acceptances).

## Findings

### ADV-001: `ESCAPE '\'` breaks inside a JS template literal, and no planned test would catch it

| Field | Value |
|---|---|
| Severity | major |
| Confidence | high |
| Lens | failure-mode |
| Where | `architecture.md` §Approach (SQL) fragment table, `tasks/TASK-001.md` Acceptance |

**What:** Existing SQL in `AlumniQuery.ts` is written as template literals. In a template literal `\'` is an escape and yields `'`, so `ESCAPE '\'` is sent as `ESCAPE ''`. Postgres answers "invalid escape string" and every request with `q` returns 500. A fragment like `'\'` kept as a plain constant fails the same way unless it is written `'\\'`.

**Why it matters:** The query tests mock `pool.query` (`AlumniQuery.test.ts:5-6`), so they only compare strings. A test written with the same typo passes. The spec's AC2 (literal `%` and `_`) is the feature that would be broken, and nothing would show it until a real Postgres runs.

**Why this holds up:** I looked for a guard. The task text says only "`\\`, `%`, `_` prefixed with `\\`" and gives no SQL source form. No test hits a real database (ADR-05 is mock-only). Postgres's default LIKE/ILIKE escape character is already backslash, so the clause adds risk and no behaviour.

**Recommendation:** Drop the `ESCAPE` clause from all three fragments (the default escape is `\`). If you keep it, write it as `ESCAPE '\\'` in source and add a test asserting `toContain("ESCAPE '\\\\'")`. Also add one manual `psql` check to `verification.md`: run `searchAlumni` with `q = "100%"` and `q = "a_b"` against a real database and confirm literal matching and no error.

### ADV-002: the page cap of 10000 is a 400 the spec never promised, and empty paging values are undecided

| Field | Value |
|---|---|
| Severity | minor |
| Confidence | medium |
| Lens | contradiction |
| Where | `architecture.md` §Validation (`page` 1..10000), spec AC5/AC6 |

**What:** AC5 says a page past the end returns `items: []` with the real total. AC6 lists the 400 cases and `page` above a cap is not one. The architecture adds a 400 for `page > 10000` that the spec does not state, so a client paging a big directory gets an error where AC5 promises an empty page. Separately, an empty `?page=` or `?pageSize=%20` fails `/^\d+$/` and returns 400, while an empty `q`, `department`, `university` is ignored. The design does not say whether `page` and `pageSize` are trimmed or ignored when empty.

**Why it matters:** The implementer will guess, and the tests list `0`, `-1`, `1.5`, `101` but not empty or whitespace values. With `pageSize` max 100 and page cap 10000, only the first million rows are reachable, which is fine today but unstated.

**Why this holds up:** I tried treating the cap as covered by "invalid input". But AC6 enumerates invalid cases explicitly, and the cap is not among them. A client or test written from the spec would expect `[]`.

**Recommendation:** Pick one and write it into the spec and architecture. Either add "`page` above 10000" to AC6, or drop the cap and let OFFSET run (a large OFFSET on a small table is harmless). Add one line: empty or whitespace `page`/`pageSize` is treated as absent (default) or as 400, and add that case to the `validation.test.ts` list.

## Note (not a finding)

`AlumniManager.test.ts:14,145-150` and `routes.test.ts:239,453` also reference `getAllAlumni`. TASK-003's grep acceptance catches them, so this is loud, not silent. The blast radius table could name `routes.test.ts:453` (the role-table entry) to save a surprise.

## Coverage

- **Lenses run:** omission, failure-mode, hidden-coupling, rollback, contradiction, testability.
- **Lenses skipped:** ux-consistency (no UI surface); cross-repo (single repo). Rollback: no schema change; revert is a code revert.
- **Acceptance-criteria coverage:** AC1 checked, AC2 checked (ADV-001), AC3 checked, AC4 checked, AC5 checked (ADV-002), AC6 checked (ADV-002), AC7 checked, AC8 checked, AC9 checked (ADV-001: tests cannot prove the SQL runs).
