
## CAND-001 [implement-task]
**Claim:** Run backend typecheck in a fresh worktree expecting TS1261 on dal/dto: git tracks `baseDTO.ts` but four DTOs import `./BaseDTO`.
**Saw it in:** `packages/backend/src/dal/dto/PostDTO.ts:1` (also AlumniDTO, UserDTO, CommentDTO)
**Context:** The main checkout has `BaseDTO.ts` on disk (core.ignorecase hides the mismatch), so it only fails in new clones/worktrees; fix by a git-level rename.
## CAND-001 [implement-task]
**Claim:** Rename `dal/dto/baseDTO.ts` to `BaseDTO.ts` in git; a fresh checkout fails `npm run typecheck` (TS1261) because imports say `./BaseDTO`.
**Saw it in:** `packages/backend/src/dal/dto/PostDTO.ts:1` (and Alumni/Comment/User DTOs)
**Context:** Git tracks `baseDTO.ts`; the main checkout's disk copy is `BaseDTO.ts` (case-insensitive macOS), so it passes there and fails in every new worktree or CI clone.

## CAND-002 [implement-task]
**Claim:** For methods that fire two `pool.query` calls via `Promise.all`, make the mock branch on the SQL text rather than using `mockResolvedValueOnce` order.
**Saw it in:** `packages/backend/src/dal/query/AlumniQuery.test.ts` (searchAlumni `beforeEach`)
**Context:** Call order follows array order today, but a SQL-keyed mock keeps tests honest if the queries are reordered.


## CAND-003 [implement-task]
**Claim:** When you delete a manager method, grep TestManager.ts too: its commented-out calls trip "grep finds nothing" checks.
**Saw it in:** `packages/backend/src/businessLogic/src/TestManager.ts:55`
**Context:** TASK-003 had to leave `// alumniManager.getAllAlumni();` because the file was outside the blast radius, which failed the grep acceptance.

## CAND-901 [review-corr]
**Claim:** Reject NUL (\u0000) in any user text that reaches a Postgres text param; pg throws 22021 and it surfaces as a 500.
**Saw it in:** `packages/backend/src/businessLogic/src/validation.ts:6`
**Context:** optionalText checks type and length only.

## CAND-902 [review-corr]
**Claim:** Escape LIKE input as a bound param with backslash; no ESCAPE clause needed and no dependence on standard_conforming_strings.
**Saw it in:** `packages/backend/src/dal/query/AlumniQuery.ts:30`
**Context:** Template-literal ESCAPE '\\' pitfall avoided by relying on the default escape.

## CAND-004 [review-qual]
**Claim:** When a new validator needs a rule an existing one already has (year range, text length), call the existing helper or share a named constant instead of copying the literals.
**Saw it in:** `packages/backend/src/businessLogic/src/validation.ts:147` (copy of `optionalYear`, line 20)
**Context:** `parseAlumniSearch` re-typed 1900 / now+10 and the 100/150 length limits.

## CAND-005 [review-qual]
**Claim:** In tests for two concurrent queries, look calls up by SQL pattern, not by index from the end of `mock.calls`.
**Saw it in:** `packages/backend/src/dal/query/AlumniQuery.test.ts:50`
**Context:** Mock answers by SQL but assertions read `calls.at(n - 2)`, tied to Promise.all order.

## CAND-006 [review-qual]
**Claim:** Type a list query's row as the DTO minus withheld columns, so "never returns email" is enforced by the type as well as the SELECT.
**Saw it in:** `packages/backend/src/dal/query/AlumniQuery.ts:23`
**Context:** `AlumniPage.items` is `AlumniDTO[]` (has `email?`) while shared `AlumniListItem` omits it.

## CAND-007 [review-arch]
**Claim:** When a convention says "reuse X for the next list", export the generic part (paging parser, Page type) rather than an entity-named function.
**Saw it in:** `packages/backend/src/businessLogic/src/validation.ts:1205`
**Context:** `parseAlumniSearch` bundles alumni filters with generic paging; `pagingNumber` is private.

## CAND-008 [review-arch]
**Claim:** Keep types that businessLogic imports from dal in one place (`dto/`), not scattered across Query files.
**Saw it in:** `packages/backend/src/dal/query/AlumniQuery.ts:1595`
**Context:** `AlumniSearchFilters` sits in a Query file; `AlumniEditableFields` sits in `dto/RegisterDTO.ts`.

## CAND-009 [review-arch]
**Claim:** A paged list answers `{ items, total }` and a privacy-trimmed type needs a test on the SQL column list, since `Omit<>` in shared types is not enforced at runtime.
**Saw it in:** `packages/shared/src/types/alumni.types.ts:1744`
**Context:** `AlumniListItem` omits email; only `AlumniQuery.test.ts:1472` guards it.

