# TASK-010 — Remove antd, full verification, update docs

| Field | Value |
|---|---|
| REQ | REQ-001 |
| Tier | 5 |
| Status | done |
| Repo | alumni-system |
| Depends on | TASK-009 |
| Blocks | — |

## Goal

antd is gone, every toolchain command passes on a clean install, and the repo docs describe the new frontend.

## Files to touch

| Path | Action |
|---|---|
| `packages/frontend/package.json` | edit — remove `antd`, `@ant-design/icons` |
| `package-lock.json` | regenerate (`npm install` from root) |
| `packages/frontend/README.md` | rewrite |
| `packages/frontend/.gitignore` | edit — add `coverage` (approved by user 2026-10-05) |
| `CLAUDE.md` (root) | edit — Commands section, "Frontend" architecture subsection, the Vite proxy note |
| `.adlc/context/conventions.md` | edit — TypeScript, Linting, Testing sections + new "Frontend" section |
| `.adlc/context/architecture.md` | edit — frontend row (React 19, structure) |

## Approach

- Remove both packages; `npm install`; `grep -rn "antd\|ant-design" packages/frontend --exclude-dir=node_modules` must be empty.
- Clean verification from scratch: `rm -rf packages/frontend/dist` then run `typecheck`, `lint`, `format:check`, `test`, `tokens:check`, `build`; record outputs in the task report. Then API + `npm run dev` + `curl localhost:5173/api/health`.
- **README.md (frontend)**: stack, scripts table, folder map (link folder READMEs), tokens workflow (`npm run tokens` after editing `tokens.json`), theme behavior, lint rules that enforce tokens, path alias.
- **Root CLAUDE.md**: replace "No test suite exists" and "No lint script…" lines with the new frontend scripts; replace the frontend architecture bullets (antd, `services/*Api.ts` per-call headers, `pages/`, no proxy) with the new structure, the single HTTP client, Query/Jotai split (ADR-02), Base UI + CSS Modules (ADR-01), and the `/api` dev proxy. **Leave the "Conventions (redesign)" section untouched.** Keep the backend sections untouched.
- **conventions.md**: TypeScript section → frontend's own flags (list them) and that it doesn't extend root; Linting → ESLint 9 + Stylelint + Prettier rules and the tokens-only/boundary rules; Testing → Vitest + RTL, co-located `*.test.tsx`, jsdom, matchMedia stub; new Frontend section → folder purposes, import boundaries, tokens workflow. Remove the "STATUS: needs verification" banners only on sections you rewrote from verified config.

## Acceptance

- [x] `npm ls antd` → empty; grep above → empty.
- [x] All six commands exit 0 on a fresh `npm install`; outputs pasted in the report.
- [x] Proxy check returns `{"status":"OK"}` (or the report states the API couldn't start locally and why).
- [x] Docs no longer mention antd, per-call auth headers, or "no test suite" for the frontend.

## Notes

### Implementation notes (2026-10-05)

- **antd removal:** deleted `antd` and `@ant-design/icons` from `package.json`; `npm install` from root, no peer warnings, no `--force`/`--legacy-peer-deps`. Lockfile: 64 entries removed (antd, `@rc-component/*`, `@ant-design/*`, dayjs, stylis, …), 0 added, 0 changed outside `packages/frontend` (path→version snapshot diff). Backend pins unchanged: express 4.22.2, pg 8.22.0, cors 2.8.6, dotenv 17.4.2, jsonwebtoken 9.0.3, bcrypt 6.0.0, root typescript 5.9.3, @types/node 20.19.43. `npm ls antd @ant-design/icons` → `(empty)`. React: one `node_modules/react` + one `node_modules/react-dom`, both 19.3.0. `grep -rn "antd\|ant-design" packages/frontend --exclude-dir=node_modules` → no matches. npm reports 11 audit findings (3 moderate, 8 high); not investigated (out of scope; not introduced by a removal).
- **`.gitignore`:** added `coverage` (user-approved).
- **Clean verification** (`rm -rf dist coverage`, then each script inside `packages/frontend`), all exit 0:
  - `typecheck` → `tsc -p tsconfig.app.json && tsc -p tsconfig.node.json`, no output
  - `lint` → `eslint . && stylelint "src/**/*.css" --allow-empty-input`, no output
  - `format:check` → `All matched files use Prettier code style!`
  - `test` → `Tests 131 passed (131)`; `npx vitest run` twice → `Test Files 15 passed (15)` / `Tests 131 passed (131)` both times
  - `tokens:check` → `src/styles/tokens.css is up to date`
  - `build` → `✓ built in 139ms` (JS 424.98 kB / gzip 137.51 kB, CSS 6.80 kB)
- **Proxy check:** `npm run dev:api` + `npm run dev:frontend` in the background; `curl -s localhost:5173/api/health` → `{"status":"OK"}`; `/` → 200. Killed the full process trees (npm → npm → tsx watch/vite → node); `lsof` on 5173/3000 then showed nothing listening.
- **Docs:** frontend README rewritten (Prettier-formatted). Root CLAUDE.md: Commands (frontend scripts replace "no test suite"/"no lint script"; added one line that backend/shared still have none) and the Frontend architecture subsection (incl. the proxy bullet) replaced; the subsection opens by saying it describes the new code, since the Architecture header still says "as it stood before the redesign". Conventions (redesign), backend sections and ADLC header untouched (diff hunks only at lines 32 and 71-80).
- **conventions.md:** Testing, TypeScript, Linting rewritten and new Frontend section added. TypeScript also covers backend/shared, re-verified from every tsconfig. Removed the two section banners **and** the file-top banner, which only covered those two sections. Other sections (Naming, Logging, …) left as template placeholders.
- **architecture.md:** frontend row updated; also the system-diagram label `services/authApi.ts` (deleted file) → `services/httpClient.ts → /api`. Its STATUS banners stay (sections not fully rewritten).
- `dist/` exists again after the build (git-ignored).

## Related

- Architecture: [[specs/2026-10/m/REQ-001-frontend-foundation/architecture]]
- Lessons checked: none exist yet
