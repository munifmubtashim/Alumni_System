# Hot Log

Append-only chronological log of significant events. One line per entry. Newest at the top.

## [2026-10-07] architect-gate-cleared | REQ-011-profile-headline-location-mentorship
## [2026-10-07] work-path-set | REQ-011-profile-headline-location-mentorship | branch at /Users/munifmubtashim/Alumni_System
## [2026-10-07] spec-gate-cleared | REQ-011-profile-headline-location-mentorship
**Committed and shared.** Only ever add entries — never rewrite or reorder old ones. Git is configured (`merge=union` via `.adlc/.gitattributes`) so that when two branches both add entries, it keeps both instead of raising a conflict — the team keeps one shared history with no merge pain. Only ever *append*; never rewrite or reorder existing lines (that defeats the union merge).

Grep-friendly format: `## [YYYY-MM-DD] kind | description` with optional metadata after.

```
## [2026-10-07] req-archived | REQ-009-post-feed-page
## [2026-10-07] req-archived | REQ-010-my-profile-page
## [2026-10-07] req-merged | REQ-010-my-profile-page | PR #24 into redesign (5a905dcd)
## [2026-10-07] ship-gate-cleared | REQ-010-my-profile-page | PR draft and merge checklist ready; user runs push, PR and merge
## [2026-10-07] req-ready-to-merge | REQ-010-my-profile-page | My Profile page at /me, 8 tasks, 7 commits, 1217 tests
## [2026-10-07] lesson | L-REQ-010-1..5 — feed cache keys, guard-owned query states, leave prompt reason, ADR revisit triggers, nav/menu README lists
## [2026-10-07] gotcha | G36 Toast and status region, G37 test and layout traps, G38 backend error to field mapping
## [2026-10-07] adr-updated | ADR-04 — re-decided at REQ-010: stay with controlled state, no form library
## [2026-10-07] verify-gate-cleared | REQ-010-my-profile-page | findings: C0/M1/m6 open (M2 ADR-04 recorded at wrapup; m1 guard follow-up)
## [2026-10-07] implement-gate-cleared | REQ-010-my-profile-page | 8 tasks, 1211 tests pass; S5 comparison partial, rest left to review
## [2026-10-07] architect-gate-cleared | REQ-010-my-profile-page | 8 tasks, full adversary pass 0C/3M/5m fixed, no new ADR
## [2026-10-07] work-path-set | REQ-010-my-profile-page | branch at /Users/munifmubtashim/Alumni_System (feat/REQ-010-my-profile-page)
## [2026-10-07] spec-gate-cleared | REQ-010-my-profile-page | build only API-backed fields; mentorship, headline, location, degree, start year, photo upload deferred
## [2026-10-07] req-merged | REQ-009-post-feed-page | PR #23 into redesign (8d626c48)
## [2026-10-07] ship-gate-cleared | REQ-009-post-feed-page | 6 stale vault pages updated (REFL-002)
## [2026-10-07] req-ready-to-merge | REQ-009-post-feed-page | feed page /feed, comment edit endpoint, author_alumni_id, ADR-09
## [2026-10-07] lesson | L-REQ-009-1..4 — alumni id for profile links, optimistic rollback and settle, offset paging, six lists for a lazy feature
## [2026-10-07] gotcha | G31–G35 — dal SQL, backend typecheck, contrast pairs, feed test traps, menu focus and tap targets
## [2026-10-07] concept | optimistic-cache-edits — first captured
## [2026-10-07] verify-gate-cleared | REQ-009-post-feed-page | findings: C0/M1/m8 open (fix round: m1,m2,m3,m11 fixed)
## [2026-10-07] implement-gate-cleared | REQ-009-post-feed-page | 9 tasks; frontend 1047 + backend 369 tests pass
## [2026-10-07] adr-accepted | ADR-09 optimistic updates by editing the TanStack Query cache
## [2026-10-07] architect-gate-cleared | REQ-009-post-feed-page | adversary: 0 critical, 5 major fixed, 4 minor handled
## [2026-10-07] work-path-set | REQ-009-post-feed-page | branch at /Users/munifmubtashim/Alumni_System
## [2026-10-07] task-escalated-to-proceed | REQ-009-post-feed-page | new PUT /api/comments/:id (public API contract) + 10+ files
## [2026-10-07] req-archived | REQ-008-alumni-profile-page
## [2026-10-06] req-merged | REQ-008-alumni-profile-page | PR #21 into redesign (d353a29d); PR #22 (8bf7314a) followed with the REQ-007 archive recovery
## [2026-10-07] req-recovered | REQ-007-app-shell-home-s1 | back-filled from 3/cleared to merged (PR #20); archive move finished
## [2026-10-07] ship-gate-cleared | REQ-008-alumni-profile-page
## [2026-10-07] req-ready-to-merge | REQ-008-alumni-profile-page | alumni profile page at /alumni/:id, S3 designs, lazy route, Back link keeps the directory search
## [2026-10-07] lesson | L-REQ-008-1..6 — detail-page query/error state, heading focus, config handover, per-feature lazy ban, design line height vs stylelint, copies between lazy features
## [2026-10-07] gotcha | G28–G30 — type-aware lint traps, test traps, CSS override order and live regions
## [2026-10-07] concept | detail-page-pattern — first captured
## [2026-10-07] verify-gate-cleared | REQ-008-alumni-profile-page | findings: C0/M0/m5 (m1-m6 fixed; m7-m11 open)
## [2026-10-07] implement-gate-cleared | REQ-008-alumni-profile-page
## [2026-10-07] architect-gate-cleared | REQ-008-alumni-profile-page
## [2026-10-06] work-path-set | REQ-008-alumni-profile-page | branch at /Users/munifmubtashim/Alumni_System
## [2026-10-06] spec-gate-cleared | REQ-008-alumni-profile-page
## [2026-10-06] ship-gate-cleared | REQ-007-app-shell-home-s1
## [2026-10-06] req-ready-to-merge | REQ-007-app-shell-home-s1 | S1 shell, avatar menu, phone tab bar, Home cards
## [2026-10-06] task-plan-cleared | REQ-007-app-shell-home-s1
## [2026-10-06] work-path-set | REQ-007-app-shell-home-s1 | branch feat/REQ-007-app-shell-home-s1
## [2026-10-06] ship-gate-cleared | REQ-005-alumni-search-filters
## [2026-10-06] req-ready-to-merge | REQ-005-alumni-search-filters | GET /api/alumni search, filters and paging → { items, total }
## [2026-10-06] lesson | L-REQ-005-1..2 — paged list endpoints, mocked SQL tests need one real run
## [2026-10-06] gotcha | G21–G24 — LIKE escaping, baseDTO casing, NUL → 400, TestManager sweep (G13 and G15 extended)
## [2026-10-06] verify-gate-cleared | REQ-005-alumni-search-filters | findings: C0/M0; m9+t3 follow-up; 2 rounds
## [2026-10-06] implement-gate-cleared | REQ-005-alumni-search-filters
## [2026-10-06] architect-gate-cleared | REQ-005-alumni-search-filters
## [2026-10-06] work-path-set | REQ-005-alumni-search-filters | worktree at .worktrees/REQ-005-alumni-search-filters
## [2026-10-06] spec-gate-cleared | REQ-005-alumni-search-filters
## [2026-10-06] req-archived | REQ-004-alma-rebrand-auth-shell
## [2026-10-06] req-merged | REQ-004-alma-rebrand-auth-shell | PR #17 into redesign (4164e070)
## [2026-05-13] req-merged | REQ-042 added Firestore composite indexes for query path
## [2026-05-13] lesson | L-REQ-012-1 — declare composite indexes before deploy
## [2026-05-12] adr-accepted | ADR-003 chose direct SignalR client over BFF translation
## [2026-05-12] gotcha | G05 noted — Login.aspx URL-substring branching
```