## CAND-010 [review-arch]
**Claim:** Import file names with their exact on-disk case; a wrong-case import passes on macOS and fails on Linux CI.
**Saw it in:** `packages/backend/src/dal/dto/AlumniDTO.ts:1` (`./BaseDTO` vs `baseDTO.ts`)
**Context:** Fixed in this REQ across four DTO files.


## CAND-004 [review-reflect]
**Claim:** In a LIKE pattern built in a JS template literal, never write `ESCAPE '\'`; backslash is already Postgres's default escape, so use `escapeLike` and no clause.
**Saw it in:** `packages/backend/src/dal/query/AlumniQuery.ts:17-20` (`escapeLike`), test at `AlumniQuery.test.ts` (ADV-001)
**Context:** `\'` collapses to `'`, Postgres gets `ESCAPE ''` and rejects it; mocked pool tests pass while every `q` request 500s. Gotcha (severity trap).

## CAND-005 [review-reflect]
**Claim:** Query tests mock the pool, so SQL validity and column types are never run; check new SQL once against a real database and record the result in the review log.
**Saw it in:** `packages/backend/src/dal/query/AlumniQuery.test.ts` (searchAlumni block)
**Context:** ADR-05 gap; the ESCAPE and `graduation_year` integer facts are both invisible to mocks. Consider an ADR-05 consequence note.

## CAND-006 [review-reflect]
**Claim:** Bind `graduation_year` filters as numbers: the live `alumni.graduation_year` is `integer`, though shared `Alumni` and `AlumniDTO` type it `string`.
**Saw it in:** `packages/backend/src/dal/query/AlumniQuery.ts` (graduationYear condition); `packages/shared/src/types/alumni.types.ts:7`
**Context:** Source of truth is `db/backups/*.sql` (G15); exploration.md wrongly said VARCHAR(10). Extend G15 or add a gotcha.

## CAND-007 [review-reflect]
**Claim:** Express `req.query` values may be string, array or object; validate with a single-value check before trimming, and pass `req.query` raw to the Manager.
**Saw it in:** `packages/backend/src/businessLogic/src/validation.ts:1187` (`singleQueryValue`)
**Context:** Reusable for the next paged or filtered list; fits a concept page "paged list endpoint" with `parseAlumniSearch`, `{ items, total }`, stable `ORDER BY name, id`, and the paired COUNT query.

## CAND-008 [review-reflect]
**Claim:** When a REQ deletes a Manager method, also sweep `TestManager.ts`; its commented calls survive grep-based acceptance checks (G-style note).
**Saw it in:** `packages/backend/src/businessLogic/src/TestManager.ts:55` (already removed in this diff)
**Context:** Duplicates CAND-003 from implement; merge. Also note lesson-candidates.md has two entries numbered CAND-001 (implement-task, same BaseDTO topic): dedupe at wrapup.

## Candidate verdicts

Dedup basis: lessons on `origin/redesign` (merged into this branch at 8a681aee, which includes REQ-004's L-REQ-004-1..3); no REQ-005 lessons exist there.

| Candidate | Verdict | Target / Reason |
|---|---|---|
| CAND-001 (both) | demote-to-gotcha | ^g22 (baseDTO casing) |
| CAND-002 | demote-to-gotcha | added to ^g13 (two-query mocks) |
| CAND-003 | demote-to-gotcha | ^g24 (TestManager sweep) |
| CAND-901 | demote-to-gotcha | ^g23 (NUL → 400) |
| CAND-902 | demote-to-gotcha | ^g21 (LIKE escaping) |
| CAND-004 [qual] | discard | general habit; fixed in code (m2, m3) |
| CAND-005 [qual] | demote-to-gotcha | merged into ^g13 |
| CAND-006 [qual] | discard | done in code (`AlumniListRow`) |
| CAND-007 [arch] | promote | merged into LESSON-REQ-005-1; conventions.md says when to extract |
| CAND-008 [arch] | discard | now the code's shape (dal/dto/) |
| CAND-009 [arch] | promote | merged into LESSON-REQ-005-1 |
| CAND-010 [arch] | demote-to-gotcha | merged into ^g22 |
| CAND-004 [reflect] | demote-to-gotcha | merged into ^g21 |
| CAND-005 [reflect] | promote | LESSON-REQ-005-2 |
| CAND-006 [reflect] | demote-to-gotcha | added to ^g15 (column types) |
| CAND-007 [reflect] | promote | merged into LESSON-REQ-005-1 |
| CAND-008 [reflect] | demote-to-gotcha | duplicate of CAND-003 → ^g24 |
