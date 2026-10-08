# REQ-006-alumni-directory-page — Review Packet (round 2)

`Packet: 160KB · round 2 · 26 files in this round · fix commit bbdf907f only; excluded: .adlc/**`

## Round 2 — what changed since round 1

Round 1 findings (see verification.md) were fixed in commit bbdf907f. Fixed: UI-001 (focus after page change), CORR-001 (lost keystroke race), CORR-002 (control characters written to the URL), ARCH-001 (ESLint ban on static import of features/directory), ARCH-002 (comment naming backend limits), QUAL-001 (new VisuallyHidden component replaces copied CSS; the user chose this route), QUAL-003 (redundant contrast rows), QUAL-005 (FilterPopover CSS module), REFL-001/QUAL-006 (MainNav uses cx). Left open by user decision (needs-decision): QUAL-002, QUAL-004, REFL-002, REFL-003, UI-002. Not done (other implementer's file / trivial): year maxLength literal, duplicated magnifier SVG.

Re-check only these changes: that each fix closes its finding, and that the fix did not introduce a new problem. Spec and architecture are unchanged (read them from the round-1 packet or the REQ folder if needed).

## Diff with full context (fix commit bbdf907f vs b7901088)

```diff
diff --git a/CLAUDE.md b/CLAUDE.md
index d9d8d8c2..4ab2fcca 100644
--- a/CLAUDE.md
+++ b/CLAUDE.md
@@ -1,117 +1,117 @@
 # ADLC Toolkit — pipeline conventions
 
 This repository uses the **ADLC toolkit**: a spec-driven development pipeline with a human approval gate at every phase boundary. You are running inside Claude Code.
 
 **Knowledge vault:** `.adlc/` holds specs, architecture, conventions, decisions (ADRs), lessons, gotchas, and glossary. Read `.adlc/context/conventions.md`, `.adlc/context/project-overview.md`, and `.adlc/now.md` before non-trivial work. The toolkit itself lives at `.adlc-toolkit/`. Work records under `specs/`, `bugs/`, and `sprints/` may be flat or bucketed by month and author — `.adlc-toolkit/core/VAULT-LAYOUT.md` is the only place that grammar is written down; resolve paths through it rather than assuming a shape.
 
 **The seven principles (full text: `.adlc-toolkit/ETHOS.md`):**
 1. **You decide; the assistant drafts.** Every phase boundary pauses for the user. Git writes follow `.adlc/config.yml` → `git.mode` (default `manual` = the assistant drafts; you run git).
 2. **Spec first, code second.** Never implement without a validated spec.
 3. **Read-only reviewers.** Review/audit agents are read-only on your code — they write only their own findings, never source. The user decides what gets fixed.
 4. **Knowledge compounds.** Every change leaves the vault smarter — lessons, gotchas, concepts, ADRs.
 5. **Process is explicit.** Skill steps are a protocol, not a guideline. No shortcuts; no `--no-verify`.
 6. **Offer choices, don't ask open-ended questions.** When you need a decision from the user, present discrete labeled options with a recommendation. On Claude, use the `AskUserQuestion` tool; elsewhere, a short numbered list inline. The user can always go off-menu.
 7. **Speak plainly.** Everything shown to the user follows `.adlc-toolkit/core/VOICE.md`: everyday words, toolkit terms glossed on first use, machine tags beside a plain sentence, every option stating its consequence.
 
 **Git policy — set by `.adlc/config.yml` → `git.mode` (default `manual`):** In `manual`, never run git writes — read git state and draft the commit message, PR body, and merge checklist for the user. In `commit`, you may `git add`/`git commit` on the REQ's feature branch after that phase's gate is approved; in `commit+push`, you also `git push` that branch (fast-forward only). **Invariant in every mode:** only the REQ's own feature branch — never a protected branch (`git.protect`, e.g. main/master/release/*), never force-push, rebase, amend published commits, `reset --hard` away commits, delete branches, `gh pr create`/`gh pr merge`, or `--no-verify`. Where any skill or agent below says "the user commits" or "never commit," that is the `manual`-mode description.
 
 **Workflow:** `spec → architect → implement → review → wrapup`, each ending in a gate. Run the commands below, or the whole pipeline with `proceed`. Bugs use `bugfix`. **Small changes use `task`** — a slim two-gate pipeline that still writes a REQ to the vault and escalates to `proceed` if the work turns out large, so small work is never done outside the ADLC. See per-command stubs for how each maps in Claude Code.
 
 ---
 
 ## What this is
 
 Alumni System: an alumni networking/social platform (login, posts feed with comments, alumni profiles). npm workspaces monorepo with a React/Vite frontend, an Express/Postgres backend split into layered sub-packages, and a shared types package.
 
 ## Commands
 
 Run from the repo root unless noted.
 
 - `npm run dev` — runs both the API and frontend concurrently (dev only).
 - `npm run dev:api` — runs the API alone (`tsx watch server.ts` inside `packages/backend/src/api`), auto-reloads on change.
 - `npm run dev:frontend` — runs the Vite dev server alone (`packages/frontend`, port 5173; `/api` is proxied to the API, so start the API too).
 
 Frontend scripts, run inside `packages/frontend` (full list and details in `packages/frontend/README.md`):
 
 - `npm run build` — `npm run typecheck && vite build`. `npm run preview` serves the result.
 - `npm run typecheck` — `tsc` on `tsconfig.app.json` and `tsconfig.node.json` (both `noEmit`).
 - `npm run lint` / `lint:fix` — ESLint (type-aware) on TS/JS, then Stylelint on `src/**/*.css`.
 - `npm run format` / `format:check` — Prettier.
 - `npm test` — Vitest single run (`test:watch`, `test:coverage` also exist). Tests are co-located `*.test.ts(x)`.
 - `npm run tokens` — regenerate `src/styles/tokens.css` from `docs/design/design-system/tokens.json`; `tokens:check` exits 1 if it is stale.
 
 Backend tests (Vitest + supertest, ADR-05; no database needed):
 
 - `npm run test:backend` from the root, or `npm test` (`test:watch` also exists) inside `packages/backend`. One Vitest project (`packages/backend/vitest.config.ts`) covers `api`, `businessLogic` and `dal`; tests are co-located `*.test.ts`.
 - `npm run typecheck:backend` from the root, or `npm run typecheck` inside `packages/backend` — `tsc --noEmit` on `api`, `businessLogic` and `dal`, then on `tsconfig.test.json`, which also type-checks the test files (Vitest strips types without checking them).
 
 The backend and `@alumni/shared` have no lint or format scripts yet, and `@alumni/shared` has no tests.
 
 ### Rebuilding businessLogic/dal after editing them
 
 `@alumni/businesslogic`'s `package.json` points `main` at `./dist/index.js` (a compiled build), not its TypeScript source, so **the API process does not pick up changes to `packages/backend/src/businessLogic/src/**` until that package is recompiled** (`tsc` inside `packages/backend/src/businessLogic`, using its local `tsconfig.json`). `@alumni/dal`'s `main` points straight at `index.ts`, so `dal` changes are picked up live by `tsx watch` without a build step. When editing business logic, rebuild before assuming the running API reflects your change. The backend tests and `typecheck` don't need the rebuild: `vitest.config.ts` (alias) and `tsconfig.test.json` (`paths`) both resolve `@alumni/businesslogic` to its source, so neither a green test run nor a clean type-check says anything about whether `dist/` is current. The running API still needs it.
 
 ## Environment
 
 A single `.env` at the repo root is read by both the API server and the DB pool config (each loads it via a relative `dotenv.config({ path: ... })`, so the required relative path differs by file — see `packages/backend/src/api/server.ts` and `packages/backend/src/dal/config/db.ts`). Required vars: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `PORT`, `JWT_SECRET` (`server.ts` refuses to start without `JWT_SECRET`). Postgres is the only datastore (raw `pg` queries, no ORM/migration tool). Schema changes are hand-written, idempotent SQL files in `db/migrations/` applied with `psql -f` (there's no runner and no record of which migrations have run). The frontend's `vite.config.ts` also reads the root `.env`, but only `PORT` (for the `/api` dev proxy); nothing from it reaches browser code.
 
 ## Architecture
 
 > This section describes the code as it stood before the redesign. Where it disagrees with **Conventions (redesign)** below, the conventions win.
 
 ### Backend: strict layered pipeline
 
 `packages/backend/src` contains three independent npm workspaces that form one request pipeline. Each layer only imports from the layer directly below it via its workspace package name (never reach across a layer):
 
 ```
 routes (Express Router) → controllers → businessLogic Managers → dal Query classes → pg Pool
       @alumni/api                         @alumni/businesslogic         @alumni/dal
 ```
 
 - **`api/`** (`@alumni/api`) — Express app wiring. `app.ts` mounts routers under `/api/*`; `server.ts` is the entrypoint (`dotenv.config` + `app.listen`). `routes/*Routes.ts` map HTTP verbs/paths straight to named exports in `controllers/*Controller.ts`. Controllers parse `req`/`res`, construct DTOs, call a `*Manager`, and translate results into HTTP responses. Each handler's `catch` calls the shared `controllers/sendError.ts`: an `AppError` becomes its status + `{ message }`, anything else a 500 `{ message: "Something went wrong" }` (raw error text never reaches the client). There is still no Express error middleware (a later REQ). The `/auth/login` handler in `AuthRoutes.ts` uses `sendError` too (a wrong email or password is `AppError(401, "Invalid")`); `MeController` still has its own copy of `sendError` (known follow-up). `Middleware/authMiddleware.ts` (note the filename's mixed case: `authMIddleware.ts`) verifies the JWT and sets `req.user`; `Middleware/roleMiddleware.ts` (`requireRole(...roles)`) gates by `req.user.role`. `types/express.d.ts` augments `Express.Request` with `user: { sub, role }`. **Auth:** only `POST /api/auth/login`, `POST /api/auth/register` and `GET /api/health` are public. Every other router starts with `router.use(authMiddleware)`, so any route added to it is protected too. Admin-only routes add `requireRole("admin")` (`GET`/`POST /api/users`, `DELETE /api/users/:id`); `POST /api/alumni` adds `requireRole("alumni")`. Status codes: 401 = token problem only (missing, bad, expired; the frontend logs out on it, ADR-03), 403 = signed in but not allowed, 404 = missing. Ownership checks live in the Managers, not controllers or routes: posts and comments are owner-or-admin; a user's own account and alumni profile are owner-only (admins included). `routes/routeGuard.test.ts` walks every route on the Express app and fails if one outside the public list answers without a token. **`GET /api/alumni`** (signed in) takes `q` (name, company or job title, case-insensitive substring), `department`, `university` (both whole-value, case-insensitive), `graduationYear` (4 digits, 1900 to now + 10), `page` (default 1, max 10000) and `pageSize` (default 20, max 100), and returns `{ items, total }`; bad values, repeated or nested params answer 400, empty values mean absent, unknown params are ignored (details: `.adlc/context/conventions.md` → Pagination).
 - **`businessLogic/`** (`@alumni/businesslogic`) — one `*Manager` class per domain (`PostManager`, `CommentManager`, `AlumniManager`, `UserManager`), each a thin pass-through to a corresponding `dal` `*Query` class. This is where business rules go: ownership (`PostManager` and `CommentManager` check owner-or-admin and throw `AppError` 404/403), validation, password hashing and checks (`UserManager` owns them: register, createUser, changeMyPassword, the login compare) and cross-entity rules (e.g. `PostManager.updateCommentCount`); many methods are still 1:1 delegations. `TestManager.ts` is scratch/manual-test code (commented-out calls), not a real module.
 - **`dal/`** (`@alumni/dal`) — data access. `config/db.ts` creates the single shared `pg.Pool`. `dto/*DTO.ts` are plain classes (constructor-based, `id!: number` set after construction) implementing `BaseDTO`; they double as the shape passed into `Query` methods and as parsed rows returned from queries — controllers build a DTO instance even for read/delete calls just to carry an id. `query/*Query.ts` hold the raw parameterized SQL (`pool.query('...', [params])`) — this is the only place SQL should live. `index.ts` re-exports the public DTOs/Queries other packages should import.
 
 Each backend sub-package is its own workspace with its own `package.json`/`tsconfig.json` (extending the root `tsconfig.json`), and is linked into the root `node_modules/@alumni/*` via npm workspace symlinks — import via the package name (`@alumni/businesslogic`, `@alumni/dal`), never by relative path across package boundaries.
 
 ### Shared types
 
 `packages/shared` (`@alumni/shared`) exports plain TypeScript interfaces/types (`alumni.types.ts`, `comment.types.ts`, `post.types.ts`, `user.types.ts`) consumed by the frontend for API response shapes (e.g. `import type { Post } from "@alumni/shared"`). It has no runtime code. Note this is a parallel, separate type surface from the backend's `dal` DTOs (classes with constructors) — they aren't the same types, so keep them in sync manually when a shape changes.
 
 ### Frontend
 
 `packages/frontend` was rebuilt from scratch in REQ-001 (this subsection describes the new code, not the pre-redesign one). The product is branded **Alma** (REQ-004). React 19 + Vite 8 + TypeScript 6 (own strict tsconfigs, not extending the root), ESM package. Details: `packages/frontend/README.md`.
 
-- **Structure** (`src/`, each folder has a README with its import rules): `app/` (App, providers, router, `queryClient.ts`, `RootLayout`, `AuthShell` and `AppShell` layouts, `MainNav`, `HydrateFallback`, `RouteError`), `config/` (app-wide constants: `brand.ts` with `BRAND_NAME`, `SUPPORT_EMAIL`, `supportMailto`), `features/` (one folder per domain: `theme/`, `auth/`, `home/`, `directory/`), `components/ui/` (primitives: Button, ButtonLink, Input, PasswordInput, Logo, Card, Tag, Alert, Menu, SegmentedControl, ThemeToggle, Avatar, Chip, Skeleton, SearchField, Popover), `store/` (Jotai atoms), `services/` (`httpClient.ts`, `authToken.ts`, `authApi.ts`, `alumniApi.ts`), `styles/` (generated `tokens.css`, `global.css`), `test/` (Vitest setup). Path alias `@/` → `src/`.
+- **Structure** (`src/`, each folder has a README with its import rules): `app/` (App, providers, router, `queryClient.ts`, `RootLayout`, `AuthShell` and `AppShell` layouts, `MainNav`, `HydrateFallback`, `RouteError`), `config/` (app-wide constants: `brand.ts` with `BRAND_NAME`, `SUPPORT_EMAIL`, `supportMailto`), `features/` (one folder per domain: `theme/`, `auth/`, `home/`, `directory/`), `components/ui/` (primitives: Button, ButtonLink, Input, PasswordInput, Logo, Card, Tag, Alert, Menu, SegmentedControl, ThemeToggle, Avatar, Chip, Skeleton, SearchField, Popover, VisuallyHidden), `store/` (Jotai atoms), `services/` (`httpClient.ts`, `authToken.ts`, `authApi.ts`, `alumniApi.ts`), `styles/` (generated `tokens.css`, `global.css`), `test/` (Vitest setup). Path alias `@/` → `src/`.
 - **Import boundaries** are lint-enforced (with a test per boundary): `components/ui/` may not import services, store, features, config, app, axios or TanStack Query (brand text reaches `Logo` as a prop); `services/` may not import React, components, store, features or app; `store/` may not import services, features or app; `config/` is a leaf (may not import app, features, components, store or services); nothing in `features/`, `store/`, `services/` or `components/` imports `app/` (only `main.tsx` does; test files may import `app/` providers).
 - **HTTP:** one axios instance, `services/httpClient.ts` (`baseURL: '/api'`). Its single request interceptor adds `Authorization: Bearer <token>` from `services/authToken.ts` (`localStorage['token']`, the only home of the token). Call sites never build auth headers. Endpoint functions live in `services/` (`authApi.ts`: `login`, `register`, `getMe`; `alumniApi.ts`: `searchAlumni`).
 - **Session and 401s (ADR-03):** `authToken.ts` is subscribable (`subscribe`, also fires on another tab's `storage` change) and has `isTokenExpired` / pure `getLiveToken`. `httpClient`'s response interceptor calls the one handler registered with `setUnauthorizedHandler(fn)` on a 401 from a request that carried a token (not `/auth/login`/`/auth/register`), passing that token; `services/` never imports app code. `features/auth/SessionBridge` (mounted once in `app/RootLayout`, above both shells) registers it and acts only if the token still matches: clear token, set `sessionNoticeAtom`, go to `/login`. It also drops an expired token on load and clears the query cache on any token change. Current user is the `['me']` query (`useCurrentUser`); login/register mutations only store the token. `App.tsx` must import `RouterProvider` from `react-router/dom` (flushSync, one redirect).
 - **State (ADR-02):** server data goes through TanStack Query (shared `QueryClient` in `app/queryClient.ts`); Jotai atoms in `store/` hold client-only state (e.g. `themePreferenceAtom`, persisted under `localStorage['alumni.theme']`).
 - **UI (ADR-01):** no third-party component library. Primitives are our own components styled with CSS Modules that may use only design tokens (`var(--…)`), enforced by Stylelint and ESLint. Base UI (headless) supplies behavior where needed: `Menu`, `SegmentedControl` (which `ThemeToggle` is built on), the Tooltip on icon-only segments and `Popover`. `ThemeToggle` has `variant` `full` (words; the `AppShell` header) and `compact` (icons named Light / Dark / System, with a tooltip; `AuthShell`). Forms (ADR-04) use controlled state, pure validators in `features/<x>/validation.ts` and `useMutation`; no form library until a form passes ~8 fields. Tokens are generated from `docs/design/design-system/tokens.json` by `npm run tokens`. `public/favicon.svg` is the one design asset with raw hex (the browser can't apply tokens to it; copied from `docs/design/brand/`).
 - **Routing:** React Router 8 data router (`react-router`). The path-less `RootLayout` at `/` applies the theme and mounts `SessionBridge` once for every page, and holds two shells: `AuthShell` (no header, only a compact top-right theme toggle) for `GuestOnly` → `/login`, `/register` (a signed-in user is sent on), and `AppShell` (header) for `RequireAuth` → `/` (Home; a guest goes to `/login`) and `/directory`, `*` and test pages. Two `errorElement` layers on each branch: the outer one on `/` catches shell crashes; an inner pathless route in each shell shows `RouteError` inside its `<main>` for page errors. Redirect-back after login uses only `location.state.from` (never a URL parameter), checked by `resolveFrom`. The `AppShell` header shows the `Logo` (linking home), Log in / Sign up for guests, and when signed in `MainNav` (`<nav aria-label="Main">`, a "Directory" link marked current on `/directory` and below; on phones it wraps under the brand, no bottom tab bar) and a user Menu with Log out. Log-in and sign-up have no header and share `features/auth/AuthLayout` (full-height 45/55 split from 60rem: brand panel with logo, headline, points and ©; the form, no card, with the heading and its prompt line on top; below 60rem only the panel's logo row); "Forgot password?" shows a support mailto message, no reset flow.
-- **Lazy routes (ADR-08):** large pages load with the route's `lazy`, so each is its own chunk; Home stays eager. `/directory` is the first: `DIRECTORY_ROUTE` in `app/router.tsx` does `import('@/features/directory/DirectoryPage')`, and nothing else in `src/` may import `features/directory` statically (it has no `index.ts`; `app/lazyRoutes.test.ts` reads every non-test file outside that folder and fails on one). `HydrateFallback` ("Loading…" in `<main>`) must be a static property of the lazy route object itself: the router stops rendering at the nearest route with a fallback, so on the root it would hide the shell. A chunk that fails to load shows the inner `RouteError`. Check with `npm run build` that the page is a separate chunk in `dist/assets`.
+- **Lazy routes (ADR-08):** large pages load with the route's `lazy`, so each is its own chunk; Home stays eager. `/directory` is the first: `DIRECTORY_ROUTE` in `app/router.tsx` does `import('@/features/directory/DirectoryPage')`, and nothing else in `src/` may import `features/directory` statically (it has no `index.ts`; an ESLint rule bans it outside that folder and tests, `import type` excepted, and `app/lazyRoutes.test.ts` reads every non-test file outside that folder and fails on one). `HydrateFallback` ("Loading…" in `<main>`) must be a static property of the lazy route object itself: the router stops rendering at the nearest route with a fallback, so on the root it would hide the shell. A chunk that fails to load shows the inner `RouteError`. Check with `npm run build` that the page is a separate chunk in `dist/assets`.
 - **Directory (REQ-006):** `features/directory` lists alumni from `GET /api/alumni`, 12 per page. Search text, filters and page live in the URL query string (ADR-08), parsed by the pure `params.ts`, which ignores any value the API would reject; filters and pages push history, typed search replaces the URL after 300 ms. `useAlumniSearch` is the TanStack Query hook. States: skeletons, error with Retry, no matches with Clear filters, no alumni yet, page past the end.
 - **Dev proxy:** `vite.config.ts` proxies `/api` to `http://localhost:<PORT>` (`PORT` read from the root `.env`, default 3000; nothing else from that file reaches the client). Run the API alongside Vite (root `npm run dev`).
 
 ## Conventions (redesign)
 
 ### Workflow
 - Use the ADLC pipeline (/spec, /architect, /implement, /review, /wrapup).
 - Never write code before the spec and architecture gates are approved.
 
 ### Backend
 - npm workspaces; layers stay routes -> controllers -> Managers -> Query classes.
 - Controllers are classes; routes bind instance methods.
 - One shared error middleware; no per-method try/catch for HTTP mapping.
 - Every non-public route uses authMiddleware, plus requireRole where needed.
 
 ### Frontend
 - React + Vite + TypeScript, rebuilt from scratch.
 - State: server data via TanStack Query; client-only state in Jotai atoms in src/store/ (ADR-02).
 - UI: no styled component kit. Own primitives in src/components/ui/ styled with CSS Modules on design tokens; Base UI (headless) for complex behavior (ADR-01). New libraries are approved at the architect gate.
 - Scandinavian design: neutral palette, generous whitespace, clean typography, few accents.
 - Theme: light, dark, system; toggle in header; choice persisted; follows prefers-color-scheme in system mode.
 - All colors/spacing/type come from design tokens; no hardcoded values in components.
 - Designs live in docs/design/ (Claude Design bundle); follow them.
 - Responsive from 360px up; no layout breaks at 200% zoom.
 - Components get typed props from @alumni/shared; no API calls inside UI components.
diff --git a/packages/frontend/README.md b/packages/frontend/README.md
index 113f7318..5edd9ca1 100644
--- a/packages/frontend/README.md
+++ b/packages/frontend/README.md
@@ -1,193 +1,193 @@
 # @alumni/frontend
 
 Alma, the alumni network web app: React 19 + Vite 8 + TypeScript 6. It has a shell (header with the Alma logo and name, log-in/sign-up links or a user menu, and a theme toggle), log-in and sign-up pages (a brand panel beside the form on wide screens), a signed-in Home page and the alumni Directory (search, filters, pages), on top of the design system. Feed and profiles come in later REQs.
 
 ## Stack
 
 | Concern       | Choice                                                                    | Why / note                                                                   |
 | ------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
 | UI runtime    | React 19.3, React DOM 19.3                                                | React Router 8 needs ≥ 19.2.7                                                |
 | Build         | Vite 8, `@vitejs/plugin-react` 6                                          | Dev server proxies `/api` to the API                                         |
 | Types         | TypeScript **6.0** (not 7)                                                | `typescript-eslint` 8.71 supports TS < 6.1; TS 7 would break type-aware lint |
 | Routing       | React Router 8 (`react-router`, data router)                              |                                                                              |
 | State         | Jotai 3 (client-only state), TanStack Query 5 (server state)              | ADR-02                                                                       |
 | HTTP          | axios, one instance (`src/services/httpClient.ts`)                        | Attaches the auth header in one interceptor                                  |
 | UI behavior   | Base UI (`@base-ui/react`), headless                                      | ADR-01. Used by `Menu`, `SegmentedControl` (so `ThemeToggle`) and `Popover`  |
 | Styling       | CSS Modules + design tokens (CSS custom properties)                       | No component library; no raw colors or shadows                               |
 | Font          | Inter, self-hosted via `@fontsource-variable/inter`                       | No third-party font request                                                  |
 | Lint / format | ESLint **9** (not 10), Stylelint 17, Prettier 3                           | `eslint-plugin-jsx-a11y` only supports ESLint ≤ 9                            |
 | Tests         | Vitest 5, React Testing Library 16, user-event 14, jest-dom, **jsdom 29** | jsdom 30 needs Node ≥ 24.15; jsdom is pinned to 29 so Node 24.14 works       |
 
 The package is ESM (`"type": "module"` in `package.json`) so the `.js` lint configs load as modules. It needs Node 24 or later (`engines.node`): `npm run tokens` runs a `.ts` file directly with Node's built-in type stripping (no `tsx`/`ts-node`).
 
 ## Scripts
 
 Run inside `packages/frontend` (or from the repo root with `--workspace=packages/frontend`).
 
 | Script                  | What it does                                                                               |
 | ----------------------- | ------------------------------------------------------------------------------------------ |
 | `npm run dev`           | Vite dev server on port 5173; `/api` is proxied to the API (see below)                     |
 | `npm run build`         | `typecheck`, then `vite build` into `dist/`                                                |
 | `npm run preview`       | Serve the production build locally                                                         |
 | `npm run typecheck`     | `tsc` on `tsconfig.app.json` (app code) and `tsconfig.node.json` (Vite config, `scripts/`) |
 | `npm run lint`          | ESLint on all TS/JS, then Stylelint on `src/**/*.css`                                      |
 | `npm run lint:fix`      | Same, with auto-fix                                                                        |
 | `npm run format`        | Prettier, write                                                                            |
 | `npm run format:check`  | Prettier, check only                                                                       |
 | `npm test`              | Vitest, single run                                                                         |
 | `npm run test:watch`    | Vitest, watch mode                                                                         |
 | `npm run test:coverage` | Vitest with a v8 coverage report in `coverage/` (git-ignored)                              |
 | `npm run tokens`        | Regenerate `src/styles/tokens.css` from `docs/design/design-system/tokens.json`            |
 | `npm run tokens:check`  | Exit 1 if `tokens.css` is out of date (for CI)                                             |
 
 From the repo root, `npm run dev` starts the API and this dev server together; `npm run dev:frontend` starts this one alone.
 
 ### Dev proxy
 
 API calls use relative paths under `/api` (the axios instance has `baseURL: '/api'`). In dev, `vite.config.ts` proxies `/api` to `http://localhost:<PORT>`, where `PORT` comes from the repo-root `.env` (default 3000). Only `PORT` is read from that file, and only inside the Vite config; nothing else in it reaches the browser. Start the API too, or `/api` calls fail with a proxy error.
 
 ## Folder map
 
 ```
 packages/frontend/
   index.html          <title>Alma</title>, inline no-flash theme script, then /src/main.tsx
   public/             favicon.svg (copied from docs/design/brand/; the one raw-hex design asset)
   scripts/            generate-tokens.ts (+ test), enforcement.test.ts (lint rules self-test)
   src/
     main.tsx          imports the font, tokens.css, global.css (in that order), renders <App/>
     app/              App, providers, router, QueryClient, RootLayout, AuthShell and AppShell layouts,
                       MainNav, HydrateFallback, RouteError
     config/           app-wide constants: brand.ts (BRAND_NAME, SUPPORT_EMAIL, supportMailto)
     features/         one folder per domain: theme/, auth/ (session, guards, pages), home/,
                       directory/ (lazy-loaded alumni directory page)
     components/ui/    design-system primitives: Button, ButtonLink, Input, PasswordInput, Logo,
                       Card, Tag, Alert, Menu, SegmentedControl, ThemeToggle, Avatar, Chip,
                       Skeleton, SearchField, Popover
     store/            Jotai atoms for client-only state (themeAtom, sessionNoticeAtom)
     services/         httpClient (axios), authToken (token in localStorage), authApi, alumniApi
     styles/           tokens.css (generated), global.css, contrast test
     test/             Vitest setup and harness smoke test
 ```
 
 Each folder's README says what belongs there and what may import it:
 [app](src/app/README.md) · [config](src/config/README.md) · [features](src/features/README.md) · [components/ui](src/components/ui/README.md) · [store](src/store/README.md) · [services](src/services/README.md) · [styles](src/styles/README.md) · [test](src/test/README.md)
 
 **Path alias:** `@/` means `src/` (`import { Button } from '@/components/ui/Button'`). It is declared in `tsconfig.app.json` (`paths`) and in `vite.config.ts` (`resolve.alias`); Vitest reads the Vite config, so the editor, typecheck, build and tests all agree.
 
 **Import boundaries** (enforced by ESLint for both `@/…` and relative paths):
 
 - `components/ui/` must not import `services/`, `store/`, `features/`, `config/`, `app/`, `axios` or `@tanstack/react-query`. Primitives are props in, events out (the brand name reaches `Logo` as a prop).
 - `services/` must not import React, `components/`, `store/`, `features/` or `app/`. Services return data to the caller.
 - `store/` must not import `services/`, `features/` or `app/`. Features wire atoms to services.
 - `config/` is a leaf: it must not import `app/`, `features/`, `components/`, `store/` or `services/`. `app/` and `features/` read it.
 - Nothing in `features/`, `store/`, `services/` or `components/` may import `app/` (in practice only `main.tsx` does). Test files (`*.test.ts(x)`) are exempt from this one ban only, so tests may import `app/` providers to render a component.
 
 **Server state vs client state (ADR-02):** data from the API goes through TanStack Query, using the shared `QueryClient` from `app/queryClient.ts` (30 s stale time, no refetch on window focus, up to 2 retries but never on a 4xx). Jotai atoms in `store/` hold client-only state. The auth token lives only in `services/authToken.ts` (`localStorage['token']`), never in an atom; `httpClient` adds `Authorization: Bearer <token>` in its one request interceptor, so call sites never build auth headers.
 
 **Route errors:** the router has two `errorElement` layers on each branch. The outer one, on the `/` root layout, catches a crash in a shell itself (the shell is gone). The inner one, on a pathless child route inside each shell (`AuthShell`, `AppShell`), catches page errors and shows `RouteError` inside that shell's `<main>`.
 
 ## Auth and session
 
 ADR-03. Log in, sign up (student or alumni), stay signed in across reloads, log out, and get sent to `/login` with a notice when the session ends.
 
 - **Routes** (`app/router.tsx`): `GuestOnly` wraps `/login` and `/register`; `RequireAuth` wraps `/` (Home) and `/directory`. An unknown path shows the empty shell. `RootLayout` holds two shells: `AuthShell` (no header, theme toggle top-right) for `/login` and `/register`, `AppShell` (header) for everything else.
 - **Endpoints:** `services/authApi.ts` has `login`, `register` and `getMe` (`GET /me`). They only return data.
 - **Token store:** `services/authToken.ts` keeps the token in `localStorage['token']`. `subscribe(listener)` fires on `setToken`/`clearToken` and on another tab's change. `isTokenExpired(token)` decodes the JWT `exp` (10 s leeway; a malformed token counts as expired). `getLiveToken()` returns the token only if it is present and not expired, with no side effects. `features/auth` reads it with `useLiveToken()` / `useHasSession()` (`useSyncExternalStore`).
 - **401s:** `httpClient` has one response interceptor. On a 401 from a request that carried a token (not `/auth/login` or `/auth/register`), it calls the handler registered with `setUnauthorizedHandler(fn)`, passing that request's token, then re-throws. `services/` never imports app or feature code.
 - **SessionBridge** (`features/auth/SessionBridge.tsx`, mounted once in `app/RootLayout`, above both shells, renders nothing):
   1. on load, silently drops a stored token that has expired;
   2. registers the 401 handler, which acts only if the failed request's token is still the current one (so a burst of 401s, or a late 401 after logout, causes one redirect at most): clear the token, set `sessionNoticeAtom` to `'expired'`, go to `/login` with `state.from`;
   3. clears the whole query cache whenever the token changes (login, logout, another tab), so no previous user's data is shown.
 - **Current user:** `useCurrentUser()` is the `['me']` query, enabled only with a live token. There is no atom copy.
 - **Login and sign-up:** `useLogin` / `useRegister` only store the token and clear the notice. They do not fetch `/me` or navigate; `GuestOnly` sees the token and sends the user on.
 - **Guards:** `RequireAuth` sends a guest to `/login` (saving the location as `state.from`), shows "Loading…" while `['me']` loads, and on a non-401 error shows an Alert with Retry and Log out. `GuestOnly` sends a signed-in user to `resolveFrom(location.state) ?? '/'`.
 - **Redirect-back** uses only `location.state.from`, never a URL parameter, so a crafted link can't redirect off-site. `resolveFrom` accepts only an app path (one leading `/`, not `/login` or `/register`).
 - **Logout:** `useLogout()` clears the token first, then goes to `/login`; the bridge clears the cache. The header menu and the RequireAuth error state both offer it.
 - **Session notice:** `LoginPage` shows "Your session has expired, please log in again" and clears it when it unmounts.
 - **`react-router/dom`:** `App.tsx` imports `RouterProvider` from `react-router/dom`, not `react-router`. The bridge and `useLogout` navigate with `flushSync: true`; without the DOM provider, `RequireAuth` fires a second redirect. Tests that check navigation counts must use it too.
 
 ## Directory and lazy routes
 
 REQ-006, ADR-08. `/directory` (signed in; the header's "Directory" link) lists alumni from `GET /api/alumni`, 12 per page.
 
-- **Lazy route:** `app/router.tsx` loads the page with the route's `lazy` (`import('@/features/directory/DirectoryPage')`), so it is a separate chunk in `dist/assets`. Nothing else may import `features/directory` statically; `src/app/lazyRoutes.test.ts` reads every file in `src/` (except that folder and tests) and fails if one does. New large pages follow the same pattern; Home stays eager.
+- **Lazy route:** `app/router.tsx` loads the page with the route's `lazy` (`import('@/features/directory/DirectoryPage')`), so it is a separate chunk in `dist/assets`. Nothing else may import `features/directory` statically: ESLint rejects it (tests and `import type` excepted), and `src/app/lazyRoutes.test.ts` reads every file in `src/` (except that folder and tests) and fails if one does. New large pages follow the same pattern; Home stays eager.
 - **`HydrateFallback`** ("Loading…" in `<main>`) is a static property of the `directory` route object itself. The router stops rendering at the nearest route with a fallback, so on the root it would hide the shell. A click from another page shows no fallback; a chunk that fails to load shows `RouteError` inside the shell.
 - **URL is the state:** search text, department, university, graduation year and page live in the query string, so a reload, a shared link and back/forward all work. `features/directory/params.ts` parses it (pure, tested) and ignores any value the API would reject. Filters and page changes push a history entry; typed search replaces the URL after 300 ms, and an outside change (Back, Clear all) cancels a pending write.
 - **States:** skeleton cards while loading, an error with Retry, "no matches" with Clear filters, "No alumni yet", and a page past the end with a way back to page 1. The count line ("Showing 1–12 of 40 alumni", "40 alumni" on phones) is a polite live region.
 - **Header:** `MainNav` shows the Directory link to signed-in users only, marked current on `/directory` and below. On phones it wraps under the brand (no bottom tab bar yet).
 
 ## Forms
 
 ADR-04: no form library for now.
 
 - Controlled state in the page component.
 - Pure, tested validators in `features/<x>/validation.ts` (`validateLogin`, `validateRegister(values, now)`) return a field → message map. Rules and messages mirror the backend (password at least 8 characters and at most 72 UTF-8 bytes, length limits, expected year from this year to this year + 8).
 - On submit with errors: show them per field (`Input error`) and focus the first invalid field. Otherwise call the `useMutation`. The submit button gets `loading` (disabled, `aria-busy`), so it can't be pressed twice.
 - Server errors go through a pure mapper (`features/auth/authErrors.ts`): login 401 → form Alert "Email or password is incorrect"; sign-up 409 → email field error with a "Log in instead" link; 400 → its message; network or 5xx → "Couldn't reach the server, try again".
 - Fields hidden by the role switch keep their values but are not validated or sent (`toRegisterInput`).
 - **Revisit** when a form passes about 8 fields or needs dynamic field arrays (likely My Profile): pick React Hook Form + Zod, or move validation into `@alumni/shared`.
 
 ## Primitives added in REQ-002
 
 - `Input` `error` prop: `aria-invalid`, error text linked by `aria-describedby`, error border.
 - `Button` `loading` prop: disabled, `aria-busy`, label kept, pulsing dot. `ButtonLink`: Button styles on a react-router `Link`.
 - `Alert`: `tone="error"` (`role="alert"`) or `"info"` (`role="status"`), optional title.
 - `Menu`, `MenuItem`, `MenuLabel`: Base UI Menu; keyboard support; no shadow.
 - `SegmentedControl<T>`: Base UI RadioGroup; `ThemeToggle` is a thin wrapper over it.
 
 ## Brand and primitives added in REQ-004
 
 - The product is **Alma**. The name, support email and `supportMailto(subject)` live in `src/config/brand.ts`; nothing else in `src/` hardcodes them (`index.html`'s `<title>` is static text).
 - `Logo`: inline-SVG mark coloured by tokens, with optional wordmark. Props `label`, `showWordmark`, `decorative`, `size`. The header shows it as a link home.
 - `PasswordInput`: `Input` with a show/hide button whose `aria-label` flips; focus stays in the field.
 - `Input` gained `endAdornment` (a control inside the field's end edge).
 - Auth pages share `features/auth/AuthLayout`: a brand panel on `--surface-sunken` beside the form card from 60rem up, hidden below. "Forgot password?" on log-in (`ForgotPasswordHelp`) shows a message with a mailto link to support; there is no reset flow yet.
 
 ## Design tokens
 
 `docs/design/design-system/tokens.json` is the single source for colors, spacing, type, radii and motion (`--duration-fast`, `--easing-standard`). `scripts/generate-tokens.ts` turns it into `src/styles/tokens.css`: CSS custom properties for both themes.
 
 - Spacing and type sizes/line-heights are emitted in **rem** (px ÷ 16), so they follow the user's browser font-size setting. Radii stay in px.
 - Type styles are `font` shorthands: write `font: var(--text-label)`.
 - Light values sit on `:root` and `:root[data-theme='light']`; dark values on `:root[data-theme='dark']`.
 
 To change a token:
 
 1. Edit `docs/design/design-system/tokens.json`.
 2. Run `npm run tokens`.
 3. Run `npm test`. `scripts/generate-tokens.test.ts` fails if `tokens.css` is stale, and `src/styles/contrast.test.ts` fails if a text/background pair drops below WCAG contrast.
 
 Never edit `tokens.css` by hand. `npm run tokens:check` and the test both catch it.
 
 `public/favicon.svg` is the one design asset with raw hex colors: the browser draws it outside the page, so it can't read CSS variables. It is copied as-is from `docs/design/brand/favicon.svg` and sits outside the linted `src/`.
 
 The light accent was darkened at the architecture gate (`accent` `#975c43`, `accent-strong` `#7a4734`) so button labels and links reach 4.5:1. One recorded exception: the Input's resting border (`border-strong`, against both its `surface-sunken` fill and `surface-page`) is below 3:1 in both themes; the label and the sunken fill mark the field. The contrast test pins both pairs at their recorded ratios, fails if either gets worse, and fails if a pair ever starts passing, so the exception gets removed.
 
 ### Rules that enforce tokens
 
 - **Stylelint** (`src/**/*.css`): no hex colors, no named colors, no color functions (`rgb()`, `hsl()`, `oklch()`, …), no `box-shadow`/`text-shadow`. Color, background, font, font-size/weight, line-height, padding, margin, gap and border-radius must use `var(--…)` (or a keyword such as `0`, `inherit`, `transparent`, `none`, `auto`). CSS Module class names are camelCase. `tokens.css` is exempt: it is generated and is where raw values live.
 - **ESLint** (`src/**/*.{ts,tsx}`, except `src/styles/`): no raw color strings in TS/TSX and no `boxShadow` in a JSX `style` prop.
 - Motion tokens are a convention, not a lint rule: write `transition: … var(--duration-fast) var(--easing-standard)`, but a raw `0.2s` still lints clean.
 - `scripts/enforcement.test.ts` lints deliberately bad fixtures to prove both rule sets still fire.
 
 ## Theme
 
 Three choices: Light, Dark, System, picked with the toggle in the header.
 
 - The choice is stored in `localStorage['alumni.theme']` as JSON (`themePreferenceAtom` in `src/store/themeAtom.ts`). An unknown or garbled value reads back as `system`. Storage that throws (private mode) never breaks the app; the choice just isn't saved.
 - `useApplyTheme` (`src/features/theme/`) sets `data-theme="light|dark"` on `<html>`. In System mode it follows `prefers-color-scheme` and updates live when the OS setting changes.
 - **No flash:** an inline script in `index.html` reads the same key and sets `data-theme` before first paint. The key appears in both places; `src/store/themeAtom.test.ts` checks they match.
 
 ## Primitives added in REQ-006
 
 - `Avatar` (photo or initials), `Chip` (active filter with a remove button), `Skeleton` (loading placeholder), `SearchField` (search input with icon and hidden label), `Popover` (Base UI Popover with a pill trigger). Details in [components/ui](src/components/ui/README.md).
 
 ## Testing
 
 - Tests sit next to the code: `Button.tsx` → `Button.test.tsx`.
 - Default environment is jsdom. `src/test/setup.ts` adds the jest-dom matchers, a controllable `matchMedia` stub (`setPrefersDark` from `@/test/setup`), and resets localStorage, `data-theme` and the stub before and after every test.
 - Tests in `scripts/` run in Node: their first line must be `// @vitest-environment node`. Vitest 5 has no `environmentMatchGlobs`, so without that line they run in jsdom.
 - Vitest globals are off: import `describe`/`it`/`expect` from `vitest`.
 - CSS Module class names are not hashed in tests (`.primary`, not `._primary_x1y2`), so tests can assert on them.
 - Vitest stubs CSS imports (`import css from './x.css?raw'` is `''` in tests); read the file from disk if a test needs its contents. `?raw` does work for `.ts`/`.tsx`: `src/app/lazyRoutes.test.ts` reads source files with `import.meta.glob(..., { query: '?raw' })`, since `src/` tests have no Node types.
 - jsdom has no `Element.prototype.scrollIntoView`; tests that change the directory's page number stub it (the page scrolls to its top).
diff --git a/packages/frontend/eslint.config.js b/packages/frontend/eslint.config.js
index eb306e47..3c65c54d 100644
--- a/packages/frontend/eslint.config.js
+++ b/packages/frontend/eslint.config.js
@@ -1,176 +1,203 @@
 import js from '@eslint/js';
 import globals from 'globals';
 import jsxA11y from 'eslint-plugin-jsx-a11y';
 import reactHooks from 'eslint-plugin-react-hooks';
 import reactRefresh from 'eslint-plugin-react-refresh';
 import tseslint from 'typescript-eslint';
 import prettierConfig from 'eslint-config-prettier';
 import { defineConfig, globalIgnores } from 'eslint/config';
 
 // Raw colors are only allowed in the token layer (src/styles/**).
 // Only the valid CSS hex lengths (3, 4, 6, 8) count, and the match must not run
 // on into a word or a dash, so '#feed-list' or '#abcde' are not flagged. A bare
 // '#feed' IS a valid color and is still flagged in ordinary strings; it is
 // allowed only as a JSX href/to value, where it can only be an in-page anchor.
 const RAW_COLOR = '/#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})(?![\\w-])|\\b(rgba?|hsla?)\\(/i';
 const ANCHOR_ATTR = 'JSXAttribute[name.name=/^(href|to)$/] > Literal';
 const RAW_COLOR_MESSAGE = 'Use a design token (var(--…)) instead of a raw color';
 const BOX_SHADOW_MESSAGE = 'Shadows are not part of the design system; do not set boxShadow';
 
 // Import boundaries between src/ layers. ESLint flat config does not merge a
 // rule's options across matching blocks (the last block wins), so each layer
 // gets exactly one no-restricted-imports block for its source files and one
 // for its test files, and no two of these blocks' file globs overlap.
 // Each layer is banned in its alias form and its relative form (ADV-008),
 // including bare-folder imports such as '../services'. Relative globs start
 // with './' or '../' so package sub-paths such as 'firebase/app' never match.
 function layerBan(layer, message) {
   const forms = [`@/${layer}`, `./**/${layer}`, `../**/${layer}`];
   return { group: forms.flatMap((form) => [form, `${form}/**`]), message };
 }
 
 // Nothing imports app/ except main.tsx (app/ wires features, so a feature
 // importing app/ would be a cycle). Tests are exempt: rendering a component
 // under test needs the app's providers.
 const NO_APP = layerBan('app', 'Only src/main.tsx may import from app/.');
 
 const TEST_FILES = ['**/*.test.{ts,tsx}'];
 
 /**
  * The no-restricted-imports blocks for one layer: source files get every ban;
  * test files get every ban except NO_APP.
  */
 function layerBoundary({ files, ignores = [], paths = [], patterns }) {
   const rule = (list) => ['error', { paths, patterns: list }];
   const testPatterns = patterns.filter((pattern) => pattern !== NO_APP);
   const blocks = [
     {
       files,
       ignores: [...ignores, ...TEST_FILES],
       rules: { 'no-restricted-imports': rule(patterns) },
     },
   ];
   if (paths.length > 0 || testPatterns.length > 0) {
     blocks.push({
       files: files.map((glob) => glob.replace('*.{ts,tsx}', '*.test.{ts,tsx}')),
       ignores,
       rules: { 'no-restricted-imports': rule(testPatterns) },
     });
   }
   return blocks;
 }
 
 // UI primitives must stay presentational: no data, state, or app wiring. They
 // also take brand text as props rather than reading config/.
 const UI_FORBIDDEN_LAYERS = ['services', 'store', 'features', 'config'];
 
 // config/ is a leaf: constants that app/ and features/ share, importing nothing internal.
 const CONFIG_FORBIDDEN_LAYERS = ['features', 'components', 'store', 'services'];
 
+// ADR-08: features/directory reaches the app only through the router's lazy
+// import(), so it stays in its own chunk. This uses the typescript-eslint copy
+// of no-restricted-imports, a separate rule from the layer blocks above, so it
+// can cover all of src/ in one block without overriding them; it also lets
+// `import type` through (erased at build). Dynamic import() is never matched.
+// '../directory' and '../../directory' are the sibling forms used from inside
+// features/. src/app/lazyRoutes.test.ts is the second layer of this guard.
+const LAZY_DIRECTORY_BAN = {
+  group: [
+    '@/features/directory',
+    './**/features/directory',
+    '../**/features/directory',
+    '../directory',
+    '../../directory',
+  ].flatMap((form) => [form, `${form}/**`]),
+  allowTypeImports: true,
+  message:
+    "features/directory is lazy-loaded (ADR-08): reach it only through the router's import().",
+};
+
 export default defineConfig([
   globalIgnores(['dist', 'coverage']),
   {
     files: ['**/*.{ts,tsx}'],
     extends: [
       js.configs.recommended,
       tseslint.configs.strictTypeChecked,
       tseslint.configs.stylisticTypeChecked,
       reactHooks.configs.flat.recommended,
       reactRefresh.configs.vite,
       jsxA11y.flatConfigs.recommended,
     ],
     languageOptions: {
       globals: globals.browser,
       parserOptions: {
         projectService: true,
         tsconfigRootDir: import.meta.dirname,
       },
     },
   },
   {
     files: ['*.config.{js,ts}', 'scripts/**/*.ts'],
     languageOptions: {
       globals: globals.node,
     },
   },
   {
     files: ['**/*.js'],
     extends: [js.configs.recommended, tseslint.configs.disableTypeChecked],
     languageOptions: {
       globals: globals.node,
     },
   },
   {
     files: ['src/**/*.{ts,tsx}'],
     ignores: ['src/styles/**'],
     rules: {
       'no-restricted-syntax': [
         'error',
         {
           selector: `Literal[value=${RAW_COLOR}]:not(${ANCHOR_ATTR})`,
           message: RAW_COLOR_MESSAGE,
         },
         { selector: `TemplateElement[value.raw=${RAW_COLOR}]`, message: RAW_COLOR_MESSAGE },
         {
           selector: "JSXAttribute[name.name='style'] Property[key.name='boxShadow']",
           message: BOX_SHADOW_MESSAGE,
         },
         {
           selector: "JSXAttribute[name.name='style'] Property[key.value='boxShadow']",
           message: BOX_SHADOW_MESSAGE,
         },
       ],
     },
   },
   ...layerBoundary({
     files: ['src/components/ui/**/*.{ts,tsx}'],
     paths: [
       { name: 'axios', message: 'UI primitives must not make HTTP calls.' },
       { name: '@tanstack/react-query', message: 'UI primitives must not fetch server state.' },
     ],
     patterns: [
       ...UI_FORBIDDEN_LAYERS.map((layer) =>
         layerBan(
           layer,
           `UI primitives must not import from ${layer}/ — pass data in through props.`,
         ),
       ),
       NO_APP,
     ],
   }),
   ...layerBoundary({
     files: ['src/services/**/*.{ts,tsx}'],
     paths: [{ name: 'react', message: 'Services are framework-free; do not import React.' }],
     patterns: [
       layerBan('components', 'Services must not import UI components.'),
       layerBan('store', 'Services must not import store/ — return data to the caller.'),
       layerBan('features', 'Services must not import features/ — features call services.'),
       NO_APP,
     ],
   }),
   ...layerBoundary({
     files: ['src/store/**/*.{ts,tsx}'],
     patterns: [
       layerBan('services', 'Store atoms must not call services — features wire them.'),
       layerBan('features', 'Store must not import features/ — features read the store.'),
       NO_APP,
     ],
   }),
   ...layerBoundary({
     files: ['src/config/**/*.{ts,tsx}'],
     patterns: [
       ...CONFIG_FORBIDDEN_LAYERS.map((layer) =>
         layerBan(layer, `config/ is a leaf and must not import from ${layer}/.`),
       ),
       NO_APP,
     ],
   }),
   ...layerBoundary({ files: ['src/features/**/*.{ts,tsx}'], patterns: [NO_APP] }),
   // components/ui has its own, stricter blocks above.
   ...layerBoundary({
     files: ['src/components/**/*.{ts,tsx}'],
     ignores: ['src/components/ui/**'],
     patterns: [NO_APP],
   }),
+  {
+    files: ['src/**/*.{ts,tsx}'],
+    ignores: ['src/features/directory/**', ...TEST_FILES],
+    rules: {
+      '@typescript-eslint/no-restricted-imports': ['error', { patterns: [LAZY_DIRECTORY_BAN] }],
+    },
+  },
   prettierConfig,
 ]);
diff --git a/packages/frontend/scripts/enforcement.test.ts b/packages/frontend/scripts/enforcement.test.ts
index 50c60e4f..811a7438 100644
--- a/packages/frontend/scripts/enforcement.test.ts
+++ b/packages/frontend/scripts/enforcement.test.ts
@@ -1,287 +1,332 @@
 // @vitest-environment node
 // Proves the tokens-only and import-boundary lint rules actually fire.
 // Fixtures are linted in memory; nothing is written under src/.
 import path from 'node:path';
 import { ESLint, type Linter } from 'eslint';
 import stylelint from 'stylelint';
 import tseslint from 'typescript-eslint';
 import { beforeAll, describe, expect, it } from 'vitest';
 
 const frontendRoot = path.resolve(import.meta.dirname, '..');
 const fixtureDir = 'src/components/ui/__fixture__';
 
 // Loading ESLint, its plugins and Stylelint cold takes seconds, more when the
 // full suite's jsdom workers compete for CPU. Do it once here with a generous
 // timeout so each test keeps the default per-test timeout.
 const SETUP_TIMEOUT_MS = 60_000;
 
 let eslint: ESLint;
 
 beforeAll(async () => {
   // Type-aware linting needs the file on disk; the enforcement rules are purely
   // syntactic, so turn type information off for in-memory fixtures.
   eslint = new ESLint({
     cwd: frontendRoot,
     overrideConfig: {
       languageOptions: { parserOptions: { projectService: false, project: null } },
       rules: tseslint.configs.disableTypeChecked.rules,
     },
   });
   // Warm-up: resolves the config and loads every plugin before the timed tests.
   await eslint.lintText('export {};\n', { filePath: path.join(fixtureDir, 'Warmup.tsx') });
   await stylelintRules('.warmup {\n  margin: 0;\n}\n');
 }, SETUP_TIMEOUT_MS);
 
 async function eslintMessages(
   code: string,
   file = 'Bad.tsx',
   dir = fixtureDir,
 ): Promise<Linter.LintMessage[]> {
   const [result] = await eslint.lintText(code, { filePath: path.join(dir, file) });
   if (!result) throw new Error('ESLint returned no result');
   expect(result.messages.every((m) => !m.fatal)).toBe(true);
   return result.messages;
 }
 
 function ruleIds(messages: { ruleId?: string | null; rule?: string }[]): string[] {
   return messages.map((m) => m.ruleId ?? m.rule ?? '');
 }
 
 async function stylelintRules(code: string): Promise<string[]> {
   const { results } = await stylelint.lint({
     code,
     codeFilename: path.join(frontendRoot, fixtureDir, 'Bad.module.css'),
     configFile: path.join(frontendRoot, 'stylelint.config.js'),
   });
   const [result] = results;
   if (!result) throw new Error('Stylelint returned no result');
   return ruleIds(result.warnings);
 }
 
 describe('ESLint enforcement', () => {
   it('rejects a raw hex color in a string literal', async () => {
     const messages = await eslintMessages("export const accent = '#975c43';\n");
     expect(ruleIds(messages)).toContain('no-restricted-syntax');
   });
 
   it('rejects an rgb() color in a template literal', async () => {
     const messages = await eslintMessages('export const ink = `rgb(0 0 0)`;\n');
     expect(ruleIds(messages)).toContain('no-restricted-syntax');
   });
 
   it('rejects boxShadow in a JSX style prop', async () => {
     const code = "export function Bad() {\n  return <div style={{ boxShadow: 'none' }} />;\n}\n";
     const messages = await eslintMessages(code);
     expect(ruleIds(messages)).toContain('no-restricted-syntax');
   });
 
   it('rejects an alias import of services from components/ui', async () => {
     const messages = await eslintMessages(
       "import { x } from '@/services/x';\nexport const y = x;\n",
     );
     expect(ruleIds(messages)).toContain('no-restricted-imports');
   });
 
   it('rejects a relative import of services from components/ui', async () => {
     const messages = await eslintMessages(
       "import { x } from '../../../services/x';\nexport const y = x;\n",
     );
     expect(ruleIds(messages)).toContain('no-restricted-imports');
   });
 
   it('rejects store, axios and react-query imports from components/ui', async () => {
     const code = [
       "import { a } from '@/store/themeAtom';",
       "import axios from 'axios';",
       "import { useQuery } from '@tanstack/react-query';",
       'export const all = [a, axios, useQuery];',
       '',
     ].join('\n');
     const ids = ruleIds(await eslintMessages(code));
     expect(ids.filter((id) => id === 'no-restricted-imports')).toHaveLength(3);
   });
 
   it('rejects a 4-digit hex word such as #feed in a plain string (it is a valid color)', async () => {
     const messages = await eslintMessages("export const tag = '#feed';\n");
     expect(ruleIds(messages)).toContain('no-restricted-syntax');
   });
 
   it.each([
     ['an in-page href anchor', 'export const A = () => <a href="#feed">Feed</a>;\n'],
     ['a hex-looking word that runs on with a dash', "export const id = '#feed-list';\n"],
     ['a 5-letter hex-looking word (not a valid color length)', "export const id = '#faded';\n"],
   ])('does not flag %s as a raw color', async (_label, code) => {
     expect(ruleIds(await eslintMessages(code))).not.toContain('no-restricted-syntax');
   });
 
   it('accepts a clean primitive', async () => {
     const code = [
       "import styles from './Clean.module.css';",
       '',
       'export function Clean() {',
       "  return <div className={styles.root} style={{ color: 'var(--ink-primary)' }} />;",
       '}',
       '',
     ].join('\n');
     expect(await eslintMessages(code, 'Clean.tsx')).toEqual([]);
   });
 });
 
 // Each layer's banned imports, in alias and relative (incl. bare-folder) form.
 // Fixture files sit one level below the layer folder: src/<layer>/__fixture__/.
 const BOUNDARY_CASES: [layerDir: string, banned: string[]][] = [
   ['features', ['@/app/providers', '../../app/providers', '../../app']],
   [
     'store',
     [
       '@/app/queryClient',
       '../../app',
       '@/services/x',
       '../../services',
       '@/features/x',
       '../../features/x',
     ],
   ],
   [
     'services',
     [
       '@/app/x',
       '../../app',
       '@/store/themeAtom',
       '../../store',
       '@/features/x',
       '../../features',
       '@/components/ui/Button',
       '../../components',
     ],
   ],
   ['components', ['@/app/x', '../../app']],
   ['components/ui', ['@/config/brand', '../../../config/brand', '../../../config', './config']],
   [
     'config',
     [
       '@/app/x',
       '../../app',
       '@/features/auth',
       '../../features/auth',
       '@/components/ui/Logo',
       '../../components',
       '@/store/themeAtom',
       '../../store',
       '@/services/x',
       '../../services/x',
     ],
   ],
 ];
 
 describe('ESLint layer boundaries', () => {
   it.each(
     BOUNDARY_CASES.flatMap(([layer, banned]) => banned.map((spec) => [layer, spec] as const)),
   )('rejects src/%s importing %s', async (layer, spec) => {
     const code = `import { x } from '${spec}';\nexport const y = x;\n`;
     const messages = await eslintMessages(code, 'Bad.ts', `src/${layer}/__fixture__`);
     expect(ruleIds(messages)).toContain('no-restricted-imports');
   });
 
   it('rejects a react import from services', async () => {
     const code = "import { useState } from 'react';\nexport const y = useState;\n";
     const messages = await eslintMessages(code, 'Bad.ts', 'src/services/__fixture__');
     expect(ruleIds(messages)).toContain('no-restricted-imports');
   });
 
   it.each([
     ['features', "import { a } from '@/store/themeAtom';\nimport { s } from '@/services/x';"],
     ['services', "import { t } from './authToken';"],
     ['store', "import { atom } from 'jotai';"],
     ['components', "import { Button } from '@/components/ui/Button';"],
     ['config', "import { x } from './other';"],
     ['features', "import { BRAND_NAME } from '@/config/brand';"],
     ['app', "import { BRAND_NAME } from '@/config/brand';\nimport { x } from '../../config';"],
   ])('allows the permitted imports in src/%s', async (layer, imports) => {
     const code = `${imports}\nexport {};\n`;
     const messages = await eslintMessages(code, 'Ok.ts', `src/${layer}/__fixture__`);
     expect(ruleIds(messages)).not.toContain('no-restricted-imports');
   });
 });
 
 describe('ESLint layer boundaries: package sub-paths and tests', () => {
   it.each([
     ['features', 'firebase/app'],
     ['features', 'some-lib/services'],
     ['components/ui', 'firebase/app'],
     ['components/ui', 'some-lib/services'],
     ['store', 'some-lib/features'],
     ['services', 'some-lib/components'],
     ['config', 'some-lib/app'],
     ['components/ui', 'some-lib/config'],
   ])('allows src/%s importing the package sub-path %s', async (layer, spec) => {
     const code = `import { x } from '${spec}';\nexport const y = x;\n`;
     const messages = await eslintMessages(code, 'Ok.ts', `src/${layer}/__fixture__`);
     expect(ruleIds(messages)).not.toContain('no-restricted-imports');
   });
 
   it.each(['features', 'components', 'components/ui', 'store', 'services'])(
     'allows a test file in src/%s to import @/app/providers',
     async (layer) => {
       const code = "import { x } from '@/app/providers';\nexport const y = x;\n";
       const messages = await eslintMessages(code, 'Ok.test.tsx', `src/${layer}/__fixture__`);
       expect(ruleIds(messages)).not.toContain('no-restricted-imports');
     },
   );
 
   it.each(['@/app/x', '../../app/x'])(
     'still rejects a feature source file importing %s',
     async (spec) => {
       const code = `import { x } from '${spec}';\nexport const y = x;\n`;
       const messages = await eslintMessages(code, 'Bad.ts', 'src/features/__fixture__');
       expect(ruleIds(messages)).toContain('no-restricted-imports');
     },
   );
 
   it.each([
     ['components/ui', "import axios from 'axios';"],
     ['components/ui', "import { s } from '@/services/x';"],
     ['services', "import { useState } from 'react';"],
     ['store', "import { s } from '../../services/x';"],
   ])('keeps the other bans for test files in src/%s (%s)', async (layer, imports) => {
     const code = `${imports}\nexport {};\n`;
     const messages = await eslintMessages(code, 'Bad.test.tsx', `src/${layer}/__fixture__`);
     expect(ruleIds(messages)).toContain('no-restricted-imports');
   });
 });
 
+// ADR-08: features/directory is reached only through the router's lazy import().
+// This ban is the typescript-eslint copy of the rule, so it has its own rule id.
+describe('ESLint lazy-feature boundary (features/directory)', () => {
+  const LAZY_RULE = '@typescript-eslint/no-restricted-imports';
+
+  it.each([
+    ['src/app/__fixture__', "import { DirectoryPage } from '@/features/directory/DirectoryPage';"],
+    ['src/app/__fixture__', "import { x } from '../../features/directory/params';"],
+    ['src/app/__fixture__', "import '@/features/directory/DirectoryPage.module.css';"],
+    ['src/app/__fixture__', "export * from '@/features/directory';"],
+    ['src', "import { x } from './features/directory/params';"],
+    ['src/features/home', "import { x } from '../directory/params';"],
+    ['src/features/home/__fixture__', "import { x } from '../../directory';"],
+    ['src/components/ui/__fixture__', "import { x } from '@/features/directory/params';"],
+  ])('rejects a static import in %s: %s', async (dir, imports) => {
+    const messages = await eslintMessages(`${imports}\nexport {};\n`, 'Bad.ts', dir);
+    expect(ruleIds(messages)).toContain(LAZY_RULE);
+  });
+
+  it.each([
+    [
+      'src/app/__fixture__',
+      "export const page = () => import('@/features/directory/DirectoryPage');",
+    ],
+    ['src/app/__fixture__', "import type { DirectoryParams } from '@/features/directory/params';"],
+    ['src/app/__fixture__', "import { x } from '@/features/directoryHelpers';"],
+    ['src/features/directory', "import { x } from './params';"],
+  ])('allows in %s: %s', async (dir, imports) => {
+    const messages = await eslintMessages(`${imports}\nexport {};\n`, 'Ok.ts', dir);
+    expect(ruleIds(messages)).not.toContain(LAZY_RULE);
+  });
+
+  it('allows a test file to import the feature statically', async () => {
+    const code = "import { x } from '@/features/directory/params';\nexport const y = x;\n";
+    const messages = await eslintMessages(code, 'Ok.test.tsx', 'src/app/__fixture__');
+    expect(ruleIds(messages)).not.toContain(LAZY_RULE);
+  });
+
+  it('keeps the layer bans in force alongside it', async () => {
+    const code = "import { x } from '@/features/directory/params';\nexport const y = x;\n";
+    const ids = ruleIds(await eslintMessages(code, 'Bad.ts', 'src/components/ui/__fixture__'));
+    expect(ids).toEqual(expect.arrayContaining(['no-restricted-imports', LAZY_RULE]));
+  });
+});
+
 describe('Stylelint enforcement', () => {
   it.each([
     ['a hex color', '.box {\n  color: #fff;\n}\n', 'color-no-hex'],
     ['an rgb() color', '.box {\n  color: rgb(0 0 0);\n}\n', 'function-disallowed-list'],
     ['a named color', '.box {\n  color: red;\n}\n', 'color-named'],
     ['box-shadow', '.box {\n  box-shadow: none;\n}\n', 'property-disallowed-list'],
     ['raw padding', '.box {\n  padding: 12px;\n}\n', 'scale-unlimited/declaration-strict-value'],
     ['raw margin', '.box {\n  margin-top: 8px;\n}\n', 'scale-unlimited/declaration-strict-value'],
     ['raw gap', '.box {\n  gap: 8px;\n}\n', 'scale-unlimited/declaration-strict-value'],
     ['a non-camelCase class name', '.Bad_Name {\n  margin: 0;\n}\n', 'selector-class-pattern'],
     [
       'raw font-size',
       '.box {\n  font-size: 14px;\n}\n',
       'scale-unlimited/declaration-strict-value',
     ],
   ])('rejects %s', async (_label, code, rule) => {
     expect(await stylelintRules(code)).toContain(rule);
   });
 
   it('accepts token-only CSS', async () => {
     const code = [
       '.cardRoot {',
       '  padding: var(--space-3);',
       '  margin: 0;',
       '  border: 1px solid var(--border-subtle);',
       '  border-radius: var(--radius-lg);',
       '  color: currentcolor;',
       '  background: transparent;',
       '  width: 100%;',
       '}',
       '',
     ].join('\n');
     expect(await stylelintRules(code)).toEqual([]);
   });
 });
diff --git a/packages/frontend/src/app/AppShell/MainNav.tsx b/packages/frontend/src/app/AppShell/MainNav.tsx
index e1f5505d..3eb75a15 100644
--- a/packages/frontend/src/app/AppShell/MainNav.tsx
+++ b/packages/frontend/src/app/AppShell/MainNav.tsx
@@ -1,34 +1,33 @@
 import { NavLink } from 'react-router';
+import { cx } from '@/components/ui/cx';
 import { useHasSession } from '@/features/auth';
 import styles from './MainNav.module.css';
 
 /** The app's sections. Only Directory exists so far (REQ-006). */
 const NAV_ITEMS = [{ to: '/directory', label: 'Directory' }] as const;
 
 /**
  * The header's main nav (docs/design/screens/app/S1-*), shown only to a
  * signed-in user because every section is behind sign-in. NavLink marks the
  * link `aria-current="page"` on its path and below (e.g. /directory?page=2).
  * On phones it stays in the header and wraps under the brand, instead of
  * S1-Phone's bottom tab bar (REQ-006 architecture).
  */
 export function MainNav() {
   const hasSession = useHasSession();
   if (!hasSession) return null;
 
   return (
     <nav aria-label="Main" className={styles.nav}>
       {NAV_ITEMS.map((item) => (
         <NavLink
           key={item.to}
           to={item.to}
-          className={({ isActive }) =>
-            [styles.link, isActive && styles.active].filter(Boolean).join(' ')
-          }
+          className={({ isActive }) => cx(styles.link, isActive && styles.active)}
         >
           {item.label}
         </NavLink>
       ))}
     </nav>
   );
 }
diff --git a/packages/frontend/src/app/README.md b/packages/frontend/src/app/README.md
index 456fc479..e2534c49 100644
--- a/packages/frontend/src/app/README.md
+++ b/packages/frontend/src/app/README.md
@@ -1,17 +1,17 @@
 # app/
 
 **Purpose:** the application root:
 
 - `App.tsx`: renders `RouterProvider` from `react-router/dom`, not `react-router`, so logout's `flushSync` navigation works (gotcha G08).
 - Providers for TanStack Query and Jotai, and the shared `QueryClient`.
 - The router: the path-less `RootLayout` holds two shells. `AuthShell` wraps `GuestOnly` → `/login`, `/register`; `AppShell` wraps `RequireAuth` → `/` (Home) and `/directory`, plus the unknown-path route and test pages. Both guards come from `features/auth`.
-- Lazy routes (ADR-08): `/directory` is loaded with the route's `lazy` (`DIRECTORY_ROUTE` in `router.tsx`), so the directory page is its own chunk. Only that dynamic `import('@/features/directory/DirectoryPage')` may reference `features/directory`; `lazyRoutes.test.ts` scans every file in `src/` (except that folder and tests) and fails on a static import of it. A new large page follows the same pattern.
+- Lazy routes (ADR-08): `/directory` is loaded with the route's `lazy` (`DIRECTORY_ROUTE` in `router.tsx`), so the directory page is its own chunk. Only that dynamic `import('@/features/directory/DirectoryPage')` may reference `features/directory`; an ESLint rule (`@typescript-eslint/no-restricted-imports` in `eslint.config.js`; `import type` is allowed) rejects a static import of it anywhere else in `src/` except tests, and `lazyRoutes.test.ts` scans every file in `src/` (except that folder and tests) as a second check. A new large page follows the same pattern.
 - `HydrateFallback`: the "Loading…" line shown in `<main>` while a lazy page's code loads on a direct visit. Set it as a static property of the lazy route object itself, never on the root or on what `lazy` returns: the router stops rendering at the nearest route that has one, so anywhere higher hides the shell. A client-side click to a lazy page shows no fallback (the old page stays until the code arrives). A chunk that fails to load shows the inner `RouteError`.
 - `RootLayout`: applies the theme and mounts `SessionBridge` once for every page, auth pages included. Don't mount it in a shell.
 - The `AuthShell` layout: no header, only the `ThemeToggle` in the top-right corner, and `<main id="main">`.
 - The `AppShell` layout: the header holds the `Logo` (with `BRAND_NAME` from `@/config/brand`, linking home), `MainNav` (`<nav aria-label="Main">` with the Directory link, signed-in users only, current on `/directory` and below; on phones it wraps under the brand instead of a bottom tab bar) and `HeaderAuth` (Log in / Sign up for guests, a user menu with Log out when signed in).
 - The route error element.
 
 **May import:** anything in `src/` (`@/config/**`, `@/features/**` except `features/directory`, which only the lazy route's dynamic import reaches, `@/components/ui/**`, `@/store/**`, `@/services/**`, `@/styles/**`).
 
 **Imported by:** only `src/main.tsx`. Nothing else may import from `app/`.
diff --git a/packages/frontend/src/components/ui/README.md b/packages/frontend/src/components/ui/README.md
index b6faabfb..a2efc519 100644
--- a/packages/frontend/src/components/ui/README.md
+++ b/packages/frontend/src/components/ui/README.md
@@ -1,28 +1,29 @@
 # components/ui/
 
-**Purpose:** design-system primitives (Button, ButtonLink, Input, PasswordInput, Logo, Card, Tag, Alert, Menu, SegmentedControl, ThemeToggle, Avatar, Chip, Skeleton, SearchField, Popover). Each lives in its own folder with `Name.tsx`, `Name.module.css`, `Name.test.tsx`, and `index.ts`. Primitives are props-in, events-out: typed props, styles only from design tokens (`var(--…)`), no data fetching.
+**Purpose:** design-system primitives (Button, ButtonLink, Input, PasswordInput, Logo, Card, Tag, Alert, Menu, SegmentedControl, ThemeToggle, Avatar, Chip, Skeleton, SearchField, Popover, VisuallyHidden). Each lives in its own folder with `Name.tsx`, `Name.module.css`, `Name.test.tsx`, and `index.ts`. Primitives are props-in, events-out: typed props, styles only from design tokens (`var(--…)`), no data fetching.
 
 | Primitive                         | What it is                                                                                                                                                                                                                                                                                                                                                                                                                      |
 | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
 | `Button`                          | `primary` / `secondary` / `ghost`; `loading` disables it, sets `aria-busy` and shows a dot                                                                                                                                                                                                                                                                                                                                      |
 | `ButtonLink`                      | Button styles on a react-router `Link` (lives in `Button/`); no `loading`/`disabled`                                                                                                                                                                                                                                                                                                                                            |
 | `Input`                           | labelled text field (~40px tall) with `helperText` and `error` (`aria-invalid`, error text in `aria-describedby`); optional `endAdornment` (a control inside the field's end edge)                                                                                                                                                                                                                                              |
 | `PasswordInput`                   | `Input` with a show/hide button (`aria-label` flips Show/Hide password, no `aria-pressed`); focus stays in the input; takes every `Input` prop except `type`                                                                                                                                                                                                                                                                    |
 | `Logo`                            | inline-SVG brand mark coloured by tokens; props `label`, `showWordmark`, `decorative`, `size`                                                                                                                                                                                                                                                                                                                                   |
 | `Card`                            | raised surface; `as` picks the element                                                                                                                                                                                                                                                                                                                                                                                          |
 | `Tag`                             | small status label with a tone dot                                                                                                                                                                                                                                                                                                                                                                                              |
 | `Alert`                           | inline message; `tone="error"` is `role="alert"`, `tone="info"` is `role="status"`; optional `title`                                                                                                                                                                                                                                                                                                                            |
 | `Menu` / `MenuItem` / `MenuLabel` | Base UI Menu: a dropdown with keyboard support (Enter/ArrowDown open, Escape closes and returns focus). `Menu` takes `trigger` and `align`; each `MenuItem` has `onSelect`; `MenuLabel` is a non-interactive heading                                                                                                                                                                                                            |
 | `SegmentedControl<T>`             | Base UI RadioGroup pill: `label`, `options`, `value`, `onValueChange`. An option with an `icon` shows only the icon, is named by its `label` (`aria-label`) and shows the label in a Base UI Tooltip on hover and focus                                                                                                                                                                                                         |
 | `ThemeToggle`                     | Light / Dark / System, a thin wrapper over `SegmentedControl`. `variant="full"` (default, app header) shows the words; `variant="compact"` (auth pages) shows sun / moon / monitor icons, same radio names, tooltip on hover and focus                                                                                                                                                                                          |
 | `Avatar`                          | round photo (`<img alt="">`) or initials (first letter of the first and last word) on accent-soft; `name`, `photoUrl`, `size` `md` (2.75rem) / `sm` (2.5rem); falls back to initials if the photo fails; `aria-hidden` (the name sits beside it)                                                                                                                                                                                |
 | `Chip`                            | accent-soft pill for an active filter with an x button; `onRemove`, `removeLabel` (the button's accessible name), `removeButtonRef` to move focus to it                                                                                                                                                                                                                                                                         |
 | `Skeleton`                        | `aria-hidden` loading placeholder on surface-sunken with a slow pulse (off under reduced motion); `shape` `line` / `block` / `circle`; size it with a `className` (the defaults yield)                                                                                                                                                                                                                                          |
 | `SearchField`                     | `<input type="search">` with a leading search icon and a visually hidden `label` (its accessible name); 16px text so iOS doesn't zoom; native props and `ref` go to the input                                                                                                                                                                                                                                                   |
 | `Popover`                         | Base UI Popover: a pill trigger with a chevron opening a non-modal panel (a dialog named by `label`) on surface-raised. Click/Enter/Space open it and focus the first field; Escape or an outside click closes it and returns focus to the trigger. Controlled (`open` + `onOpenChange`) or uncontrolled (`defaultOpen`); `finalFocus` (e.g. `false` when the caller moves focus itself), `initialFocus`, `triggerRef`, `align` |
+| `VisuallyHidden`                  | Text not drawn on screen but read by assistive tech (the one copy of that CSS): a span by default, `as="label"` for a hidden field label (SearchField), `as="p"` with `role="status"` for a polite message (results grid)                                                                                                                                                                                                       |
 
 **May import:** React, `@base-ui/react`, `react-router` (ButtonLink renders its `Link`), other `components/ui/` primitives, and `@/styles/**`.
 
 **Must not import:** `@/services/**`, `@/store/**`, `@/features/**`, `@/config/**`, `@/app/**`, `axios`, `@tanstack/react-query` (enforced by ESLint, for `@/…` and relative paths alike). Brand text such as the product name comes in as a prop (`Logo label`).
 
 **Imported by:** `features/` and `app/`.
diff --git a/packages/frontend/src/components/ui/SearchField/SearchField.module.css b/packages/frontend/src/components/ui/SearchField/SearchField.module.css
index 82f2fc9e..3c9f84bd 100644
--- a/packages/frontend/src/components/ui/SearchField/SearchField.module.css
+++ b/packages/frontend/src/components/ui/SearchField/SearchField.module.css
@@ -1,80 +1,67 @@
 /* Design: docs/design/screens/app/S2-Desktop-Light (search box above the
    filters). The box is the wrapper, so the icon sits inside it; the <input>
    itself is borderless. Departures, for the same contrast reasons as Input:
    the resting border is border-strong, not border-subtle; focus switches to
    the accent border and the raised fill. Text is 16px (--text-body), not the
    design's 15px, so iOS does not zoom on focus. The box is ~40px tall like
    Input: the 22px line, space-2/space-4 padding and a 1px border (the
    design's 11px/14px padding has no token). */
 
 .field {
   display: flex;
   align-items: center;
   gap: var(--space-3);
   box-sizing: border-box;
   width: 100%;
   min-width: 0;
   padding: var(--space-2) var(--space-4);
   background: var(--surface-sunken);
   border: 1px solid var(--border-strong);
   border-radius: var(--radius-md);
   color: var(--ink-muted);
   transition:
     border-color var(--duration-fast) var(--easing-standard),
     background-color var(--duration-fast) var(--easing-standard);
 }
 
 /* The accent border is the only focus signal (no ring), as in Input. */
 .field:focus-within {
   border-color: var(--accent);
   background: var(--surface-raised);
 }
 
 /* Decorative; sized in rem so it scales with zoom (18px in the design). */
 .icon {
   flex-shrink: 0;
   inline-size: 1.125rem;
   block-size: 1.125rem;
 }
 
 .input {
   flex-grow: 1;
   min-width: 0;
   padding: 0;
   border: none;
   background: transparent;
   color: var(--ink-primary);
   font: var(--text-body);
   line-height: var(--text-body-sm-line);
   outline: none;
   text-overflow: ellipsis;
 }
 
 .input::placeholder {
   color: var(--ink-secondary);
 }
 
 .input:focus,
 .input:focus-visible {
   outline: none;
   text-overflow: ellipsis;
 }
 
-/* Hidden on screen, still read by assistive tech. No shared utility exists
-   yet; this is the only copy. */
-.visuallyHidden {
-  position: absolute;
-  width: 1px;
-  height: 1px;
-  padding: 0;
-  overflow: hidden;
-  clip-path: inset(50%);
-  white-space: nowrap;
-  border: 0;
-}
-
 @media (prefers-reduced-motion: reduce) {
   .field {
     transition: none;
   }
 }
diff --git a/packages/frontend/src/components/ui/SearchField/SearchField.tsx b/packages/frontend/src/components/ui/SearchField/SearchField.tsx
index aa3e2ace..e3c911d3 100644
--- a/packages/frontend/src/components/ui/SearchField/SearchField.tsx
+++ b/packages/frontend/src/components/ui/SearchField/SearchField.tsx
@@ -1,50 +1,51 @@
 import { useId, type ComponentPropsWithRef, type ReactNode } from 'react';
 import { cx } from '../cx';
+import { VisuallyHidden } from '../VisuallyHidden';
 import styles from './SearchField.module.css';
 
 export interface SearchFieldProps extends Omit<ComponentPropsWithRef<'input'>, 'type'> {
   /**
    * The field's accessible name. It is visually hidden (the search icon and
    * the placeholder carry the meaning on screen) but still read out.
    */
   label: ReactNode;
 }
 
 /**
  * A search box: a leading search icon and an `<input type="search">` with a
  * visually hidden label. Native input props (and `className`) go to the <input>.
  */
 export function SearchField({ label, id, className, ...rest }: SearchFieldProps) {
   const generatedId = useId();
   const inputId = id ?? generatedId;
 
   return (
     <div className={styles.field}>
-      <label className={styles.visuallyHidden} htmlFor={inputId}>
+      <VisuallyHidden as="label" htmlFor={inputId}>
         {label}
-      </label>
+      </VisuallyHidden>
       <SearchIcon />
       <input {...rest} id={inputId} type="search" className={cx(styles.input, className)} />
     </div>
   );
 }
 
 // Feather-style magnifier, same line weight as the other inline icons.
 function SearchIcon() {
   return (
     <svg
       className={styles.icon}
       viewBox="0 0 24 24"
       fill="none"
       stroke="currentColor"
       strokeWidth={2}
       strokeLinecap="round"
       strokeLinejoin="round"
       aria-hidden
       focusable={false}
     >
       <circle cx="11" cy="11" r="7" />
       <line x1="21" y1="21" x2="16.65" y2="16.65" />
     </svg>
   );
 }
diff --git a/packages/frontend/src/components/ui/VisuallyHidden/VisuallyHidden.module.css b/packages/frontend/src/components/ui/VisuallyHidden/VisuallyHidden.module.css
new file mode 100644
index 00000000..7352d8e7
--- /dev/null
+++ b/packages/frontend/src/components/ui/VisuallyHidden/VisuallyHidden.module.css
@@ -0,0 +1,12 @@
+/* Hidden on screen, still read by assistive tech. The one copy of this rule:
+   SearchField and the directory's results grid use the component. */
+.visuallyHidden {
+  position: absolute;
+  width: 1px;
+  height: 1px;
+  padding: 0;
+  overflow: hidden;
+  clip-path: inset(50%);
+  white-space: nowrap;
+  border: 0;
+}
diff --git a/packages/frontend/src/components/ui/VisuallyHidden/VisuallyHidden.test.tsx b/packages/frontend/src/components/ui/VisuallyHidden/VisuallyHidden.test.tsx
new file mode 100644
index 00000000..e7a18d07
--- /dev/null
+++ b/packages/frontend/src/components/ui/VisuallyHidden/VisuallyHidden.test.tsx
@@ -0,0 +1,35 @@
+import { render, screen } from '@testing-library/react';
+import { describe, expect, it } from 'vitest';
+import { VisuallyHidden } from './VisuallyHidden';
+
+describe('VisuallyHidden', () => {
+  it('renders its text in a span by default, still in the accessibility tree', () => {
+    render(<VisuallyHidden>Only for screen readers</VisuallyHidden>);
+    const text = screen.getByText('Only for screen readers');
+    expect(text.tagName).toBe('SPAN');
+    expect(text).toHaveClass('visuallyHidden');
+  });
+
+  it('can be a label that names a field', () => {
+    render(
+      <>
+        <VisuallyHidden as="label" htmlFor="q">
+          Search alumni
+        </VisuallyHidden>
+        <input id="q" />
+      </>,
+    );
+    expect(screen.getByRole('textbox', { name: 'Search alumni' })).toBeInTheDocument();
+  });
+
+  it('passes role and className through', () => {
+    render(
+      <VisuallyHidden as="p" role="status" className="extra">
+        3 results
+      </VisuallyHidden>,
+    );
+    const status = screen.getByRole('status');
+    expect(status).toHaveTextContent('3 results');
+    expect(status).toHaveClass('visuallyHidden', 'extra');
+  });
+});
diff --git a/packages/frontend/src/components/ui/VisuallyHidden/VisuallyHidden.tsx b/packages/frontend/src/components/ui/VisuallyHidden/VisuallyHidden.tsx
new file mode 100644
index 00000000..bd331dab
--- /dev/null
+++ b/packages/frontend/src/components/ui/VisuallyHidden/VisuallyHidden.tsx
@@ -0,0 +1,22 @@
+import type { ComponentPropsWithoutRef, ElementType } from 'react';
+import { cx } from '../cx';
+import styles from './VisuallyHidden.module.css';
+
+export type VisuallyHiddenProps<T extends ElementType = 'span'> = {
+  /** The element to render. A span by default; use `label` for a hidden field label. */
+  as?: T;
+} & Omit<ComponentPropsWithoutRef<T>, 'as'>;
+
+/**
+ * Text that is not drawn on screen but is still read by assistive technology:
+ * a field's label when an icon says it visually, or a polite status message.
+ * All other props (htmlFor, role, className) go to the element.
+ */
+export function VisuallyHidden<T extends ElementType = 'span'>({
+  as,
+  className,
+  ...rest
+}: VisuallyHiddenProps<T>) {
+  const Tag: ElementType = as ?? 'span';
+  return <Tag {...rest} className={cx(styles.visuallyHidden, className)} />;
+}
diff --git a/packages/frontend/src/components/ui/VisuallyHidden/index.ts b/packages/frontend/src/components/ui/VisuallyHidden/index.ts
new file mode 100644
index 00000000..608f46d8
--- /dev/null
+++ b/packages/frontend/src/components/ui/VisuallyHidden/index.ts
@@ -0,0 +1,2 @@
+export { VisuallyHidden } from './VisuallyHidden';
+export type { VisuallyHiddenProps } from './VisuallyHidden';
diff --git a/packages/frontend/src/features/README.md b/packages/frontend/src/features/README.md
index 3bb5c50e..e81c623d 100644
--- a/packages/frontend/src/features/README.md
+++ b/packages/frontend/src/features/README.md
@@ -1,14 +1,14 @@
 # features/
 
 **Purpose:** one folder per domain. A feature owns its hooks, queries, and domain components, and wires UI primitives to state and services.
 
 **Features today:**
 
 - `theme/` — applies the light/dark/system preference to the page.
 - `auth/` — session (token, current user, 401 handling via `SessionBridge`), route guards (`RequireAuth`, `GuestOnly`), login and sign-up pages in a shared `AuthLayout` (full-height page with no app header: brand panel beside the form from 60rem, only its logo row above the form below that), and `ForgotPasswordHelp` (support mailto message).
 - `home/` — the signed-in home page.
-- `directory/` — the alumni directory page at `/directory` (REQ-006): search, filters and page live in the URL query string (`params.ts` parses it and ignores anything the API would reject; `useDirectoryParams` writes it back, filters and pages push history, typed search replaces it after 300 ms), `useAlumniSearch` (TanStack Query over `services/alumniApi`), and the page's own pieces (`AlumniCard`, `ResultsGrid`, `FilterBar`, `Pagination`, `DirectoryStates`). It has no `index.ts`: the page is loaded lazily, so nothing outside this folder may import it statically (ADR-08, guarded by `app/lazyRoutes.test.ts`).
+- `directory/` — the alumni directory page at `/directory` (REQ-006): search, filters and page live in the URL query string (`params.ts` parses it and ignores anything the API would reject; `useDirectoryParams` writes it back, filters and pages push history, typed search replaces it after 300 ms), `useAlumniSearch` (TanStack Query over `services/alumniApi`), and the page's own pieces (`AlumniCard`, `ResultsGrid`, `FilterBar`, `Pagination`, `DirectoryStates`). It has no `index.ts`: the page is loaded lazily, so nothing outside this folder may import it statically (ADR-08, enforced by ESLint and by `app/lazyRoutes.test.ts`).
 
 **May import:** `@/components/ui/**`, `@/config/**`, `@/store/**`, `@/services/**`, `@/styles/**`, and types from `@alumni/shared`. Not `@/app/**`.
 
 **Imported by:** `app/` and other features. Exception: `directory/` is reached only through the lazy route's dynamic import in `app/router.tsx`.
diff --git a/packages/frontend/src/features/directory/DirectoryPage.test.tsx b/packages/frontend/src/features/directory/DirectoryPage.test.tsx
index 6ebe6be9..f3202e07 100644
--- a/packages/frontend/src/features/directory/DirectoryPage.test.tsx
+++ b/packages/frontend/src/features/directory/DirectoryPage.test.tsx
@@ -1,375 +1,409 @@
 import type { AlumniListItem, AlumniListResponse, MyProfile } from '@alumni/shared';
 import { act, render, screen, waitFor, within } from '@testing-library/react';
 import userEvent from '@testing-library/user-event';
 import {
   AxiosError,
   type AxiosAdapter,
   type AxiosResponse,
   type InternalAxiosRequestConfig,
 } from 'axios';
 import { createStore } from 'jotai';
 import { createMemoryRouter } from 'react-router';
 // react-router/dom's RouterProvider wires flushSync, as App.tsx does.
 import { RouterProvider } from 'react-router/dom';
 import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
 import { AppProviders } from '@/app/providers';
 import { createQueryClient } from '@/app/queryClient';
 import { createRoutes } from '@/app/router';
 import { RequireAuth, SESSION_EXPIRED_MESSAGE } from '@/features/auth';
 import { getToken, setToken } from '@/services/authToken';
 import { httpClient, setUnauthorizedHandler } from '@/services/httpClient';
 import { DIRECTORY_PAGE_SIZE } from './constants';
 import { DirectoryPage } from './DirectoryPage';
 
 // ---- a fake API at the axios adapter (the REQ-001 test policy) ----
 
 function base64url(value: object): string {
   return window
     .btoa(JSON.stringify(value))
     .replace(/=+$/, '')
     .replace(/\+/g, '-')
     .replace(/\//g, '_');
 }
 
 /** A JWT-shaped token that expires in an hour. */
 function makeToken(): string {
   const exp = Math.floor(Date.now() / 1000) + 3600;
   return `${base64url({ alg: 'HS256' })}.${base64url({ sub: 1, exp })}.sig`;
 }
 
 const AMINA: MyProfile = {
   user_id: 1,
   name: 'Amina',
   email: 'amina@example.com',
   role: 'alumni',
   alumni_id: 1,
   has_alumni_profile: true,
   student_id: null,
   has_student_profile: false,
 };
 
 type Responder = (config: InternalAxiosRequestConfig) => Promise<AxiosResponse>;
 
 function ok(data: unknown): Responder {
   return (config) => Promise.resolve({ data, status: 200, statusText: 'OK', headers: {}, config });
 }
 
 function fail(status: number): Responder {
   return (config) =>
     Promise.reject(
       new AxiosError('Request failed', AxiosError.ERR_BAD_REQUEST, config, null, {
         data: { message: 'nope' },
         status,
         statusText: String(status),
         headers: {},
         config,
       }),
     );
 }
 
 /** `count` alumni named "<prefix> 1" … "<prefix> count". */
 function alumni(count: number, prefix = 'Alum'): AlumniListItem[] {
   return Array.from({ length: count }, (_, index) => ({
     id: index + 1,
     user_id: index + 100,
     name: `${prefix} ${String(index + 1)}`,
     graduation_year: 2015,
     department: 'Economics',
   }));
 }
 
 function page(items: AlumniListItem[], total: number): AlumniListResponse {
   return { items, total };
 }
 
 const originalAdapter = httpClient.defaults.adapter;
 /** The query params of every GET /alumni, in order. */
 const searches: Record<string, unknown>[] = [];
 
 /** GET /me answers Amina; GET /alumni goes to `alumniHandler`. */
 function mockApi(alumniHandler: Responder): void {
   const adapter: AxiosAdapter = (config) => {
     const key = `${(config.method ?? 'get').toUpperCase()} ${config.url ?? ''}`;
     if (key === 'GET /me') return ok(AMINA)(config);
     if (key === 'GET /alumni') {
       searches.push({ ...(config.params as Record<string, unknown>) });
       return alumniHandler(config);
     }
     return Promise.reject(new Error(`Unmocked request: ${key}`));
   };
   httpClient.defaults.adapter = adapter;
 }
 
 /** Answers by the requested page: `pages[n - 1]` for page n. */
 function byPage(pages: AlumniListResponse[]): Responder {
   return (config) => {
     const params = config.params as { page: number };
     const data = pages[params.page - 1] ?? page([], pages[0]?.total ?? 0);
     return ok(data)(config);
   };
 }
 
 function lastSearch(): Record<string, unknown> | undefined {
   return searches[searches.length - 1];
 }
 
 const PAGE_ROUTES = [
   { element: <RequireAuth />, children: [{ path: 'directory', element: <DirectoryPage /> }] },
 ];
 
 /** Signed in, at `path`, with the real shells, session bridge and login page. */
 function renderAt(path: string) {
   setToken(makeToken());
   const router = createMemoryRouter(createRoutes(PAGE_ROUTES), { initialEntries: [path] });
   render(
     <AppProviders queryClient={createQueryClient()} store={createStore()}>
       <RouterProvider router={router} />
     </AppProviders>,
   );
   return router;
 }
 
 /** A result card's link, by the alumnus' exact name. */
 const card = (name: string) => new RegExp(`^${name} Class of`);
 
 const heading = () => screen.findByRole('heading', { level: 1, name: 'Alumni Directory' });
 const countRegion = () => {
   const region = document.querySelector('[aria-live="polite"]');
   if (!(region instanceof HTMLElement)) throw new Error('no count region');
   return region;
 };
 
 const scrollIntoView = vi.fn();
 
 beforeEach(() => {
   searches.length = 0;
   // jsdom has no scrollIntoView; the page calls it on a page change.
   scrollIntoView.mockReset();
   Element.prototype.scrollIntoView = scrollIntoView;
 });
 
 afterEach(() => {
   httpClient.defaults.adapter = originalAdapter;
   setUnauthorizedHandler(null);
 });
 
 describe('DirectoryPage', () => {
   it('shows skeleton cards while loading, and no count', async () => {
     let answer: (data: AlumniListResponse) => void = () => undefined;
     mockApi(
       (config) =>
         new Promise((resolve) => {
           answer = (data) => {
             resolve({ data, status: 200, statusText: 'OK', headers: {}, config });
           };
         }),
     );
     renderAt('/directory');
 
     expect(await screen.findByText('Loading alumni…')).toBeInTheDocument();
     const busy = document.querySelector('[aria-busy="true"]');
     expect(busy).not.toBeNull();
     expect(busy?.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThan(0);
     expect(countRegion()).toBeEmptyDOMElement();
     expect(screen.queryByRole('link', { name: /Class of/ })).not.toBeInTheDocument();
 
     act(() => {
       answer(page(alumni(2), 2));
     });
     expect(await screen.findByRole('link', { name: card('Alum 1') })).toBeInTheDocument();
     expect(document.querySelector('[aria-busy="true"]')).toBeNull();
   });
 
   it('shows the results, the count line for both widths and pagination', async () => {
     mockApi(byPage([page(alumni(DIRECTORY_PAGE_SIZE), 26)]));
     renderAt('/directory');
 
     await heading();
     await screen.findByRole('link', { name: card('Alum 1') });
     expect(screen.getAllByRole('link', { name: /Class of/ })).toHaveLength(DIRECTORY_PAGE_SIZE);
     expect(countRegion()).toHaveTextContent('Showing 1–12 of 26 alumni');
     expect(countRegion()).toHaveTextContent(/^Showing 1–12 of 26 alumni26 alumni$/);
     const nav = screen.getByRole('navigation', { name: 'Pagination' });
     expect(nav).toHaveTextContent('Page 1 of 3');
     expect(within(nav).getByRole('button', { name: 'Page 1' })).toHaveAttribute(
       'aria-current',
       'page',
     );
   });
 
   it('counts the last, partial page', async () => {
     mockApi(byPage([page(alumni(12), 13), page(alumni(1, 'Last'), 13)]));
     renderAt('/directory?page=2');
 
     await screen.findByRole('link', { name: card('Last 1') });
     expect(countRegion()).toHaveTextContent('Showing 13–13 of 13 alumni');
   });
 
   it('says "alumnus" for one, and hides pagination for one page', async () => {
     mockApi(byPage([page(alumni(1), 1)]));
     renderAt('/directory');
 
     await screen.findByRole('link', { name: card('Alum 1') });
     expect(countRegion()).toHaveTextContent(/^Showing 1–1 of 1 alumnus1 alumnus$/);
     expect(screen.queryByRole('navigation', { name: 'Pagination' })).not.toBeInTheDocument();
   });
 
   it('sends the URL state as request params, with the fixed page size', async () => {
     mockApi(byPage([page([], 0)]));
     renderAt('/directory?q=ana&department=Economics&university=Oxford&graduationYear=2020&page=2');
 
     await waitFor(() => {
       expect(lastSearch()).toEqual({
         q: 'ana',
         department: 'Economics',
         university: 'Oxford',
         graduationYear: 2020,
         page: 2,
         pageSize: DIRECTORY_PAGE_SIZE,
       });
     });
   });
 
   it('leaves out empty and invalid URL values', async () => {
     mockApi(byPage([page(alumni(1), 1)]));
     renderAt('/directory?q=%20&department=&graduationYear=20&page=abc&pageSize=99');
 
     await screen.findByRole('link', { name: card('Alum 1') });
     expect(lastSearch()).toEqual({ page: 1, pageSize: DIRECTORY_PAGE_SIZE });
   });
 
   it('shows the filtered empty state, and Clear filters drops every filter', async () => {
     const user = userEvent.setup();
     mockApi((config) => {
       const params = config.params as Record<string, unknown>;
       return ok('department' in params ? page([], 0) : page(alumni(3), 3))(config);
     });
     const router = renderAt('/directory?department=Marine%20Biology');
 
     expect(
       await screen.findByRole('heading', { name: 'No alumni match these filters' }),
     ).toBeInTheDocument();
     expect(screen.getByText(/Department Marine Biology doesn't match/)).toBeInTheDocument();
     expect(countRegion()).toBeEmptyDOMElement();
     expect(screen.queryByRole('navigation', { name: 'Pagination' })).not.toBeInTheDocument();
 
     await user.click(screen.getByRole('button', { name: 'Clear filters' }));
 
     expect(await screen.findByRole('link', { name: card('Alum 1') })).toBeInTheDocument();
     expect(router.state.location.search).toBe('');
     expect(lastSearch()).toEqual({ page: 1, pageSize: DIRECTORY_PAGE_SIZE });
   });
 
   it('shows "No alumni yet" with no search or filter and nothing to show', async () => {
     mockApi(byPage([page([], 0)]));
     renderAt('/directory');
 
     expect(await screen.findByRole('heading', { name: 'No alumni yet' })).toBeInTheDocument();
     expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument();
     expect(countRegion()).toBeEmptyDOMElement();
     expect(screen.queryByRole('navigation', { name: 'Pagination' })).not.toBeInTheDocument();
   });
 
   it('shows a way back from a page past the end, with no count', async () => {
     const user = userEvent.setup();
     mockApi(byPage([page(alumni(12), 20), page(alumni(8, 'Second'), 20)]));
     const router = renderAt('/directory?page=5');
 
     expect(
       await screen.findByRole('heading', { name: 'Nothing on this page' }),
     ).toBeInTheDocument();
     expect(countRegion()).toBeEmptyDOMElement();
     expect(screen.queryByRole('navigation', { name: 'Pagination' })).not.toBeInTheDocument();
 
     await user.click(screen.getByRole('button', { name: 'Back to page 1' }));
 
     expect(await screen.findByRole('link', { name: card('Alum 1') })).toBeInTheDocument();
     expect(lastSearch()).toMatchObject({ page: 1 });
     expect(router.state.location.search).toBe('');
     expect(countRegion()).toHaveTextContent('Showing 1–12 of 20 alumni');
   });
 
   // A 4xx, so the client doesn't retry on its own (5xx retries twice, with
   // 1 s and 2 s delays); the state is the same whatever the status.
   it('shows an error with Retry, and Retry loads the page', async () => {
     const user = userEvent.setup();
     let calls = 0;
     mockApi((config) => {
       calls += 1;
       return calls === 1 ? fail(400)(config) : ok(page(alumni(2), 2))(config);
     });
     renderAt('/directory');
 
     expect(await screen.findByText("The directory didn't load")).toBeInTheDocument();
     expect(countRegion()).toBeEmptyDOMElement();
 
     await user.click(screen.getByRole('button', { name: 'Retry' }));
 
     expect(await screen.findByRole('link', { name: card('Alum 1') })).toBeInTheDocument();
     expect(screen.queryByText("The directory didn't load")).not.toBeInTheDocument();
     expect(countRegion()).toHaveTextContent('Showing 1–2 of 2 alumni');
     expect(calls).toBe(2);
   });
 
   it('goes to another page, scrolls to the top, and Back restores the previous results', async () => {
     const user = userEvent.setup();
     mockApi(byPage([page(alumni(12, 'First'), 20), page(alumni(8, 'Second'), 20)]));
     const router = renderAt('/directory');
 
     await screen.findByRole('link', { name: card('First 1') });
     await user.click(screen.getByRole('button', { name: 'Next page' }));
 
     expect(await screen.findByRole('link', { name: card('Second 1') })).toBeInTheDocument();
     expect(router.state.location.search).toBe('?page=2');
     expect(lastSearch()).toMatchObject({ page: 2 });
     expect(scrollIntoView).toHaveBeenCalled();
     expect(countRegion()).toHaveTextContent('Showing 13–20 of 20 alumni');
 
     await act(() => router.navigate(-1));
 
     expect(await screen.findByRole('link', { name: card('First 1') })).toBeInTheDocument();
     expect(screen.queryByRole('link', { name: card('Second 1') })).not.toBeInTheDocument();
     expect(countRegion()).toHaveTextContent('Showing 1–12 of 20 alumni');
 
     await act(() => router.navigate(1));
     expect(await screen.findByRole('link', { name: card('Second 1') })).toBeInTheDocument();
   });
 
+  it('moves focus to the heading on a page change, while the new page loads', async () => {
+    const user = userEvent.setup();
+    let answerSecond: () => void = () => undefined;
+    mockApi((config) => {
+      const params = config.params as { page: number };
+      if (params.page === 1) return ok(page(alumni(12, 'First'), 20))(config);
+      return new Promise((resolve) => {
+        answerSecond = () => {
+          resolve({
+            data: page(alumni(8, 'Second'), 20),
+            status: 200,
+            statusText: 'OK',
+            headers: {},
+            config,
+          });
+        };
+      });
+    });
+    renderAt('/directory');
+
+    await screen.findByRole('link', { name: card('First 1') });
+    await user.click(screen.getByRole('button', { name: 'Next page' }));
+
+    expect(await screen.findByText('Loading alumni…')).toBeInTheDocument();
+    const title = await heading();
+    expect(title).toHaveFocus();
+
+    act(() => {
+      answerSecond();
+    });
+    expect(await screen.findByRole('link', { name: card('Second 1') })).toBeInTheDocument();
+    expect(title).toHaveFocus();
+  });
+
   it('changing a filter goes back to page 1', async () => {
     const user = userEvent.setup();
     mockApi(byPage([page(alumni(12), 30), page(alumni(12, 'Second'), 30)]));
     const router = renderAt('/directory?department=Economics&page=2');
 
     await screen.findByRole('link', { name: card('Second 1') });
     await user.click(screen.getByRole('button', { name: 'Remove Department: Economics' }));
 
     expect(await screen.findByRole('link', { name: card('Alum 1') })).toBeInTheDocument();
     expect(router.state.location.search).toBe('');
     expect(lastSearch()).toEqual({ page: 1, pageSize: DIRECTORY_PAGE_SIZE });
   });
 
   it('typing a search sends it after the pause, from page 1', async () => {
     const user = userEvent.setup();
     mockApi(byPage([page(alumni(12), 30), page(alumni(12, 'Second'), 30)]));
     const router = renderAt('/directory?page=2');
 
     await screen.findByRole('link', { name: card('Second 1') });
     await user.type(screen.getByRole('searchbox', { name: 'Search alumni' }), 'ana');
 
     await waitFor(() => {
       expect(lastSearch()).toEqual({ q: 'ana', page: 1, pageSize: DIRECTORY_PAGE_SIZE });
     });
     expect(router.state.location.search).toBe('?q=ana');
     // Only the full text was sent, not every keystroke.
     expect(searches.filter((s) => 'q' in s)).toHaveLength(1);
   });
 
   it('a 401 ends the session through the existing handler', async () => {
     mockApi(fail(401));
     const router = renderAt('/directory');
 
     expect(await screen.findByText(SESSION_EXPIRED_MESSAGE)).toBeInTheDocument();
     expect(router.state.location.pathname).toBe('/login');
     expect(getToken()).toBeNull();
   });
 });
diff --git a/packages/frontend/src/features/directory/DirectoryPage.tsx b/packages/frontend/src/features/directory/DirectoryPage.tsx
index 57e471b6..204a52a1 100644
--- a/packages/frontend/src/features/directory/DirectoryPage.tsx
+++ b/packages/frontend/src/features/directory/DirectoryPage.tsx
@@ -1,135 +1,139 @@
 import type { AlumniListResponse } from '@alumni/shared';
 import { useId, useRef } from 'react';
 import { DIRECTORY_PAGE_SIZE } from './constants';
 import { LoadError, NoResults } from './DirectoryStates';
 import { FilterBar } from './FilterBar';
 import { Pagination } from './Pagination';
 import type { DirectoryParams } from './params';
 import { ResultsGrid } from './ResultsGrid';
 import { useAlumniSearch } from './useAlumniSearch';
 import { useDirectoryParams } from './useDirectoryParams';
 import styles from './DirectoryPage.module.css';
 
 function hasSearchOrFilter({ q, department, university, graduationYear }: DirectoryParams) {
   return (
     q !== undefined ||
     department !== undefined ||
     university !== undefined ||
     graduationYear !== undefined
   );
 }
 
 function alumniWord(count: number): string {
   return count === 1 ? 'alumnus' : 'alumni';
 }
 
 interface CountProps {
   page: number;
   data: AlumniListResponse | undefined;
 }
 
 /**
  * "Showing a–b of N alumni" from 48rem, "N alumni" below (both in the DOM,
  * swapped by CSS, never the hidden attribute: G18). The live region is always
  * rendered so changes are announced; it is filled only for a loaded page that
  * has items (empty while loading, on error and past the end: ADV-005).
  */
 function ResultCount({ page, data }: CountProps) {
   const shown = data !== undefined && data.items.length > 0;
   let content = null;
   if (shown) {
     const first = (page - 1) * DIRECTORY_PAGE_SIZE + 1;
     const last = first + data.items.length - 1;
     const word = alumniWord(data.total);
     content = (
       <>
         <span className={styles.countLong}>
           Showing {first}–{last} of {data.total} {word}
         </span>
         <span className={styles.countShort}>
           {data.total} {word}
         </span>
       </>
     );
   }
   return (
     <p className={styles.count} aria-live="polite">
       {content}
     </p>
   );
 }
 
 /**
  * The alumni directory (S2). The URL query string holds the search, filters
  * and page (ADR-08); this page reads it, fetches that page and shows one of
  * the states: loading, error, empty (filtered, none, past the end) or results.
  */
 export function DirectoryPage() {
   const titleId = useId();
   const sectionRef = useRef<HTMLElement>(null);
+  const titleRef = useRef<HTMLHeadingElement>(null);
   const { params, setQuery, setFilters, setPage, clearAll } = useDirectoryParams();
   const { data, isPending, isError, isFetching, refetch } = useAlumniSearch(params);
 
+  // The clicked page button is replaced by skeletons while the new page loads,
+  // so focus moves to the heading instead of falling to <body> (UI-001).
   const goToPage = (page: number) => {
     setPage(page);
+    titleRef.current?.focus({ preventScroll: true });
     sectionRef.current?.scrollIntoView({ block: 'start' });
   };
 
   let body;
   if (isPending) {
     body = <ResultsGrid loading skeletonCount={DIRECTORY_PAGE_SIZE} />;
   } else if (isError) {
     body = (
       <LoadError
         retrying={isFetching}
         onRetry={() => {
           void refetch();
         }}
       />
     );
   } else if (data.items.length === 0) {
     if (data.total > 0 && params.page > 1) {
       body = (
         <NoResults
           variant="pastEnd"
           onFirstPage={() => {
             goToPage(1);
           }}
         />
       );
     } else if (hasSearchOrFilter(params)) {
       body = <NoResults variant="filtered" filters={params} onClearFilters={clearAll} />;
     } else {
       body = <NoResults variant="none" />;
     }
   } else {
     body = (
       <>
         <ResultsGrid items={data.items} />
         <Pagination
           page={params.page}
           totalPages={Math.ceil(data.total / DIRECTORY_PAGE_SIZE)}
           onPageChange={goToPage}
         />
       </>
     );
   }
 
   return (
     <section ref={sectionRef} className={styles.page} aria-labelledby={titleId}>
       <div className={styles.headingRow}>
-        <h1 id={titleId} className={styles.title}>
+        <h1 id={titleId} ref={titleRef} className={styles.title} tabIndex={-1}>
           Alumni Directory
         </h1>
         <ResultCount page={params.page} data={isError ? undefined : data} />
       </div>
       <FilterBar
         params={params}
         onQueryChange={setQuery}
         onFilterChange={setFilters}
         onClearAll={clearAll}
       />
       {body}
     </section>
   );
 }
diff --git a/packages/frontend/src/features/directory/FilterBar.module.css b/packages/frontend/src/features/directory/FilterBar.module.css
index 40bb0740..ada97f57 100644
--- a/packages/frontend/src/features/directory/FilterBar.module.css
+++ b/packages/frontend/src/features/directory/FilterBar.module.css
@@ -1,49 +1,38 @@
 /* Design: docs/design/screens/app/S2-Desktop-Light, S2-Phone-Light and
    S2-NoResults (the search box and the filter row under it). The search box
    is at most 480px wide (30rem). The row's 10px gap (8px on phones) maps to
    space-2. "Clear all" reads as a link: accent text, no box, 4px (space-1)
    after the last pill. The chip and pill looks come from Chip and Popover. */
 
 .bar {
   display: flex;
   flex-direction: column;
   gap: var(--space-4);
   min-width: 0;
 }
 
 .search {
   max-width: 30rem;
 }
 
 .filters {
   display: flex;
   flex-wrap: wrap;
   align-items: center;
   gap: var(--space-2);
 }
 
 .clearAll {
   appearance: none;
   margin-inline-start: var(--space-1);
   padding: var(--space-1) 0;
   background: none;
   border: 0;
   cursor: pointer;
   font: var(--text-label);
   color: var(--accent);
 }
 
 .clearAll:where(:hover) {
   color: var(--accent-strong);
 }
-
-/* FilterPopover's panel: the field above an Apply button at the end edge. */
-.panelForm {
-  display: flex;
-  flex-direction: column;
-  gap: var(--space-3);
-}
-
-.apply {
-  align-self: flex-end;
-}
diff --git a/packages/frontend/src/features/directory/FilterBar.test.tsx b/packages/frontend/src/features/directory/FilterBar.test.tsx
index 3f9d239e..1f3acc29 100644
--- a/packages/frontend/src/features/directory/FilterBar.test.tsx
+++ b/packages/frontend/src/features/directory/FilterBar.test.tsx
@@ -1,314 +1,342 @@
-import { act, render, screen, waitFor } from '@testing-library/react';
+import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
 import userEvent from '@testing-library/user-event';
 import { createMemoryRouter } from 'react-router';
 import { RouterProvider } from 'react-router/dom';
 import { afterEach, describe, expect, it, vi } from 'vitest';
 import { FilterBar, SEARCH_DEBOUNCE_MS } from './FilterBar';
 import { useDirectoryParams } from './useDirectoryParams';
 
 function Harness() {
   const { params, setFilters, setQuery, clearAll } = useDirectoryParams();
   return (
     <FilterBar
       params={params}
       onQueryChange={setQuery}
       onFilterChange={setFilters}
       onClearAll={clearAll}
     />
   );
 }
 
 function setup(initialEntries: string[] = ['/directory'], { fakeTimers = false } = {}) {
   // shouldAdvanceTime keeps waitFor/findBy polling (G12); explicit waits move the clock on.
   if (fakeTimers) {
     vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'], shouldAdvanceTime: true });
   }
   const router = createMemoryRouter([{ path: '/directory', Component: Harness }], {
     initialEntries,
     initialIndex: initialEntries.length - 1,
   });
   render(<RouterProvider router={router} />);
   const user = userEvent.setup(
     fakeTimers
       ? {
           advanceTimers: (ms) => {
             vi.advanceTimersByTime(ms);
           },
         }
       : {},
   );
   const search = (): string => router.state.location.search;
   const box = () => screen.getByRole('searchbox', { name: 'Search alumni' });
   const pill = (name: string) => screen.getByRole('button', { name });
   const wait = (ms: number) =>
     act(async () => {
       await vi.advanceTimersByTimeAsync(ms);
     });
   return { router, user, search, box, pill, wait };
 }
 
 async function applyFilter(
   user: ReturnType<typeof userEvent.setup>,
   pillName: string,
   fieldName: string,
   value: string,
 ) {
   await user.click(screen.getByRole('button', { name: pillName }));
   const field = await screen.findByRole('textbox', { name: fieldName });
   await waitFor(() => {
     expect(field).toHaveFocus();
   });
   await user.type(field, `${value}{Enter}`);
 }
 
 afterEach(() => {
   vi.useRealTimers();
 });
 
 describe('FilterBar', () => {
   it('shows a labeled search box and a pill per filter, no chips and no Clear all', () => {
     const { box, pill } = setup();
 
     expect(box()).toHaveAttribute('maxLength', '100');
     expect(box()).toHaveValue('');
     for (const name of ['University', 'Department', 'Grad. year']) {
       expect(pill(name)).toHaveAttribute('aria-haspopup', 'dialog');
     }
     expect(screen.queryByRole('button', { name: /^Remove / })).not.toBeInTheDocument();
     expect(screen.queryByRole('button', { name: 'Clear all' })).not.toBeInTheDocument();
     expect(screen.queryByRole('button', { name: /Field/ })).not.toBeInTheDocument();
   });
 
   it('restores the box and the chips from the URL', () => {
     setup(['/directory?q=Ada&department=Computer+Science&graduationYear=2017']);
 
     expect(screen.getByRole('searchbox', { name: 'Search alumni' })).toHaveValue('Ada');
     expect(screen.getByText('Department: Computer Science')).toBeInTheDocument();
     expect(screen.getByText('Grad. year: 2017')).toBeInTheDocument();
     expect(
       screen.getByRole('button', { name: 'Remove Department: Computer Science' }),
     ).toBeInTheDocument();
     expect(screen.getByRole('button', { name: 'Remove Grad. year: 2017' })).toBeInTheDocument();
     expect(screen.getByRole('button', { name: 'University' })).toBeInTheDocument();
     expect(screen.queryByRole('button', { name: 'Department' })).not.toBeInTheDocument();
     expect(screen.getByRole('button', { name: 'Clear all' })).toBeInTheDocument();
   });
 
   it.each([
     [
       'University',
       'University',
       'Oslo University',
       'university=Oslo+University',
       'University: Oslo University',
     ],
     [
       'Department',
       'Department',
       'Computer Science',
       'department=Computer+Science',
       'Department: Computer Science',
     ],
     ['Grad. year', 'Graduation year', '2017', 'graduationYear=2017', 'Grad. year: 2017'],
   ])(
     'sets %s with Enter: URL, chip, page reset and focus on the chip remove button',
     async (pillName, fieldName, value, param, chip) => {
       const { user, search, router } = setup(['/directory?page=3']);
 
       await applyFilter(user, pillName, fieldName, value);
 
       expect(search()).toBe(`?${param}`);
       expect(router.state.historyAction).toBe('PUSH');
       const remove = await screen.findByRole('button', { name: `Remove ${chip}` });
       await waitFor(() => {
         expect(remove).toHaveFocus();
       });
       expect(screen.queryByRole('button', { name: pillName })).not.toBeInTheDocument();
       expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
     },
   );
 
   it('sets a filter by clicking Apply', async () => {
     const { user, search } = setup();
 
     await user.click(screen.getByRole('button', { name: 'Department' }));
     await user.type(await screen.findByRole('textbox', { name: 'Department' }), 'Economics');
     await user.click(screen.getByRole('button', { name: 'Apply' }));
 
     expect(search()).toBe('?department=Economics');
     expect(
       await screen.findByRole('button', { name: 'Remove Department: Economics' }),
     ).toHaveFocus();
   });
 
   it.each([
     ['three digits', '201'],
     ['letters', '20ab'],
     ['too early', '1899'],
     ['too far ahead', String(new Date().getFullYear() + 11)],
   ])('a graduation year with %s blocks Apply and says why', async (_case, value) => {
     const { user, search } = setup();
 
     await applyFilter(user, 'Grad. year', 'Graduation year', value);
 
     const field = screen.getByRole('textbox', { name: 'Graduation year' });
     expect(field).toHaveAttribute('aria-invalid', 'true');
     expect(field).toHaveAccessibleDescription(/Enter a 4-digit year from 1900 to \d{4}\./);
     expect(screen.getByRole('dialog', { name: 'Grad. year filter' })).toBeInTheDocument();
     expect(search()).toBe('');
   });
 
   it('an empty department or one with a tab character is not applied', async () => {
     const { user, search } = setup();
 
     await applyFilter(user, 'Department', 'Department', ' ');
     const field = screen.getByRole('textbox', { name: 'Department' });
     expect(field).toHaveAccessibleDescription(/Enter a department name\./);
 
     // A tab can't be typed into the field (it moves focus), but it can be pasted.
     await user.clear(field);
     await user.paste('Computer\tScience');
     await user.keyboard('{Enter}');
 
     expect(field).toHaveAccessibleDescription(/special characters/);
     expect(search()).toBe('');
   });
 
   it('shows text-filter helper text', async () => {
     const { user } = setup();
 
     await user.click(screen.getByRole('button', { name: 'University' }));
 
     expect(await screen.findByRole('textbox', { name: 'University' })).toHaveAccessibleDescription(
       "The exact name; capitals don't matter.",
     );
   });
 
   it('removing a chip clears that filter, keeps the others and focuses its pill', async () => {
     const { user, search, router } = setup([
       '/directory?q=Ada&department=Economics&graduationYear=2017&page=2',
     ]);
 
     await user.click(screen.getByRole('button', { name: 'Remove Department: Economics' }));
 
     expect(search()).toBe('?q=Ada&graduationYear=2017');
     expect(router.state.historyAction).toBe('PUSH');
     const pill = await screen.findByRole('button', { name: 'Department' });
     await waitFor(() => {
       expect(pill).toHaveFocus();
     });
   });
 
   it('Clear all drops the search and every filter and focuses the search box', async () => {
     const { user, search, box } = setup([
       '/directory?q=Ada&university=Oslo&department=Economics&graduationYear=2017&page=4',
     ]);
 
     await user.click(screen.getByRole('button', { name: 'Clear all' }));
 
     expect(search()).toBe('');
     expect(box()).toHaveValue('');
     await waitFor(() => {
       expect(box()).toHaveFocus();
     });
     expect(screen.queryByRole('button', { name: 'Clear all' })).not.toBeInTheDocument();
     expect(screen.queryByRole('button', { name: /^Remove / })).not.toBeInTheDocument();
   });
 
   it('Escape in a panel returns focus to its pill', async () => {
     const { user, pill } = setup();
 
     await user.click(pill('University'));
     const field = await screen.findByRole('textbox', { name: 'University' });
     await waitFor(() => {
       expect(field).toHaveFocus();
     });
     await user.keyboard('{Escape}');
 
     await waitFor(() => {
       expect(pill('University')).toHaveFocus();
     });
   });
 
   describe('search debounce', () => {
     it(`writes q only after ${String(SEARCH_DEBOUNCE_MS)} ms of quiet, replacing history and resetting the page`, async () => {
       const { user, search, box, wait, router } = setup(['/directory?page=3'], {
         fakeTimers: true,
       });
 
       await user.type(box(), 'Ada');
       // Real time also moves the clock a little, so leave a margin before the deadline.
       await wait(SEARCH_DEBOUNCE_MS - 100);
       expect(search()).toBe('?page=3');
 
       await wait(100);
       expect(search()).toBe('?q=Ada');
       expect(router.state.historyAction).toBe('REPLACE');
       expect(box()).toHaveValue('Ada');
     });
 
     it('keeps a trailing space in the box after its own write', async () => {
       const { user, search, box, wait } = setup(['/directory'], { fakeTimers: true });
 
       await user.type(box(), 'Ada ');
       await wait(SEARCH_DEBOUNCE_MS);
 
       expect(search()).toBe('?q=Ada');
       expect(box()).toHaveValue('Ada ');
     });
 
+    it('keeps a key typed while its own write lands, and writes that key too', async () => {
+      const { user, search, box, wait } = setup(['/directory'], { fakeTimers: true });
+
+      await user.type(box(), 'Ada');
+      // The write fires and navigates; before that renders, one more key arrives.
+      act(() => {
+        vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
+        fireEvent.change(box(), { target: { value: 'Adal' } });
+      });
+      expect(search()).toBe('?q=Ada');
+      expect(box()).toHaveValue('Adal');
+
+      await wait(SEARCH_DEBOUNCE_MS);
+      expect(search()).toBe('?q=Adal');
+      expect(box()).toHaveValue('Adal');
+    });
+
+    it('turns a pasted tab into a space, in the box and in the URL', async () => {
+      const { search, box, wait } = setup(['/directory'], { fakeTimers: true });
+
+      fireEvent.change(box(), { target: { value: 'Ada\tLovelace' } });
+      expect(box()).toHaveValue('Ada Lovelace');
+
+      await wait(SEARCH_DEBOUNCE_MS);
+      expect(search()).toBe('?q=Ada+Lovelace');
+      expect(box()).toHaveValue('Ada Lovelace');
+    });
+
     it('an outside change of q (e.g. Back) updates the box', async () => {
       const { router, box } = setup(['/directory?q=Ada']);
 
       await act(() => router.navigate('/directory?q=Grace'));
       expect(box()).toHaveValue('Grace');
 
       await act(() => router.navigate(-1));
       expect(box()).toHaveValue('Ada');
     });
 
     it('Back while a write is pending is not undone', async () => {
       const { user, router, search, box, wait } = setup(['/directory?q=old', '/directory?q=new'], {
         fakeTimers: true,
       });
 
       await user.type(box(), 'x');
       await act(() => router.navigate(-1));
       expect(box()).toHaveValue('old');
 
       await wait(SEARCH_DEBOUNCE_MS * 2);
       expect(search()).toBe('?q=old');
       expect(box()).toHaveValue('old');
     });
 
     it('Clear all while a write is pending is not undone', async () => {
       const { user, search, box, wait } = setup(['/directory?q=abc&department=Economics'], {
         fakeTimers: true,
       });
 
       await user.type(box(), 'd');
       await user.click(screen.getByRole('button', { name: 'Clear all' }));
       await wait(SEARCH_DEBOUNCE_MS * 2);
 
       expect(search()).toBe('');
       expect(box()).toHaveValue('');
     });
 
     it('Apply while a write is pending keeps the typed text in the same history entry', async () => {
       const { user, router, search, box, wait } = setup(['/directory'], { fakeTimers: true });
 
       await user.type(box(), 'Ada');
       await applyFilter(user, 'Department', 'Department', 'Economics');
 
       expect(search()).toBe('?q=Ada&department=Economics');
       expect(router.state.historyAction).toBe('PUSH');
 
       await wait(SEARCH_DEBOUNCE_MS * 2);
       expect(search()).toBe('?q=Ada&department=Economics');
       expect(box()).toHaveValue('Ada');
 
       await act(() => router.navigate(-1));
       expect(search()).toBe('');
     });
   });
 });
diff --git a/packages/frontend/src/features/directory/FilterBar.tsx b/packages/frontend/src/features/directory/FilterBar.tsx
index 55d643fd..1e187ac0 100644
--- a/packages/frontend/src/features/directory/FilterBar.tsx
+++ b/packages/frontend/src/features/directory/FilterBar.tsx
@@ -1,237 +1,261 @@
 import { useEffect, useRef, useState, type ChangeEvent, type RefObject } from 'react';
 import { Chip } from '@/components/ui/Chip';
 import { SearchField } from '@/components/ui/SearchField';
 import { FilterPopover } from './FilterPopover';
 import {
   DEPARTMENT_MAX_LENGTH,
   GRADUATION_YEARS_AHEAD,
   isValidGraduationYear,
   MIN_GRADUATION_YEAR,
   parseDirectoryParams,
   Q_MAX_LENGTH,
+  stripControlCharacters,
+  toSearchParams,
   UNIVERSITY_MAX_LENGTH,
   type DirectoryParams,
 } from './params';
 import { useDebouncedCallback } from './useDebouncedCallback';
 import type { DirectoryFiltersPatch } from './useDirectoryParams';
 import styles from './FilterBar.module.css';
 
 /** How long typing must pause before the search text reaches the URL. */
 export const SEARCH_DEBOUNCE_MS = 300;
 
 export interface FilterBarProps {
   /** The parsed URL state (`useDirectoryParams().params`). */
   params: DirectoryParams;
   /** Writes the typed search text (replaces the history entry). */
   onQueryChange: (q: string) => void;
   /** Sets or clears filters, and optionally `q` (a new history entry). */
   onFilterChange: (patch: DirectoryFiltersPatch) => void;
   /** Drops the search text and every filter. */
   onClearAll: () => void;
 }
 
 type FilterKey = 'university' | 'department' | 'graduationYear';
 
 const TEXT_HELPER = "The exact name; capitals don't matter.";
 
 /** Text filters accept what the URL parser keeps, so an applied filter always becomes a chip. */
 function textError(key: 'university' | 'department', name: string) {
   return (value: string): string | undefined => {
     if (value === '') return `Enter a ${name} name.`;
     const kept = parseDirectoryParams(new URLSearchParams({ [key]: value }))[key];
     return kept === undefined ? 'Remove tabs and other special characters.' : undefined;
   };
 }
 
 function yearError(value: string): string | undefined {
   if (isValidGraduationYear(value)) return undefined;
   const latest = new Date().getFullYear() + GRADUATION_YEARS_AHEAD;
   return `Enter a 4-digit year from ${String(MIN_GRADUATION_YEAR)} to ${String(latest)}.`;
 }
 
 interface FilterSpec {
   key: FilterKey;
   /** Pill and chip text. */
   label: string;
   fieldLabel: string;
   helperText?: string;
   maxLength: number;
   inputMode?: 'numeric';
   validate: (value: string) => string | undefined;
   toPatch: (value: string) => DirectoryFiltersPatch;
 }
 
 // Display order of chips and pills. "Field" from the design is left out (no API filter).
 const FILTERS: readonly FilterSpec[] = [
   {
     key: 'university',
     label: 'University',
     fieldLabel: 'University',
     helperText: TEXT_HELPER,
     maxLength: UNIVERSITY_MAX_LENGTH,
     validate: textError('university', 'university'),
     toPatch: (value) => ({ university: value }),
   },
   {
     key: 'department',
     label: 'Department',
     fieldLabel: 'Department',
     helperText: TEXT_HELPER,
     maxLength: DEPARTMENT_MAX_LENGTH,
     validate: textError('department', 'department'),
     toPatch: (value) => ({ department: value }),
   },
   {
     key: 'graduationYear',
     label: 'Grad. year',
     fieldLabel: 'Graduation year',
     maxLength: 4,
     inputMode: 'numeric',
     validate: yearError,
     toPatch: (value) => ({ graduationYear: Number(value) }),
   },
 ];
 
+/**
+ * What the box last saw of the URL: its `q`, the `q` our pending write sent
+ * (until the URL shows it) and how many times `q` changed from outside.
+ */
+interface SyncState {
+  q: string;
+  sent: string | null;
+  outsideChanges: number;
+}
+
 /** Where focus goes once the URL change has rendered (ADV-002). */
 type PendingFocus = { to: 'chip' | 'pill'; key: FilterKey } | { to: 'search' };
 
 /**
  * Search box, a chip per active filter, a pill (popover) per inactive one and
  * "Clear all". The page owns the URL state; this component only reads `params`
  * and calls back.
  *
  * Typing is debounced: the URL write is scheduled from the change handler and
- * runs only if the URL's `q` is still what it was at that keystroke, so Back,
+ * runs only if no outside change of `q` came after that keystroke, so Back,
  * Clear all or Apply during the wait are never undone by a stale write
- * (ADV-001). When `q` changes from outside, the box shows the new value.
+ * (ADV-001). When `q` changes from outside, the box shows the new value. Our
+ * own write is recognised by its value, so a key typed while it lands is kept,
+ * and so is that key's own pending write (CORR-001).
  */
 export function FilterBar({ params, onQueryChange, onFilterChange, onClearAll }: FilterBarProps) {
   const urlQ = params.q ?? '';
   const [text, setText] = useState(urlQ);
-  const [syncedQ, setSyncedQ] = useState(urlQ);
-  // The URL moved: show its `q`, unless the box already says the same (our own write).
-  if (urlQ !== syncedQ) {
-    setSyncedQ(urlQ);
-    if (text.trim() !== urlQ) setText(urlQ);
+  const [sync, setSync] = useState<SyncState>({ q: urlQ, sent: null, outsideChanges: 0 });
+  // The URL moved. Our own write (it carries the `q` we sent) leaves the box
+  // alone, as it may already hold newer keys; an outside change shows its `q`.
+  if (urlQ !== sync.q) {
+    const own = urlQ === sync.sent;
+    setSync({
+      q: urlQ,
+      sent: null,
+      outsideChanges: own ? sync.outsideChanges : sync.outsideChanges + 1,
+    });
+    if (!own && text.trim() !== urlQ) setText(urlQ);
   }
 
-  const writeQuery = useDebouncedCallback((next: string, qWhenTyped: string) => {
-    if ((params.q ?? '') !== qWhenTyped) return;
+  const writeQuery = useDebouncedCallback((next: string, outsideChangesWhenTyped: number) => {
+    if (sync.outsideChanges !== outsideChangesWhenTyped) return;
+    // Set in the same tick as the navigation, so it is in place when the URL change renders.
+    const sent = parseDirectoryParams(toSearchParams({ q: next, page: 1 })).q ?? '';
+    setSync((current) => ({ ...current, sent }));
     onQueryChange(next);
   }, SEARCH_DEBOUNCE_MS);
 
   const searchRef = useRef<HTMLInputElement>(null);
   // One ref per element (G10): the pill triggers and the chips' remove buttons.
   const universityPill = useRef<HTMLButtonElement>(null);
   const departmentPill = useRef<HTMLButtonElement>(null);
   const yearPill = useRef<HTMLButtonElement>(null);
   const universityChip = useRef<HTMLButtonElement>(null);
   const departmentChip = useRef<HTMLButtonElement>(null);
   const yearChip = useRef<HTMLButtonElement>(null);
   const pillRefs: Record<FilterKey, RefObject<HTMLButtonElement | null>> = {
     university: universityPill,
     department: departmentPill,
     graduationYear: yearPill,
   };
   const chipRefs: Record<FilterKey, RefObject<HTMLButtonElement | null>> = {
     university: universityChip,
     department: departmentChip,
     graduationYear: yearChip,
   };
 
   // The pill and the chip swap places only after the URL change renders, so
   // focus is moved here, once the target exists.
   const pendingFocus = useRef<PendingFocus | null>(null);
   useEffect(() => {
     const target = pendingFocus.current;
     if (!target) return;
     const element =
       target.to === 'search'
         ? searchRef.current
         : target.to === 'chip'
           ? chipRefs[target.key].current
           : pillRefs[target.key].current;
     if (element) {
       pendingFocus.current = null;
       element.focus();
     }
   });
 
   function handleTextChange(event: ChangeEvent<HTMLInputElement>) {
-    const next = event.target.value;
+    // A pasted tab or line break becomes a space, so the box and the URL agree (CORR-002).
+    const next = stripControlCharacters(event.target.value);
     setText(next);
-    writeQuery.run(next, urlQ);
+    writeQuery.run(next, sync.outsideChanges);
   }
 
   /** A filter change also carries the box text, so a pending search write is not lost. */
   function changeFilters(patch: DirectoryFiltersPatch) {
     writeQuery.cancel();
     onFilterChange({ ...patch, q: text });
   }
 
   function handleClearAll() {
     writeQuery.cancel();
     setText('');
     pendingFocus.current = { to: 'search' };
     onClearAll();
   }
 
   const active = FILTERS.filter((filter) => params[filter.key] !== undefined);
   const inactive = FILTERS.filter((filter) => params[filter.key] === undefined);
   const anythingActive = active.length > 0 || params.q !== undefined;
 
   return (
     <div className={styles.bar}>
       <div className={styles.search}>
         <SearchField
           ref={searchRef}
           label="Search alumni"
           placeholder="Search by name, company or role"
           value={text}
           onChange={handleTextChange}
           maxLength={Q_MAX_LENGTH}
           autoComplete="off"
         />
       </div>
       <div className={styles.filters} role="group" aria-label="Filters">
         {active.map((filter) => {
           const name = `${filter.label}: ${String(params[filter.key])}`;
           return (
             <Chip
               key={filter.key}
               removeLabel={`Remove ${name}`}
               removeButtonRef={chipRefs[filter.key]}
               onRemove={() => {
                 pendingFocus.current = { to: 'pill', key: filter.key };
                 changeFilters({ [filter.key]: undefined });
               }}
             >
               {name}
             </Chip>
           );
         })}
         {inactive.map((filter) => (
           <FilterPopover
             key={filter.key}
             label={filter.label}
             fieldLabel={filter.fieldLabel}
             helperText={filter.helperText}
             maxLength={filter.maxLength}
             inputMode={filter.inputMode}
             validate={filter.validate}
             triggerRef={pillRefs[filter.key]}
             onApply={(value) => {
               pendingFocus.current = { to: 'chip', key: filter.key };
               changeFilters(filter.toPatch(value));
             }}
           />
         ))}
         {anythingActive && (
           <button type="button" className={styles.clearAll} onClick={handleClearAll}>
             Clear all
           </button>
         )}
       </div>
     </div>
   );
 }
diff --git a/packages/frontend/src/features/directory/FilterPopover.module.css b/packages/frontend/src/features/directory/FilterPopover.module.css
new file mode 100644
index 00000000..b71fcadd
--- /dev/null
+++ b/packages/frontend/src/features/directory/FilterPopover.module.css
@@ -0,0 +1,13 @@
+/* Design: docs/design/screens/app/S2-Desktop-Light (a filter pill's panel).
+   The field above an Apply button at the end edge; the panel's own look
+   comes from Popover. */
+
+.panelForm {
+  display: flex;
+  flex-direction: column;
+  gap: var(--space-3);
+}
+
+.apply {
+  align-self: flex-end;
+}
diff --git a/packages/frontend/src/features/directory/FilterPopover.tsx b/packages/frontend/src/features/directory/FilterPopover.tsx
index 9c1812bb..84393a06 100644
--- a/packages/frontend/src/features/directory/FilterPopover.tsx
+++ b/packages/frontend/src/features/directory/FilterPopover.tsx
@@ -1,102 +1,102 @@
 import { useState, type ChangeEvent, type Ref, type SubmitEvent } from 'react';
 import { Button } from '@/components/ui/Button';
 import { Input } from '@/components/ui/Input';
 import { Popover } from '@/components/ui/Popover';
-import styles from './FilterBar.module.css';
+import styles from './FilterPopover.module.css';
 
 export interface FilterPopoverProps {
   /** Pill text, e.g. "Department". Also names the panel ("Department filter"). */
   label: string;
   /** Label of the field inside the panel, e.g. "Graduation year". */
   fieldLabel: string;
   /** Hint under the field. */
   helperText?: string;
   /** Longest accepted text (the API's limit). */
   maxLength: number;
   /** Numeric keypad on phones (graduation year). */
   inputMode?: 'numeric' | 'text';
   /** An error message for `value` (already trimmed), or undefined when it is fine. */
   validate: (value: string) => string | undefined;
   /** Called with the trimmed value when Apply passes validation. The panel closes. */
   onApply: (value: string) => void;
   /** Ref to the pill trigger, so the filter bar can move focus back to it. */
   triggerRef?: Ref<HTMLButtonElement>;
 }
 
 /**
  * A filter pill: opens a panel with one labeled field and Apply (a form, so
  * Enter submits). Invalid input shows its message under the field and keeps
  * the panel open. After Apply the pill is replaced by a chip, so focus is not
  * returned to it (the filter bar moves focus to the chip); Escape and an
  * outside click still return focus to the pill.
  */
 export function FilterPopover({
   label,
   fieldLabel,
   helperText,
   maxLength,
   inputMode = 'text',
   validate,
   onApply,
   triggerRef,
 }: FilterPopoverProps) {
   const [open, setOpen] = useState(false);
   const [applied, setApplied] = useState(false);
   const [value, setValue] = useState('');
   const [error, setError] = useState<string | undefined>(undefined);
 
   function handleOpenChange(next: boolean) {
     if (next) {
       // Every opening starts fresh.
       setValue('');
       setError(undefined);
       setApplied(false);
     }
     setOpen(next);
   }
 
   function handleChange(event: ChangeEvent<HTMLInputElement>) {
     setValue(event.target.value);
     setError(undefined);
   }
 
   function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
     event.preventDefault();
     const trimmed = value.trim();
     const message = validate(trimmed);
     if (message !== undefined) {
       setError(message);
       return;
     }
     setApplied(true);
     setOpen(false);
     onApply(trimmed);
   }
 
   return (
     <Popover
       trigger={label}
       label={`${label} filter`}
       open={open}
       onOpenChange={handleOpenChange}
       finalFocus={!applied}
       triggerRef={triggerRef}
     >
       <form className={styles.panelForm} noValidate onSubmit={handleSubmit}>
         <Input
           label={fieldLabel}
           value={value}
           onChange={handleChange}
           error={error}
           helperText={helperText}
           maxLength={maxLength}
           inputMode={inputMode}
           autoComplete="off"
         />
         <Button type="submit" variant="primary" className={styles.apply}>
           Apply
         </Button>
       </form>
     </Popover>
   );
 }
diff --git a/packages/frontend/src/features/directory/ResultsGrid.module.css b/packages/frontend/src/features/directory/ResultsGrid.module.css
index 7495071e..560e5feb 100644
--- a/packages/frontend/src/features/directory/ResultsGrid.module.css
+++ b/packages/frontend/src/features/directory/ResultsGrid.module.css
@@ -1,36 +1,24 @@
 /* Design: docs/design/screens/app/S2-Desktop-Light / S2-Phone-Light.
    repeat(auto-fill, minmax(260px, 1fr)); 260px is 16.25rem so it scales with
    zoom. The min() keeps one column from overflowing below 260px of room
    (360px phone at 200% zoom). Gap space-4 on phone, space-5 from 48rem
    (design 16px / 24px). */
 
 .grid {
   display: grid;
   grid-template-columns: repeat(auto-fill, minmax(min(16.25rem, 100%), 1fr));
   gap: var(--space-4);
   margin: 0;
   padding: 0;
   list-style: none;
 }
 
 .item {
   min-width: 0;
 }
 
-/* Hidden on screen, still read by assistive tech (same rule as SearchField's). */
-.visuallyHidden {
-  position: absolute;
-  width: 1px;
-  height: 1px;
-  padding: 0;
-  overflow: hidden;
-  clip-path: inset(50%);
-  white-space: nowrap;
-  border: 0;
-}
-
 @media (width >= 48rem) {
   .grid {
     gap: var(--space-5);
   }
 }
diff --git a/packages/frontend/src/features/directory/ResultsGrid.tsx b/packages/frontend/src/features/directory/ResultsGrid.tsx
index bae15e1b..829718db 100644
--- a/packages/frontend/src/features/directory/ResultsGrid.tsx
+++ b/packages/frontend/src/features/directory/ResultsGrid.tsx
@@ -1,43 +1,44 @@
 import type { AlumniListItem } from '@alumni/shared';
+import { VisuallyHidden } from '@/components/ui/VisuallyHidden';
 import { AlumniCard, AlumniCardSkeleton } from './AlumniCard';
 import styles from './ResultsGrid.module.css';
 
 /** Skeleton cards shown while loading, unless the caller asks for another count. */
 export const DEFAULT_SKELETON_COUNT = 6;
 
 export type ResultsGridProps =
   | { loading: true; skeletonCount?: number; items?: never }
   | { loading?: false; items: AlumniListItem[]; skeletonCount?: never };
 
 /**
  * The results grid (auto-fill columns, 260px minimum). Results are a list of
  * card links. While loading it shows skeleton cards instead, hidden from
  * assistive tech, with aria-busy and a "Loading alumni" status.
  */
 export function ResultsGrid(props: ResultsGridProps) {
   if (props.loading === true) {
     const count = props.skeletonCount ?? DEFAULT_SKELETON_COUNT;
     return (
       <div aria-busy="true">
-        <p role="status" className={styles.visuallyHidden}>
+        <VisuallyHidden as="p" role="status">
           Loading alumni…
-        </p>
+        </VisuallyHidden>
         <div className={styles.grid}>
           {Array.from({ length: count }, (_, index) => (
             <AlumniCardSkeleton key={index} />
           ))}
         </div>
       </div>
     );
   }
 
   return (
     <ul className={styles.grid}>
       {props.items.map((alumnus) => (
         <li key={alumnus.id} className={styles.item}>
           <AlumniCard alumnus={alumnus} />
         </li>
       ))}
     </ul>
   );
 }
diff --git a/packages/frontend/src/features/directory/params.test.ts b/packages/frontend/src/features/directory/params.test.ts
index a16fab0f..b3a07de4 100644
--- a/packages/frontend/src/features/directory/params.test.ts
+++ b/packages/frontend/src/features/directory/params.test.ts
@@ -1,133 +1,158 @@
 import { describe, expect, it } from 'vitest';
 import {
   DEPARTMENT_MAX_LENGTH,
   isValidGraduationYear,
   parseDirectoryParams,
   Q_MAX_LENGTH,
+  stripControlCharacters,
   toSearchParams,
   UNIVERSITY_MAX_LENGTH,
   type DirectoryParams,
 } from './params';
 
 const NOW = new Date(2026, 9, 6);
 
 function parse(query: string): DirectoryParams {
   return parseDirectoryParams(new URLSearchParams(query), NOW);
 }
 
 describe('parseDirectoryParams', () => {
   it('reads every valid value', () => {
     expect(
       parse('q=Ada&department=Computer+Science&university=MIT&graduationYear=2017&page=3'),
     ).toEqual({
       q: 'Ada',
       department: 'Computer Science',
       university: 'MIT',
       graduationYear: 2017,
       page: 3,
     });
   });
 
   it('defaults to page 1 with no filters for an empty query string', () => {
     expect(parse('')).toEqual({ page: 1 });
   });
 
   it('trims text and drops empty or blank values', () => {
     expect(parse('q=%20%20Ada%20&department=&university=%20%20')).toEqual({ q: 'Ada', page: 1 });
   });
 
   it.each(['abc', '0', '-1', '10001', '1.5', '', '1e3', ' '])('ignores page=%j', (page) => {
     expect(parse(`page=${encodeURIComponent(page)}`).page).toBe(1);
   });
 
   it('accepts the page limits', () => {
     expect(parse('page=1').page).toBe(1);
     expect(parse('page=10000').page).toBe(10000);
   });
 
   it.each(['20', 'abcd', '1899', '2037', '20170', '2017.0', ''])(
     'drops graduationYear=%j',
     (year) => {
       expect(parse(`graduationYear=${year}`)).toEqual({ page: 1 });
     },
   );
 
   it('accepts years from 1900 to the current year + 10', () => {
     expect(parse('graduationYear=1900').graduationYear).toBe(1900);
     expect(parse('graduationYear=2036').graduationYear).toBe(2036);
   });
 
   it.each([
     ['q', Q_MAX_LENGTH],
     ['department', DEPARTMENT_MAX_LENGTH],
     ['university', UNIVERSITY_MAX_LENGTH],
   ])('drops %s over %i characters but keeps it at the limit', (key, max) => {
     expect(parse(`${key}=${'a'.repeat(max + 1)}`)).toEqual({ page: 1 });
     expect(parse(`${key}=${'a'.repeat(max)}`)).toEqual({ [key]: 'a'.repeat(max), page: 1 });
   });
 
   it('measures the length after trimming', () => {
     expect(parse(`q=%20${'a'.repeat(Q_MAX_LENGTH)}%20`).q).toBe('a'.repeat(Q_MAX_LENGTH));
   });
 
   it.each(['%00', '%01', '%0A', '%1F', '%7F'])(
     'drops text containing the control character %s',
     (c) => {
       expect(parse(`q=Ada${c}&department=CS${c}&university=MIT${c}`)).toEqual({ page: 1 });
     },
   );
 
   it('uses none of the values of a repeated param', () => {
     expect(
       parse(
         'q=a&q=b&department=x&department=y&university=u&university=v&graduationYear=2017&graduationYear=2018&page=2&page=3',
       ),
     ).toEqual({ page: 1 });
   });
 
   it('ignores unknown params', () => {
     expect(parse('pageSize=50&foo=bar&q=Ada')).toEqual({ q: 'Ada', page: 1 });
   });
 });
 
 describe('isValidGraduationYear', () => {
   it('checks 4 digits within range', () => {
     expect(isValidGraduationYear('2017', NOW)).toBe(true);
     expect(isValidGraduationYear(' 2017 ', NOW)).toBe(true);
     expect(isValidGraduationYear('201', NOW)).toBe(false);
     expect(isValidGraduationYear('20a7', NOW)).toBe(false);
     expect(isValidGraduationYear('1899', NOW)).toBe(false);
     expect(isValidGraduationYear('2037', NOW)).toBe(false);
   });
 });
 
 describe('toSearchParams', () => {
   it('leaves out empty values and page 1', () => {
     expect(toSearchParams({ page: 1 }).toString()).toBe('');
     expect(toSearchParams({ q: '  ', department: '', page: 1 }).toString()).toBe('');
   });
 
   it('writes every set value', () => {
     expect(
       toSearchParams({
         q: 'Ada Lovelace',
         department: 'Computer Science',
         university: 'MIT',
         graduationYear: 2017,
         page: 4,
       }).toString(),
     ).toBe('q=Ada+Lovelace&department=Computer+Science&university=MIT&graduationYear=2017&page=4');
   });
 
   it('round-trips through parseDirectoryParams', () => {
     const params: DirectoryParams = {
       q: 'Ada & co',
       department: 'Física',
       university: 'Uni = 1',
       graduationYear: 1999,
       page: 7,
     };
     expect(parseDirectoryParams(toSearchParams(params), NOW)).toEqual(params);
     expect(parseDirectoryParams(toSearchParams({ page: 1 }), NOW)).toEqual({ page: 1 });
   });
+
+  it('writes control characters as spaces, so the reader keeps the value', () => {
+    const search = toSearchParams({
+      q: 'Ada\tLovelace\n',
+      department: 'Computer\u0000Science',
+      university: '\u007fMIT',
+      page: 1,
+    });
+    expect(search.toString()).toBe('q=Ada+Lovelace&department=Computer+Science&university=MIT');
+    expect(parseDirectoryParams(search, NOW)).toEqual({
+      q: 'Ada Lovelace',
+      department: 'Computer Science',
+      university: 'MIT',
+      page: 1,
+    });
+    expect(toSearchParams({ q: '\t\r\n', page: 1 }).toString()).toBe('');
+  });
+});
+
+describe('stripControlCharacters', () => {
+  it('turns each control character into a space and keeps the rest', () => {
+    expect(stripControlCharacters('a\tb\u0000c\u001fd\u007fe')).toBe('a b c d e');
+    expect(stripControlCharacters(' Ünïcode stays ')).toBe(' Ünïcode stays ');
+  });
 });
diff --git a/packages/frontend/src/features/directory/params.ts b/packages/frontend/src/features/directory/params.ts
index 7a3277df..9cbaa93e 100644
--- a/packages/frontend/src/features/directory/params.ts
+++ b/packages/frontend/src/features/directory/params.ts
@@ -1,94 +1,115 @@
 /**
  * The directory's list state lives in the URL query string (ADR-08). These
  * pure helpers read and write it. Anything the API would answer 400 to is
  * ignored on read, so a hand-edited or stale URL never breaks the request.
  * Limits match `GET /api/alumni` (conventions.md → Pagination).
+ *
+ * The numbers below are copies of the backend's, not imports: keep them in sync
+ * with `packages/backend/src/businessLogic/src/validation.ts` (`MAX_PAGE`,
+ * `NAME_MAX` for `q`, `DEPARTMENT_MAX`, `UNIVERSITY_MAX`, and the 1900 / now + 10
+ * year window in `optionalYear`). If the API's limit changes and this file does
+ * not, the page sends a value the API answers 400 to and shows the error state.
  */
 
 export const MAX_PAGE = 10000;
 export const MIN_GRADUATION_YEAR = 1900;
 /** The latest accepted year is the current year plus this many. */
 export const GRADUATION_YEARS_AHEAD = 10;
 export const Q_MAX_LENGTH = 100;
 export const DEPARTMENT_MAX_LENGTH = 100;
 export const UNIVERSITY_MAX_LENGTH = 150;
 
 export interface DirectoryFilters {
   q?: string;
   department?: string;
   university?: string;
   graduationYear?: number;
 }
 
 export interface DirectoryParams extends DirectoryFilters {
   /** 1-based; 1 when absent or invalid. */
   page: number;
 }
 
 // NUL and other control characters: Postgres rejects NUL, the API answers 400 (G23).
 // eslint-disable-next-line no-control-regex
 const CONTROL_CHARACTER = /[\u0000-\u001f\u007f]/;
+// eslint-disable-next-line no-control-regex
+const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/g;
+
+/**
+ * `value` with each control character (a pasted tab or line break) turned into
+ * a space, so what is written to the URL is what the reader keeps.
+ */
+export function stripControlCharacters(value: string): string {
+  return value.replace(CONTROL_CHARACTERS, ' ');
+}
+
+function writableText(value: string | undefined): string | undefined {
+  return value === undefined ? undefined : stripControlCharacters(value).trim();
+}
 
 /** The one value of `key`, or undefined when it is missing or repeated. */
 function singleValue(search: URLSearchParams, key: string): string | undefined {
   const values = search.getAll(key);
   return values.length === 1 ? values[0] : undefined;
 }
 
 function parseText(value: string | undefined, max: number): string | undefined {
   if (value === undefined || CONTROL_CHARACTER.test(value)) return undefined;
   const trimmed = value.trim();
   if (trimmed === '' || trimmed.length > max) return undefined;
   return trimmed;
 }
 
 /** True for a 4-digit year from 1900 to the current year + 10. */
 export function isValidGraduationYear(value: string, now: Date = new Date()): boolean {
   const trimmed = value.trim();
   if (!/^\d{4}$/.test(trimmed)) return false;
   const year = Number(trimmed);
   return year >= MIN_GRADUATION_YEAR && year <= now.getFullYear() + GRADUATION_YEARS_AHEAD;
 }
 
 function parsePage(value: string | undefined): number {
   if (value === undefined || !/^\d+$/.test(value.trim())) return 1;
   const page = Number(value.trim());
   return page >= 1 && page <= MAX_PAGE ? page : 1;
 }
 
 export function parseDirectoryParams(
   search: URLSearchParams,
   now: Date = new Date(),
 ): DirectoryParams {
   const params: DirectoryParams = { page: parsePage(singleValue(search, 'page')) };
   const q = parseText(singleValue(search, 'q'), Q_MAX_LENGTH);
   const department = parseText(singleValue(search, 'department'), DEPARTMENT_MAX_LENGTH);
   const university = parseText(singleValue(search, 'university'), UNIVERSITY_MAX_LENGTH);
   const year = singleValue(search, 'graduationYear');
   if (q !== undefined) params.q = q;
   if (department !== undefined) params.department = department;
   if (university !== undefined) params.university = university;
   if (year !== undefined && isValidGraduationYear(year, now)) {
     params.graduationYear = Number(year.trim());
   }
   return params;
 }
 
 /**
  * The query string for `params`: empty values and page 1 are left out, so the
- * plain directory URL has no query string at all.
+ * plain directory URL has no query string at all. Control characters become
+ * spaces, since `parseDirectoryParams` would drop the whole value.
  */
 export function toSearchParams(params: DirectoryParams): URLSearchParams {
   const search = new URLSearchParams();
-  const q = params.q?.trim();
-  const department = params.department?.trim();
-  const university = params.university?.trim();
+  const q = writableText(params.q);
+  const department = writableText(params.department);
+  const university = writableText(params.university);
   if (q) search.set('q', q);
   if (department) search.set('department', department);
   if (university) search.set('university', university);
   if (params.graduationYear !== undefined) {
     search.set('graduationYear', String(params.graduationYear));
   }
   if (params.page > 1) search.set('page', String(params.page));
   return search;
 }
diff --git a/packages/frontend/src/styles/contrast.test.ts b/packages/frontend/src/styles/contrast.test.ts
index f8896f49..244e7ef2 100644
--- a/packages/frontend/src/styles/contrast.test.ts
+++ b/packages/frontend/src/styles/contrast.test.ts
@@ -1,124 +1,132 @@
 // @vitest-environment node
 // WCAG 2.x contrast for the color pairs the UI primitives actually use, in both
 // themes. The pair list and the accepted exceptions mirror REQ-001
 // architecture.md → Contrast. A token edit that drops a pair below its minimum
 // (or makes an accepted exception worse than its recorded ratio) fails here.
 import { describe, expect, it } from 'vitest';
 import tokensJson from '../../../../docs/design/design-system/tokens.json';
 
 type Theme = 'light' | 'dark';
 
 const colors = new Map(tokensJson.color.tokens.map((t) => [t.name, t.value]));
 
 function color(name: string, theme: Theme): string {
   const value = colors.get(name)?.[theme];
   if (!value) throw new Error(`unknown color token ${name}`);
   return value;
 }
 
 function channel(hex: string, offset: number): number {
   const c = parseInt(hex.slice(offset, offset + 2), 16) / 255;
   return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
 }
 
 function luminance(hex: string): number {
   return 0.2126 * channel(hex, 1) + 0.7152 * channel(hex, 3) + 0.0722 * channel(hex, 5);
 }
 
 function contrastRatio(a: string, b: string): number {
   const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
   return (hi + 0.05) / (lo + 0.05);
 }
 
 const TEXT = 4.5; // WCAG 1.4.3, normal-size text
 const NON_TEXT = 3; // WCAG 1.4.11, UI component boundaries and focus indicators
 
 interface Pair {
   fg: string;
   bg: string;
   min: number;
   use: string;
 }
 
 const PAIRS: Pair[] = [
   { fg: 'ink-primary', bg: 'surface-page', min: TEXT, use: 'body text' },
   { fg: 'ink-primary', bg: 'surface-raised', min: TEXT, use: 'text in a Card' },
   { fg: 'ink-primary', bg: 'surface-sunken', min: TEXT, use: 'Input value text' },
   { fg: 'ink-secondary', bg: 'surface-page', min: TEXT, use: 'helper text, labels' },
   { fg: 'ink-secondary', bg: 'surface-raised', min: TEXT, use: 'helper text in a Card' },
   { fg: 'ink-secondary', bg: 'surface-sunken', min: TEXT, use: 'neutral/status Tag text' },
   { fg: 'ink-secondary', bg: 'surface-sunken', min: TEXT, use: 'Input placeholder, at rest' },
   { fg: 'ink-secondary', bg: 'surface-raised', min: TEXT, use: 'Input placeholder, focused' },
   { fg: 'accent', bg: 'surface-page', min: TEXT, use: 'link text, skip link' },
   { fg: 'accent', bg: 'surface-raised', min: TEXT, use: 'skip link, RouteError link in a Card' },
-  { fg: 'accent-strong', bg: 'surface-raised', min: TEXT, use: 'secondary Button label, hover' },
+  {
+    fg: 'accent-strong',
+    bg: 'surface-raised',
+    min: TEXT,
+    use: 'secondary Button label, hover; Chip remove icon, hover',
+  },
   { fg: 'accent-strong', bg: 'surface-sunken', min: TEXT, use: 'ghost Button label, hover' },
   { fg: 'accent-ink', bg: 'accent', min: TEXT, use: 'primary Button label' },
   { fg: 'accent-ink', bg: 'accent-strong', min: TEXT, use: 'primary Button label, hover' },
-  { fg: 'accent-strong', bg: 'accent-soft', min: TEXT, use: 'accent Tag text' },
-  { fg: 'accent-strong', bg: 'accent-soft', min: TEXT, use: 'Avatar initials, Chip text' },
-  { fg: 'accent-strong', bg: 'surface-raised', min: NON_TEXT, use: 'Chip remove icon, hover' },
+  {
+    fg: 'accent-strong',
+    bg: 'accent-soft',
+    min: TEXT,
+    use: 'accent Tag text, Avatar initials, Chip text',
+  },
   { fg: 'accent', bg: 'accent-soft', min: NON_TEXT, use: 'focus outline on a Chip button' },
   { fg: 'error', bg: 'surface-page', min: TEXT, use: 'Input error text on the page' },
   { fg: 'error', bg: 'surface-raised', min: TEXT, use: 'Input error text in a Card' },
   { fg: 'error', bg: 'surface-sunken', min: TEXT, use: 'Input error text on a sunken panel' },
   { fg: 'ink-primary', bg: 'surface-sunken', min: TEXT, use: 'Alert text' },
   { fg: 'ink-primary', bg: 'accent-soft', min: TEXT, use: 'highlighted Menu item' },
   { fg: 'accent', bg: 'surface-page', min: NON_TEXT, use: 'focus outline' },
   { fg: 'accent', bg: 'surface-raised', min: NON_TEXT, use: 'Input focus border' },
   { fg: 'accent', bg: 'surface-sunken', min: NON_TEXT, use: 'auth panel check marks, Logo' },
   { fg: 'ink-secondary', bg: 'surface-sunken', min: NON_TEXT, use: 'show/hide password icon' },
 ];
 
 // Accepted exceptions: the ratio is the floor recorded in architecture.md;
 // the test fails if a token change makes the pair any worse.
 const EXCEPTIONS: (Pair & { recorded: Record<Theme, number>; reason: string })[] = [
   // The Input's resting border is border-strong (not the design's
   // border-subtle) to make the edge easier to find; still under 3:1 on
   // either side of the line.
   {
     fg: 'border-strong',
     bg: 'surface-sunken',
     min: NON_TEXT,
     use: 'Input resting border, against its fill',
     recorded: { light: 1.44, dark: 1.94 },
     reason: 'the visible label and the sunken fill identify the field (non-text)',
   },
   {
     fg: 'border-strong',
     bg: 'surface-page',
     min: NON_TEXT,
     use: 'Input resting border, against the page',
     recorded: { light: 1.6, dark: 1.83 },
     reason: 'the visible label and the sunken fill identify the field (non-text)',
   },
 ];
 
 describe.each<Theme>(['light', 'dark'])('%s theme contrast', (theme) => {
   it.each(PAIRS)('$fg on $bg ($use) meets $min:1', ({ fg, bg, min }) => {
     const ratio = contrastRatio(color(fg, theme), color(bg, theme));
     expect(ratio, `${fg} on ${bg} is ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(min);
   });
 
   it.each(EXCEPTIONS)(
     '$fg on $bg ($use) is an accepted exception and no worse than recorded',
     ({ fg, bg, min, recorded }) => {
       const ratio = contrastRatio(color(fg, theme), color(bg, theme));
       expect(ratio, `${fg} on ${bg} is ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(
         recorded[theme],
       );
       // If it now passes, drop the exception so the pair is held to the minimum.
       expect(ratio).toBeLessThan(min);
     },
   );
 });
 
 describe('contrastRatio', () => {
   it('matches the WCAG reference values', () => {
     const black = '#000000';
     const white = '#ffffff';
     expect(contrastRatio(black, white)).toBeCloseTo(21, 5);
     expect(contrastRatio(white, white)).toBe(1);
     expect(contrastRatio(white, black)).toBe(contrastRatio(black, white));
   });
 });
```