## Entries

## [2026-10-06] config | git.protect=[main, master, release/*, redesign]
## [2026-10-06] req-merged | REQ-006-alumni-directory-page | PR #19
## [2026-10-06] req-archived | REQ-006-alumni-directory-page
## [2026-10-06] req-merged | REQ-005-alumni-search-filters | PR #18
## [2026-10-06] req-archived | REQ-005-alumni-search-filters
## [2026-10-06] config-budgets | context/conventions.md: 23888 B → 7336 B, moved verbatim to conventions-api.md (5066), conventions-frontend.md (7245), conventions-testing.md (5844)
## [2026-10-06] ship-gate-cleared | REQ-006-alumni-directory-page
## [2026-10-06] req-ready-to-merge | REQ-006-alumni-directory-page | /directory alumni directory page: URL-held search/filters/page, lazy route, Directory nav link (stacked on REQ-005)
## [2026-10-06] lesson | L-REQ-006-1..3 — URL-mirrored input own-write tracking, skeleton swaps strand focus, client copies of API limits
## [2026-10-06] gotcha | G25–G27 — Base UI Popover focus, list-page test traps, component and lint traps (G19 extended)
## [2026-10-06] concept | route-layout — updated for MainNav and the lazy directory route
## [2026-10-06] component | frontend — updated to REQ-006; conventions.md Frontend/Testing sections updated
## [2026-10-06] verify-gate-cleared | REQ-006-alumni-directory-page | findings: C0/M0/m5/t2 open (your-call); 11 fixed in 2 rounds
## [2026-10-06] config | git.mode=commit
## [2026-10-06] implement-gate-cleared | REQ-006-alumni-directory-page
## [2026-10-06] adr-accepted | ADR-08 route code splitting with lazy; list state in the URL
## [2026-10-06] architect-gate-cleared | REQ-006-alumni-directory-page
## [2026-10-06] spec-gate-cleared | REQ-006-alumni-directory-page
## [2026-10-06] work-path-set | REQ-006-alumni-directory-page | worktree at .worktrees/REQ-006-alumni-directory-page (off feat/REQ-005-alumni-search-filters)

