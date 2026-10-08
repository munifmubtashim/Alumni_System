# Create and update validate a field with one shared helper, and are tightened together ^L-BUG-001-2

| Field | Value |
|---|---|
| ID | LESSON-BUG-001-2 |
| Captured | 2026-10-08 |
| REQ | BUG-001 |
| Component | businessLogic |
| Tags | backend, validation, api, posts |
| Severity | guideline |

## The lesson

If an endpoint pair (POST/PUT) accepts the same field, normalize and validate it through one Manager helper and enforce invariants on both paths. A cast on create (`body.caption as string`) stores anything, and a rule closed on one path leaves the other as a way back in.

## Saw it in

- `packages/backend/src/businessLogic/src/PostManager.ts` (`readText`, `requireCaption` in `createNewPost` and `updatePost`; before BUG-001 create cast the body unchecked and update stored text untrimmed)
