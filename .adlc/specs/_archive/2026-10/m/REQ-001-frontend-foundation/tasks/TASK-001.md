# TASK-001 — Clear old src, install toolchain, tsconfigs, Vite config, folder skeleton

| Field | Value |
|---|---|
| REQ | REQ-001 |
| Tier | 0 |
| Status | complete |
| Repo | alumni-system |
| Depends on | — |
| Blocks | TASK-002, TASK-003 |

## Goal

`packages/frontend` has no old code, every dependency this REQ needs is installed at a verified version, tsconfigs/Vite config are in their final shape (alias + `/api` proxy), and the empty `src/` skeleton with folder READMEs exists and typechecks.

## Files to touch

| Path | Action |
|---|---|
| `packages/frontend/src/**` (all 63 tracked files) | delete |
| `packages/frontend/vite.config.js`, `.js.map`, `vite.config.d.ts`, `.d.ts.map`, `dist/` | delete (untracked build output) |
| `packages/frontend/package.json` | rewrite deps + scripts |
| `package-lock.json` (root) | regenerate via `npm install` from repo root |
| `packages/frontend/tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` | rewrite |
| `packages/frontend/vite.config.ts` | rewrite |
| `packages/frontend/src/main.tsx` | create (minimal: createRoot rendering a placeholder `<App/>` from `@/app/App`) |
| `packages/frontend/src/app/App.tsx` | create (placeholder, returns `null`; TASK-009 fills it) |
| `packages/frontend/src/{app,features,components/ui,store,services,styles,test}/README.md` | create |

## Approach

- **Dependencies** (exact majors; use `^` of the versions shown). deps: `react@19.3`, `react-dom@19.3`, `react-router@8`, `jotai@3`, `@tanstack/react-query@5`, `axios@1`, `@base-ui/react@1`, `@fontsource-variable/inter@5`, `@alumni/shared@*`, **keep `antd` and `@ant-design/icons` for now** (removed in TASK-010). devDeps: `typescript@~6.0.3`, `vite@8`, `@vitejs/plugin-react@6`, `@types/react@19`, `@types/react-dom@19`, `@types/node@24`, `eslint@^9.39`, `@eslint/js@^9.39`, `typescript-eslint@8`, `eslint-plugin-react-hooks@7`, `eslint-plugin-react-refresh`, `eslint-plugin-jsx-a11y@6`, `eslint-config-prettier@10`, `globals@17`, `prettier@3`, `stylelint@17`, `stylelint-config-standard@40`, `stylelint-declaration-strict-value@1`, `vitest@5`, `@vitest/coverage-v8@5`, `jsdom@^29.1` (**not 30** — jsdom 30 needs Node ≥24.15; 24.14.1 is installed), `@testing-library/react@16`, `@testing-library/dom@10`, `@testing-library/user-event@14`, `@testing-library/jest-dom`. Run `npm install` from the repo root. If any peer conflict appears, **stop and report** — do not use `--force`/`--legacy-peer-deps`.
- **package.json fields**: `"type": "module"` (ESM `eslint.config.js` / `stylelint.config.js` / `vite.config.ts` load without warnings or syntax errors), `"engines": { "node": ">=24.0" }`.
- **Scripts** exactly as listed in architecture.md → Toolchain (dev, build, preview, typecheck, lint, lint:fix, format, format:check, test, test:watch, test:coverage, tokens, tokens:check). `lint` must be `eslint . && stylelint "src/**/*.css" --allow-empty-input` (no CSS exists until TASK-004). Scripts whose config arrives later (lint, test, tokens) may fail until their task lands — that's expected.
- **tsconfigs**: do not extend `../../tsconfig.json`. `tsconfig.json` = references only. `tsconfig.app.json` = flags in architecture.md, `noEmit`, `paths: {"@/*": ["./src/*"]}`, include `src`. `tsconfig.node.json` = `vite.config.ts`, `scripts/**/*.ts`, `types: ["node"]`, `noEmit`, `allowImportingTsExtensions`, `checkJs: false`.
- **vite.config.ts**: `defineConfig` from `vitest/config`; `plugins: [react()]`; `resolve.alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }`; `server.proxy['/api'] = { target: \`http://localhost:${port}\`, changeOrigin: true }` where `port = loadEnv(mode, repoRoot, '').PORT ?? '3000'` (repoRoot = two levels up). Comment: only PORT is read. Leave a `test` block stub for TASK-003.

