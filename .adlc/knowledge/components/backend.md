# Component — backend (`packages/backend`)

| Field | Value |
|---|---|
| Path | `packages/backend` (`src/api`, `src/businessLogic`, `src/dal`) |
| Owner | munifmubtashim |
| Status | stub — created at REQ-003 architect (2026-10-05); /wrapup fills it in |

Express + Postgres API in three npm workspaces that form one pipeline: routes → controllers (`@alumni/api`) → `*Manager` (`@alumni/businesslogic`, consumed from `dist/`) → `*Query` (`@alumni/dal`, raw `pg`). See the root `CLAUDE.md` Architecture section for the full picture.

## Touched by

- [[REQ-003]] — auth on every non-public route, post ownership, first backend test suite (ADR-05)
