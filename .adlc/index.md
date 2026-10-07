# Vault Index

A table of contents for the vault. Claude reads this when answering "what do we know about X" — it's faster than walking every file.

## How this file is maintained

Updated by `/wrapup` at the end of each REQ. You can also edit it manually. When a new artifact is created, add a row in the appropriate section with a one-line description.

---

## Specs

_(REQ pages by id, with a one-line summary)_

`Path` is vault-relative and is the one place a REQ's folder location is written down — `/wrapup` repoints it when a REQ is archived, and `/config migrate` repoints it when folders are bucketed. Everything else refers to a REQ by **ID** and resolves the path at read time.

| REQ | Title | Status | Path |
|---|---|---|---|
| REQ-001 | Rebuild the frontend foundation on the new design system | merged 2026-10-05 (PR #14) | specs/_archive/2026-10/m/REQ-001-frontend-foundation |
| REQ-002 | Login, sign-up and session handling on the new frontend | merged 2026-10-05 (PR #15) | specs/_archive/2026-10/m/REQ-002-auth-login-register |
| REQ-003 | Require sign-in on every non-public backend route | merged 2026-10-06 (PR #16) | specs/_archive/2026-10/m/REQ-003-backend-route-auth |
| REQ-004 | Rebrand to Alma; restyle login, sign-up and the app shell | merged 2026-10-06 (PR #17) | specs/_archive/2026-10/m/REQ-004-alma-rebrand-auth-shell |
| REQ-005 | Search, filters and paging for the alumni directory API | merged 2026-10-06 (PR #18) | specs/_archive/2026-10/m/REQ-005-alumni-search-filters |
| REQ-006 | Alumni directory page at /directory (lazy route, URL-held search and filters, Directory nav link) | merged 2026-10-06 (PR #19) | specs/_archive/2026-10/m/REQ-006-alumni-directory-page |
| REQ-007 | App shell and Home match S1 (avatar menu, phone tab bar, quick-link cards) | merged 2026-10-06 (PR #20) | specs/_archive/2026-10/m/REQ-007-app-shell-home-s1 |
| REQ-008 | Alumni profile page at /alumni/:id (lazy route, S3 designs, Back link keeps directory search) | merged 2026-10-06 (PR #21) | specs/_archive/2026-10/m/REQ-008-alumni-profile-page |
| REQ-009 | Post feed page at /feed (lazy, S4 designs, optimistic posts and comments, comment edit endpoint) | merged 2026-10-07 (PR #23) | specs/_archive/2026-10/m/REQ-009-post-feed-page |
| REQ-010 | My Profile page at /me (lazy, S5 designs, API-backed fields only, leave guard, toast) | merged 2026-10-07 (PR #24) | specs/_archive/2026-10/m/REQ-010-my-profile-page |
| REQ-011 | Alumni headline, location, degree, start year, mentorship (migration 004, API, My Profile, S3 profile, S2 card) | merged 2026-10-07 (PR #26) | specs/_archive/2026-10/m/REQ-011-profile-headline-location-mentorship |
| REQ-012 | Rename My Profile to Account settings; /me out of the header nav; phone tab "Account" (kind: task) | merged 2026-10-07 (PR #27) | specs/_archive/2026-10/m/REQ-012-account-settings-nav-labels |
| REQ-013 | Fix BaseDTO casing (typecheck:backend passes); Start year shown at every width (kind: task) | merged 2026-10-07 (PR #29) | specs/_archive/2026-10/m/REQ-013-casing-fix-start-year-all-widths |
| REQ-014 | Public About page at /about (lazy, S7 designs), site footer, About link on log-in and sign-up (kind: task) | merged 2026-10-07 (PR #30) | specs/_archive/2026-10/m/REQ-014-about-page |

## ADRs

| ID | Title | Status | Decided |
|---|---|---|---|
| [[architecture/adr-01-ui-layer-headless-css-modules\|ADR-01]] | UI layer: Base UI headless + CSS Modules on generated tokens | accepted | 2026-10-04 |
| [[architecture/adr-02-server-state-tanstack-query\|ADR-02]] | TanStack Query for server state; Jotai for client state | accepted | 2026-10-04 |
| [[architecture/adr-03-frontend-session-and-401-handling\|ADR-03]] | Frontend session: token store + ['me'] Query; global 401 via registered handler | accepted | 2026-10-05 |
| [[architecture/adr-04-forms-without-a-library\|ADR-04]] | Forms: controlled + pure validators + useMutation; no library (re-decided at REQ-010: stay) | accepted | 2026-10-05 |
| [[architecture/adr-05-backend-tests-vitest-supertest\|ADR-05]] | Backend tests: Vitest + supertest, one mocked boundary per level, no DB | accepted | 2026-10-05 |
| [[architecture/adr-06-config-leaf-layer\|ADR-06]] | `src/config/` leaf layer for app-wide constants | accepted | 2026-10-06 |
| [[architecture/adr-07-root-layout-and-headerless-auth\|ADR-07]] | Root layout above two shells; header-less auth pages | accepted | 2026-10-06 |
| [[architecture/adr-08-route-code-splitting-and-url-list-state\|ADR-08]] | Route `lazy` splitting; list state in the URL | accepted | 2026-10-06 |
| [[architecture/adr-09-optimistic-updates-by-cache-edit\|ADR-09]] | Optimistic updates by editing the query cache | accepted | 2026-10-07 |

## Concepts

Patterns, rules that must always hold, domain models.

| Page | One-line summary |
|---|---|
| [[knowledge/concepts/detail-page-pattern]] | one record page: id-keyed query, dependent posts query, every state has h1 + title + focus, Back link handover via config |
| [[knowledge/concepts/design-tokens]] | tokens.json → generated CSS variables; tokens-only enforced by lint; contrast pinned by test |
| [[knowledge/concepts/route-layout]] | one root layout (session + theme effects) above AuthShell (no header) and AppShell (header); two error layers per shell |
| [[knowledge/concepts/session-and-401]] | token store + `['me']` Query; registered 401 handler; one expire path (401 or timer); guards own navigation |

## Components

One page per major module.

| Page | Module | Owner |
|---|---|---|
| [[knowledge/components/frontend]] | `packages/frontend` | munifmubtashim |
| [[knowledge/components/backend]] | `packages/backend` (api, businessLogic, dal) | munifmubtashim |

## Lessons

See [[knowledge/lesson-ledger]] — generated, one row per lesson, rebuilt by every skill that writes a lesson. Not edited here.

## Gotchas

See [[knowledge/gotchas]] — single-file consolidated list with `^g##` anchors.

## Reference

Cross-cutting reference docs that don't fit elsewhere.

| Page | What it covers |
|---|---|
| _(empty)_ | |