## Acceptance

- [ ] `git ls-files packages/frontend/src` lists only the new files; `grep -r "antd" packages/frontend/src` is empty.
- [ ] `npm ls react react-dom` shows 19.x; `npm ls --workspace=@alumni/frontend` reports no missing/invalid peers.
- [ ] `npm run typecheck` passes (zero errors) and creates no files next to source (`git status` shows no `vite.config.js`/`.d.ts`/`.map`).
- [ ] `npm run build` produces `dist/` and nothing else.
- [ ] With the API running (`npm run dev:api`), `npm run dev` + `curl -s localhost:5173/api/health` returns `{"status":"OK"}`.
- [ ] Each `src/` folder README states purpose + allowed imports (per architecture.md → Folder structure).

## Notes

`index.html` keeps `<script type="module" src="/src/main.tsx">`; TASK-006 adds the theme script. Don't create `features/theme` yet (TASK-006). `public/` stays. The old `README.md` is rewritten in TASK-010.

### Implementation notes (2026-10-04)

- **Installed versions:** react/react-dom 19.3.0, react-router 8.4.0, jotai 3.0.1, @tanstack/react-query 5.104.1, axios 1.20.0, @base-ui/react 1.8.0, typescript 6.0.3, vite 8.3.2, vitest 5.0.3, eslint 9.39.5, typescript-eslint 8.71.0, jsdom 29.1.1, @types/node 24.19.1. npm warns eslint 9.39.5 is "no longer supported" (deprecation notice only; ESLint 9 was chosen at the gate for jsx-a11y).
- **Lockfile had stale placements that broke the install twice.** (1) First `npm install` kept React 18.3.1 hoisted at the root (old lock placement), so root-hoisted libs (Base UI, TanStack Query, Jotai, RTL) resolved React 18 while the app used 19 — two Reacts. `npm dedupe` fixed it. (2) vite + vitest are nested in `packages/frontend/node_modules` (vitest's `@types/node` peer can't be met by the backend's `@types/node@20` at the root), but `@vitest/mocker` was hoisted to the root, where it can't see vite → `vitest run` crashed with `Cannot find package 'vite'`. Fixed by deleting the lockfile entries for `packages/frontend/node_modules/*`, `vite`, `vitest`, `@vitest/*`, `@vitejs/*` and re-running `npm install`; npm now nests `@vitest/mocker` next to vite. Backend versions in the lock (express, pg, cors, dotenv, jsonwebtoken, bcrypt, root typescript 5.9.3, @types/node 20) are unchanged. No `--force`/`--legacy-peer-deps`.
- **`baseUrl` dropped:** TS 6 errors on `baseUrl` (TS5101, deprecated). `paths` alone resolves relative to the tsconfig, so `@/*` works without it.
- **tsconfig.app.json** also sets `allowImportingTsExtensions` (needed with `noEmit` for `.ts` imports; harmless otherwise), `target ES2022`, `lib ES2023 + DOM`.
- **Harness smoke check:** a throwaway test (render + Jotai atom + QueryClientProvider + `@/` alias, jsdom env) passed under `vitest run --environment jsdom`, then was deleted. TASK-003 can build on this.
- **Proxy check:** ran `dev:api` and `dev:frontend` separately (equivalent to root `npm run dev`); `curl localhost:5173/api/health` → `{"status":"OK"}`; both processes stopped afterwards. The local DB was up.
- **Expected failures until later tasks:** `npm run lint` (no stylelint config yet; `eslint .` alone passes with the old config), `npm test` (no test files → exit 1), `npm run tokens` (no script yet).
- **`git ls-files packages/frontend/src`** still lists the 63 old files until the user stages the deletions (`git add -A packages/frontend`); in the working tree only the new files exist.

## Related

- Architecture: [[specs/2026-10/m/REQ-001-frontend-foundation/architecture]]
- Lessons checked: none exist yet
