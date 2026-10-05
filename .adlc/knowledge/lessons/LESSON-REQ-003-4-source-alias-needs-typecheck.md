# A package tested through a source alias needs a typecheck that includes its tests ^L-REQ-003-4

| Field | Value |
|---|---|
| ID | LESSON-REQ-003-4 |
| Captured | 2026-10-06 |
| REQ | REQ-003 |
| Component | backend |
| Tags | backend, testing, typescript, build |
| Severity | guideline |

## The lesson

Vitest strips types without checking them, and aliasing `@alumni/businesslogic` to source hides a stale `dist/`. Any package tested that way needs a `typecheck` script that runs `tsc --noEmit` with the same alias and includes the test files. Keep `*.test.ts` out of every build tsconfig.

## Saw it in

- `packages/backend/tsconfig.test.json`, `packages/backend/package.json` → `typecheck`
- Round 1 of [[REQ-003]] changed Manager signatures across the package boundary with a green suite and no type check (ARCH-003)
- `businessLogic/tsconfig.json` emitted `dist/*.test.js` until tests were excluded
