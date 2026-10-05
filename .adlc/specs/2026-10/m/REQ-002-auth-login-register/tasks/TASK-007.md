# TASK-007 — Docs and full verification

| Field | Value |
|---|---|
| REQ | REQ-002 |
| Tier | 4 |
| Status | pending |
| Repo | alumni-system |
| Depends on | TASK-006 |
| Blocks | — |

## Goal

Docs describe the session and forms patterns, and every check passes from a clean build, with a browser smoke test.

## Files to touch

| Path | Action |
|---|---|
| `packages/frontend/README.md` | edit — auth/session, forms, new primitives |
| `CLAUDE.md` | edit — Frontend architecture subsection only (session/401 pattern, routes); NOT Conventions (redesign) |
| `.adlc/context/conventions.md` | edit — Frontend: forms rule (ADR-04), 401 handler rule (ADR-03) |
| `packages/frontend/src/components/ui/README.md` | edit — add Menu, SegmentedControl rows from TASK-003 notes |
| `packages/frontend/src/styles/contrast.test.ts` | edit — menu highlight pair |

## Approach

- Carry-overs from TASK-003: add the README rows listed in TASK-003 ## Notes to `components/ui/README.md`; add `ink-primary` on `accent-soft` (menu highlight) to `src/styles/contrast.test.ts`; fix conventions.md / frontend README lines saying only ThemeToggle uses Base UI (now Menu and SegmentedControl too).

- Read every task's ## Notes; document what was built (not the plan).
- Clean verification: `rm -rf packages/frontend/dist`, then typecheck, lint, format:check, `npx vitest run` twice, tokens:check, build; paste summaries into Notes.
- Smoke: with the API and DB running (`npm run dev:api`) + `npm run dev:frontend`, curl through the proxy: POST /api/auth/register (unique test email from a timestamp) → 201; POST /api/auth/login → 200 with a token; GET /api/me with it → 200. Test accounts only; do not print the token. Stop both servers and confirm ports 5173/3000 are free. If the DB isn't available, say so.

## Acceptance

- [ ] All six commands exit 0; smoke results recorded
- [ ] Docs mention: services/authApi, setUnauthorizedHandler + SessionBridge, guards, redirect-back via state only, forms rule and the revisit trigger, new primitives
- [ ] CLAUDE.md change limited to the Frontend architecture subsection

## Notes

The smoke test creates a real test account in the local dev DB (approved for local dev only). Name it e.g. `smoke+<timestamp>@example.test`.

## Related

- Architecture: [[specs/2026-10/m/REQ-002-auth-login-register/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-001-4]], [[knowledge/lessons/LESSON-REQ-001-5]], [[knowledge/lessons/LESSON-REQ-001-6]], [[knowledge/lessons/LESSON-REQ-001-7]], [[knowledge/lessons/LESSON-REQ-001-9]]; gotchas G05, G07
