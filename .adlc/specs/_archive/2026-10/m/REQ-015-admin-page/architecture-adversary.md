# Architecture adversary — REQ-015-admin-page

Written by: architecture-adversary (tier: balanced), dispatched sub-agent.

| Field | Value |
|---|---|
| Generated | 2026-10-08 |
| Trigger | sensitive-surface, large-blast-radius, ui-surface |
| Verdict | found problems |

## Summary

Checked 8 tasks, 27 acceptance criteria, the delete transaction against the real schema (all 6 FKs cascade, `comment_count` counts replies, so the recount is correct), the router-level admin guard, and the sort whitelist. 0 critical, 0 major, 5 minor. Biggest: the "either both exist or neither" create and the delete's removal promise rest on thinner test and session coverage than the spec asks for. The delete SQL itself held up.

## Findings

### ADV-001: Create-transaction order is never tested (spec AC says it must be)

| Field | Value |
|---|---|
| Severity | minor |
| Confidence | high |
| Lens | testability |
| Where | spec AC "Tests: Query tests (… transaction order for create and delete)"; `architecture.md` §Test strategy; TASK-002 |

**What:** Create reuses `UserQuery.createAlumniUser`. `UserQuery.test.ts` has no BEGIN/COMMIT/ROLLBACK test for it (grep: none in `dal/query/*.test.ts`); `UserManager.test.ts` only mocks it. `AdminQuery.test` lists stats, delete and edit only.
**Why it matters:** "Both exist or neither" is an AC with no test pinning it.
**Refutation tried:** maybe covered elsewhere; grep found no `BEGIN`/`createAlumniUser` in any query test.
**Recommendation:** Add a TASK-002 item: a `UserQuery.createAlumniUser` test (BEGIN, user insert, alumni insert, COMMIT; ROLLBACK + release when the second insert throws).

### ADV-002: Create's "return the new list row" has no id to look up

| Field | Value |
|---|---|
| Severity | minor |
| Confidence | high |
| Lens | omission |
| Where | `architecture.md` §AdminManager `createAlumni`; `UserQuery.ts` createAlumniUser |

**What:** `createAlumniUser` returns the user row (user id), but `findAlumniById` takes the alumni id. The plan does not say how the 201 body is built.
**Why it matters:** The implementer will guess. The easy guess, `findAlumniByUserId` (returns `SELECT *`, no name/university join), gives a body without `name`, which the table and the "<name> added" toast need.
**Refutation tried:** toast could use the form's name; but the 201 body is the stated contract and the unjoined row lacks `name`.
**Recommendation:** State it: after create, call `findAlumniByUserId(user.id)` then `findAlumniById(row.id)`, or return the name from the request. Add to TASK-002 Approach.

### ADV-003: A deleted person's token keeps working for up to 1 hour

| Field | Value |
|---|---|
| Severity | minor |
| Confidence | high |
| Lens | failure-mode |
| Where | `authMiddleware` (JWT only, no DB check, `expiresIn: "1h"`); `architecture.md` §Risks |

**Break scenario:** Admin deletes a person at 10:00. Their token is valid until 11:00. They can still read the directory and `GET /api/alumni/:id` (which exposes emails). Any write (post, comment) hits an FK error and likely answers 500 rather than a clean 401/404.
**What:** Risks lists only the "demoted admin" case, not "removed user".
**Refutation tried:** same limit exists for `DELETE /api/users/:id` (REQ-003) and the window is bounded. It survives because this REQ is the first to promise "removes the person", and the risk table is silent.
**Recommendation:** Accept and document it in Risks and the feature README. Optionally have the Post/Comment managers map FK 23503 on user to 401. Do not add a per-request DB lookup in this REQ.

### ADV-004: Drawer non-happy states are underspecified

| Field | Value |
|---|---|
| Severity | minor |
| Confidence | medium |
| Lens | ux-consistency |
| Where | TASK-006 Approach/Acceptance; spec "Add alumni drawer" ACs |

**Break scenario:** (a) Admin double-clicks "Add alumni": request 1 creates the person, request 2 returns 409 and shows "An account with this email already exists" on a just-created person. (b) Admin presses Escape or clicks the backdrop while the save is in flight, or while the inline "Discard?" confirm is already showing; the plan does not say whether that closes, discards or ignores. (c) After an Edit save with sort by Name, the row may move off the page, so "focus returns to the opener" has no target (only Delete has a fallback, G35).
**Why it matters:** Each is a likely test or review finding.
**Refutation tried:** Base UI may default some of this; but nothing in the tasks pins it, and (a) is certain without a pending guard.
**Recommendation:** Add to TASK-006 acceptance: submit and close disabled while pending; Escape/backdrop while the confirm shows = Keep editing; focus falls back to the table heading when the opener is gone.

### ADV-005: TASK-001 omits the DTO file the sort has to travel through

| Field | Value |
|---|---|
| Severity | minor |
| Confidence | high |
| Lens | hidden-coupling |
| Where | TASK-001 Files to touch; `dal/dto/AlumniSearchDTO.ts` |

**What:** `searchAlumni(filters, paging)` takes `AlumniSearchFilters`/`AlumniPaging`, and `AlumniManager.searchAlumni` passes `{limit, offset}` explicitly. Sort and order must be added to one of those types, in `dal/dto/AlumniSearchDTO.ts`, which TASK-001 does not list (the architecture blast radius lists `dal/dto/*` only generally).
**Refutation tried:** `dal/dto/*` appears in the blast radius, but the task is the unit an implementer follows, and its list is explicit.
**Recommendation:** Add `dal/dto/AlumniSearchDTO.ts` to TASK-001 and say sort/order go on `AlumniSearchFilters`.

## Coverage

- **Lenses run:** omission, failure-mode, hidden-coupling, rollback (delete is intentionally irreversible, user-accepted; failure leaves nothing partial), contradiction, testability, ux-consistency.
- **Lenses skipped:** cross-repo (single repo).
- **AC coverage:** Access (4) checked; Stat cards (3) checked; Table (5) checked; Add drawer (4) checked, see ADV-004; Edit (2) checked; Delete (3) checked; Design and quality (4) checked, test AC partly uncovered, see ADV-001. All 27 mapped to a task.
