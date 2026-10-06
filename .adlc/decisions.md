# Decisions Index

Catalog of all ADRs (architecture decision records). Updated by `/wrapup` when an ADR is accepted, superseded, or rejected.

| ID | Title | Status | Decided | Supersedes | Superseded by |
|---|---|---|---|---|---|
| [[architecture/adr-01-ui-layer-headless-css-modules\|ADR-01]] | UI layer: Base UI headless + CSS Modules on generated tokens | accepted | 2026-10-04 | — | — |
| [[architecture/adr-02-server-state-tanstack-query\|ADR-02]] | TanStack Query for server state; Jotai for client state | accepted | 2026-10-04 | — | — |
| [[architecture/adr-03-frontend-session-and-401-handling\|ADR-03]] | Frontend session: token store + ['me'] Query; global 401 via registered handler | accepted | 2026-10-05 | — | — |
| [[architecture/adr-04-forms-without-a-library\|ADR-04]] | Forms: controlled + pure validators + useMutation; no library for now | accepted | 2026-10-05 | — | — |
| [[architecture/adr-05-backend-tests-vitest-supertest\|ADR-05]] | Backend tests: Vitest + supertest, one mocked boundary per level, no DB | accepted | 2026-10-05 | — | — |
| [[architecture/adr-06-config-leaf-layer\|ADR-06]] | `src/config/`: a lint-enforced leaf layer for app-wide constants | accepted | 2026-10-06 | — | — |
| [[architecture/adr-07-root-layout-and-headerless-auth\|ADR-07]] | Root layout above two shells; auth pages without the app header | accepted | 2026-10-06 | — | amends ADR-03's mount point |

## Status legend

- **proposed** — drafted, not yet decided
- **accepted** — decision in effect
- **superseded** — replaced by a later ADR (link in "Superseded by")
- **rejected** — considered and not pursued

## How to add an entry

1. Create the ADR file at `architecture/adr-<NN>-<slug>.md` from `templates/adr-template.md`.
2. Add the `^ADR-<NN>` block anchor at the title.
3. Add a row here.
4. Link from `index.md` ADRs section.
