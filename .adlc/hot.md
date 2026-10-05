# Hot Log

Append-only chronological log of significant events. One line per entry. Newest at the top.

**Committed and shared.** Only ever add entries — never rewrite or reorder old ones. Git is configured (`merge=union` via `.adlc/.gitattributes`) so that when two branches both add entries, it keeps both instead of raising a conflict — the team keeps one shared history with no merge pain. Only ever *append*; never rewrite or reorder existing lines (that defeats the union merge).

Grep-friendly format: `## [YYYY-MM-DD] kind | description` with optional metadata after.

```
## [2026-05-13] req-merged | REQ-042 added Firestore composite indexes for query path
## [2026-05-13] lesson | L-REQ-012-1 — declare composite indexes before deploy
## [2026-05-12] adr-accepted | ADR-003 chose direct SignalR client over BFF translation
## [2026-05-12] gotcha | G05 noted — Login.aspx URL-substring branching
```

## Entries

<!-- Newest entries below this line, newest first. Each entry is a level-2 heading. -->

## [2026-10-06] verify-gate-cleared | REQ-003-backend-route-auth | findings: C0/M1/m2 open (vault) + t6 follow-up; 5 rounds, 19 fixed
## [2026-10-05] implement-gate-cleared | REQ-003-backend-route-auth
## [2026-10-05] adr-accepted | ADR-05 backend tests: Vitest + supertest, no DB
## [2026-10-05] architect-gate-cleared | REQ-003-backend-route-auth
## [2026-10-05] work-path-set | REQ-003-backend-route-auth | branch at /Users/munifmubtashim/Alumni_System
## [2026-10-05] spec-gate-cleared | REQ-003-backend-route-auth
## [2026-10-05] req-archived | REQ-002-auth-login-register
## [2026-10-05] req-merged | REQ-002-auth-login-register | PR #15 into redesign (0d40e321)
## [2026-10-05] ship-gate-cleared | REQ-002-auth-login-register
## [2026-10-05] req-ready-to-merge | REQ-002-auth-login-register | login, sign-up, session + 401 handling, header user menu, signed-in home
## [2026-10-05] lesson | L-REQ-002-1..7 — token-matched 401s, pure snapshot + expiry timer, must-succeed steps in mutationFn, one guard navigates, redirect-back from state only, docs task lists folder READMEs, focus after failed submit
## [2026-10-05] gotcha | G08–G12 — react-router/dom RouterProvider, Base UI menu, lint spellings, axios test adapter, session test traps
## [2026-10-05] concept | session-and-401 — first captured
## [2026-10-05] adr-accepted | ADR-03 status corrected to accepted in decisions.md
## [2026-10-05] verify-gate-cleared | REQ-002-auth-login-register | findings: C0/M0/m8 (4 resolved)
## [2026-10-05] implement-gate-cleared | REQ-002-auth-login-register
## [2026-10-05] adr-accepted | ADR-03 frontend session + 401 handler, ADR-04 forms without a library
## [2026-10-05] architect-gate-cleared | REQ-002-auth-login-register
## [2026-10-05] work-path-set | REQ-002-auth-login-register | branch at /Users/munifmubtashim/Alumni_System
## [2026-10-05] spec-gate-cleared | REQ-002-auth-login-register
## [2026-10-05] req-archived | REQ-001-frontend-foundation
## [2026-10-05] req-merged | REQ-001-frontend-foundation | PR #14 into redesign (589bfe41)
## [2026-10-05] ship-gate-cleared | REQ-001-frontend-foundation
## [2026-10-05] req-ready-to-merge | REQ-001-frontend-foundation | React 19 frontend foundation on the design system; antd removed
## [2026-10-05] lesson | L-REQ-001-1..9 — toolchain pins, duplicate React, Vitest 5 node tests, boundary lint, CSS Modules only, contrast sweeps, route error layers, ADR→CLAUDE.md, Jotai storage atoms
## [2026-10-05] gotcha | G01–G07 — theme key dup, vitest nesting, standalone tsconfigs, Stylelint numbers/:where, Base UI radio, token script, lint self-test
## [2026-10-05] concept | design-tokens — first captured
## [2026-10-05] verify-gate-cleared | REQ-001-frontend-foundation | findings: C0/M0/m1 open (3 rounds; 1 major + 15 minor fixed)
## [2026-10-05] implement-gate-cleared | REQ-001-frontend-foundation
## [2026-10-04] adr-accepted | ADR-01 UI layer (Base UI + CSS Modules on tokens), ADR-02 TanStack Query + Jotai
## [2026-10-04] architect-gate-cleared | REQ-001-frontend-foundation
## [2026-10-04] work-path-set | REQ-001-frontend-foundation | branch at /Users/munifmubtashim/Alumni_System
## [2026-10-04] spec-gate-cleared | REQ-001-frontend-foundation

## [2026-10-04] init | Vault initialized
## [2026-10-04] init-import | README.md → context/project-overview.md
## [2026-10-04] init-import | README.md → context/architecture.md
## [2026-10-04] init-import | tsconfig.json → context/conventions.md
## [2026-10-04] init-import | packages/frontend/eslint.config.js → context/conventions.md