<!-- Newest entries below this line, newest first. Each entry is a level-2 heading. -->

## [2026-10-06] ship-gate-cleared | REQ-004-alma-rebrand-auth-shell
## [2026-10-06] adr-accepted | ADR-06 config/ leaf layer, ADR-07 root layout + header-less auth pages
## [2026-10-06] req-ready-to-merge | REQ-004-alma-rebrand-auth-shell | Alma rebrand; full-page login/sign-up; RootLayout + AuthShell; config/ leaf; Logo, PasswordInput, compact theme toggle
## [2026-10-06] lesson | L-REQ-004-1..3 — app-wide effects in a root layout, check design colours against token pairs, update ADRs when code moves layers
## [2026-10-06] gotcha | G17–G20 — Tooltip on a Radio, hidden vs display, auth/shell test traps, index.html copies under test
## [2026-10-06] concept | route-layout — first captured
## [2026-10-06] adr-proposed | ADR-06 config/ leaf, ADR-07 root layout + header-less auth (ADR-03 amended)
## [2026-10-06] verify-gate-cleared | REQ-004-alma-rebrand-auth-shell | findings: C0/M1(vault)/m4 open (wrap-up/your call); 2 rounds
## [2026-10-06] implement-gate-cleared | REQ-004-alma-rebrand-auth-shell | 2 revisions (full-page auth layout; toggle/inputs/forgot placement)
## [2026-10-06] architect-gate-cleared | REQ-004-alma-rebrand-auth-shell
## [2026-10-06] work-path-set | REQ-004-alma-rebrand-auth-shell | branch at /Users/munifmubtashim/Alumni_System
## [2026-10-06] task-escalated-to-proceed | REQ-004-alma-rebrand-auth-shell | ~13 files across app/, features/auth, components/ui; design decisions taken
## [2026-10-06] req-archived | REQ-003-backend-route-auth
## [2026-10-06] req-merged | REQ-003-backend-route-auth | PR #16 into redesign (374891a9)
## [2026-10-06] ship-gate-cleared | REQ-003-backend-route-auth
## [2026-10-06] req-ready-to-merge | REQ-003-backend-route-auth | token on every non-public route, post ownership + partial edit, no password in responses, shared sendError, first backend test suite
## [2026-10-06] lesson | L-REQ-003-1..5 — partial workspace mocks, protect at router + app walker, migrate every handler to sendError, source alias needs typecheck, declare deps where imported
## [2026-10-06] gotcha | G02 rewritten (vitest hoisted to root); G13–G16 — pool mock path, requireId → 404, schema only in backups, packet exclude globs
## [2026-10-06] component | backend — first filled in
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
