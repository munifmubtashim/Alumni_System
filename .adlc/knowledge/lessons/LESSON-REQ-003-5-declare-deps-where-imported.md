# Declare a dependency in the workspace that imports it, not only at the root ^L-REQ-003-5

| Field | Value |
|---|---|
| ID | LESSON-REQ-003-5 |
| Captured | 2026-10-06 |
| REQ | REQ-003 |
| Component | backend |
| Tags | npm-workspaces, dependencies, backend |
| Severity | nice-to-know |

## The lesson

When code in a workspace starts importing a third-party package, add it to that workspace's own `package.json` (and its `@types/*` to devDependencies). Root hoisting makes it work anyway, which hides the gap until a filtered install or a move breaks it.

## Saw it in

- `packages/backend/src/businessLogic/package.json` — `bcrypt` + `@types/bcrypt` added when hashing moved into `UserManager` (ARCH-005); the root copies were then removed
