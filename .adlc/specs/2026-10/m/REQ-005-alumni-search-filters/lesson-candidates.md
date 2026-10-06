
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
