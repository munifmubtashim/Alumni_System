# Component — frontend (`packages/frontend`)

| Field | Value |
|---|---|
| Path | `packages/frontend` |
| Owner | munifmubtashim |
| Status | stub — `STATUS: needs verification` (filled in by /wrapup of REQ-001) |

React 19 + Vite 8 + TypeScript SPA, rebuilt from scratch in [[REQ-001]]. Feature-based `src/` (`app/`, `features/`, `components/ui/`, `store/`, `services/`, `styles/`, `test/`). Styling via CSS Modules on generated design-token custom properties; headless behavior from Base UI ([[architecture/adr-01-ui-layer-headless-css-modules|ADR-01]]). Server state in TanStack Query, client state in Jotai ([[architecture/adr-02-server-state-tanstack-query|ADR-02]]).

## Touched by

- [[REQ-001]] — foundation rebuild
