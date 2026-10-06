# Conventions

Project-specific rules. The reviewer agents (`quality-reviewer`, `architecture-reviewer`) check code against this file. If a convention isn't documented here, it isn't enforced — write it down or accept that the code will drift.

## Naming

> **STATUS: needs verification** — read from the frontend as built in REQ-001 (2026-10-05); confirm these are the rules you want enforced.

- **Files (frontend):** one folder per UI component in PascalCase (`components/ui/Button/`) with `Button.tsx`, `Button.module.css`, `Button.test.tsx`, `index.ts`; other modules camelCase (`httpClient.ts`, `themeAtom.ts`, `useApplyTheme.ts`); tests co-located as `*.test.ts(x)`.
- **Variables / functions:** camelCase; hooks start with `use`; Jotai atoms end with `Atom`.
- **Constants:** SCREAMING_SNAKE_CASE for module-level constants (`THEME_STORAGE_KEY`, `TOKEN_STORAGE_KEY`).
- **Types/interfaces:** PascalCase, no `I` prefix (`ThemePreference`, `ButtonProps`).

## Logging

- **Library:** _(e.g., pino, winston, ILogger)_
- **Levels:** _(when to use debug, info, warn, error)_
- **Structured fields:** _(required fields on every log line)_
- **No `console.log` in production code.**

## Error handling

- _(How errors propagate — exceptions, Result types, error codes?)_
- _(How are unexpected errors surfaced?)_
- _(What gets logged vs. returned vs. swallowed?)_

## Config

- **Source:** _(env vars, config file, secrets manager)_
- **Access pattern:** _(centralized config module, direct env reads?)_
- **No magic strings or numbers** — named constants or config values.

## API conventions

- **Response format:** success bodies are the resource itself, no envelope, except paged lists, which send `{ items, total }` (see **Pagination**; today only `GET /api/alumni`) (deletes send `{ message }`; `POST /api/auth/login` sends 200 `{ token }`; `POST /api/auth/register` sends 201 `{ token, user }`, `user` without the password). Error bodies are always `{ message }`: controllers' `catch` (and the `/auth/login` handler in `AuthRoutes.ts`) calls `api/controllers/sendError.ts`, which sends an `AppError`'s status and message, and a 500 `{ message: "Something went wrong" }` for anything else — never raw error text (pg messages etc.). A wrong email or password is `AppError(401, "Invalid")`. `MeController` still has its own copy of `sendError` (known follow-up: switch it to the shared one).
- **Ids:** `requireId` (businessLogic `validation.ts`) treats an id that is not a positive integer, or is above 2147483647 (the Postgres `integer` max), as malformed and answers 404 without querying.
- **Deleting users:** `DELETE /api/users/:id` returns 409 `{ message: "This user still has posts or comments" }` while the user still has posts or comments (foreign key).
- **Pagination (REQ-005):** offset paging with query params `page` (1 to 10000, default 1) and `pageSize` (1 to 100, default 20); the query runs `LIMIT pageSize OFFSET (page - 1) * pageSize`. The body is `{ items, total }`: `items` is the current page, `total` counts every row that matches the filters (not just this page). Bad input answers 400 `{ message }` (`AppError` from the Manager): a value that is not a whole number in range, or a repeated or nested param (`?page=1&page=2`, `?page[x]=1`, which Express's qs parser turns into an array or object). An empty or blank value counts as absent, so the default applies. Unknown params are ignored. Results need a stable order with a unique tiebreaker (`ORDER BY u.name, a.id`) so pages don't overlap. Parsing lives in businessLogic `validation.ts`: `parseAlumniSearch` (alumni-specific) uses the exported `DEFAULT_PAGE_SIZE`, `MAX_PAGE_SIZE`, `MAX_PAGE` and two private helpers, `singleQueryValue` and `pagingNumber`. When the second paged list arrives, export those helpers (or extract a shared `parsePaging`) and reuse them; don't copy them.
  - **`GET /api/alumni`** (signed-in users, behind `authMiddleware`): filters `q` (≤ 100 chars; case-insensitive substring match on name, current company or job title; `%` and `_` match literally), `department` (≤ 100) and `university` (≤ 150) (both whole-value, case-insensitive match), `graduationYear` (4 digits, 1900 to current year + 10, else 400). Text is trimmed; filters combine with AND. Items never include `email` (shared type `AlumniListItem`; body `AlumniListResponse`).
- **Versioning:** _(URL path vs header vs none)_
- **Auth (REQ-003):** bearer JWT in `Authorization: Bearer <token>`, verified by `authMiddleware`, which sets `req.user = { sub, role }`. Public routes are only `POST /api/auth/login`, `POST /api/auth/register` and `GET /api/health`. Every other router starts with `router.use(authMiddleware)` (not per route), so a route added later is protected automatically. Role gates use `requireRole(...)` per route: `requireRole("admin")` on `GET`/`POST /api/users` and `DELETE /api/users/:id`, `requireRole("alumni")` on `POST /api/alumni`; `requireRole` answers 401 if `req.user` is missing.
  - **Status codes:** 401 = token problem only (missing, malformed, bad signature, expired), because the frontend logs out on any 401 (ADR-03). 403 = signed in but not allowed (wrong role, not the owner). 404 = the thing doesn't exist. Never return 401 for "not allowed".
  - **Identity comes from the token,** never the body: the author/owner id is `req.user.sub` (a `user_id` in the body is ignored).
  - **Ownership checks live in Managers**: load the row, `AppError(404)` if missing, then `AppError(403)` unless allowed. Posts and comments are owner-or-admin (`PostManager`, `CommentManager`; controllers pass `{ id: req.user.sub, role: req.user.role }`). A user's own account and alumni profile are owner-only, admins included (`updateOwnUser`, `updateOwnAlumni`; controllers pass `req.user.sub`). Controllers map `AppError` through `sendError`.
  - **Guard test:** `packages/backend/src/api/routes/routeGuard.test.ts` walks every route on the Express app and fails if one outside the public list answers without a token. A new public route must be added to its allowlist on purpose; a new top-level `app.use(...)` handler must be added to its known-middleware list.
  - The role is read from the JWT, so a demoted admin keeps admin rights until the token expires (≤ 1 h). No revocation yet (ADR-05 consequences).

## Testing

Two Vitest suites: frontend (`packages/frontend`) and backend (`packages/backend`, see **Backend** below). `@alumni/shared` has no tests.

### Frontend

- **Frameworks:** Vitest 5 + React Testing Library 16 + `@testing-library/user-event` 14 + `@testing-library/jest-dom`. Run with `npm test` (`vitest run`) inside `packages/frontend`.
- **Environment:** jsdom 29 by default (pinned: jsdom 30 needs Node ≥ 24.15). Tests under `scripts/` must start with `// @vitest-environment node` — Vitest 5 has no `environmentMatchGlobs`, so without the comment they run in jsdom.
- **Setup (`src/test/setup.ts`):** jest-dom matchers; a `window.matchMedia` stub (default light; `setPrefersDark(bool)` from `@/test/setup` flips it and fires `change`); localStorage, `<html data-theme>` and the stub are reset before and after every test, and RTL `cleanup()` runs after each.
- **Globals off:** import `describe`/`it`/`expect`/`vi` from `vitest` explicitly. `restoreMocks: true` is set.
- **Test file location:** co-located — `Button.tsx` → `Button.test.tsx`; `scripts/foo.ts` → `scripts/foo.test.ts`.
- **CSS in tests:** CSS Module class names are not hashed (`classNameStrategy: 'non-scoped'`), so tests may assert on `.primary` etc. CSS imports are stubbed (`?raw` returns `''`); read files from disk when a test needs CSS content.
- **Mock policy:** mock at the boundary only — HTTP via axios's per-request `adapter` option (no extra mocking library), media queries via the setup stub. Test components through roles and visible text, keyboard paths with `user-event`.
- **Guard tests** that must stay green: `scripts/generate-tokens.test.ts` (tokens.css matches tokens.json), `src/styles/contrast.test.ts` (WCAG pairs), `scripts/enforcement.test.ts` (lint rules still fire), `src/store/themeAtom.test.ts` (no-flash script and atom share the storage key).
- **Coverage expectations:** none enforced yet. `npm run test:coverage` writes a v8 report to `coverage/` (git-ignored).

### Backend

Decided in [[architecture/adr-05-backend-tests-vitest-supertest|ADR-05]] (REQ-003).

- **Frameworks:** Vitest 5 + supertest 7. Run `npm test` (`vitest run`) or `npm run test:watch` inside `packages/backend`, or `npm run test:backend` from the root. No database is needed or touched.
- **Config (`packages/backend/vitest.config.ts`):** one project for `api`, `businessLogic` and `dal`; `environment: 'node'`; includes `src/**/*.test.ts`; `restoreMocks: true`; globals off (import from `vitest`). `test.env` sets `JWT_SECRET` and dummy `DB_*` values before any module loads (`UserController` reads `JWT_SECRET` at import time, and dotenv never overrides a set variable), so don't set them inside a test.
- **`@alumni/businesslogic` is aliased to its source** (`src/businessLogic/src/index.ts`), not the compiled `dist/` its `package.json` points at. Tests never need a rebuild, but a green run says nothing about `dist/`; the running API still needs `tsc` in `businessLogic`. `@alumni/dal` and `@alumni/api` resolve through workspace symlinks to source already.
- **Setup (`src/test/setup.ts`):** mocks `dal/config/db` globally with a fake pool (`query`, `connect`), so no test opens a connection.
- **Three levels, each mocks exactly one boundary:**
  - **HTTP** (supertest on the real `app`, no open port): mock `@alumni/businesslogic` managers. Use a factory with `importOriginal` that keeps the real `AppError` (a plain automock replaces it too). Proves middleware, roles, status codes and which identity reaches the manager.
  - **Manager unit** (`*Manager.test.ts`): mock `@alumni/dal` query classes. Proves business rules (ownership, validation, 409 mapping).
  - **Query unit** (`*Query.test.ts`): use the setup's fake pool and assert on the recorded SQL and params. Proves SQL shape (e.g. no `password` column, `updatePost` never sets `user_id`).
- **Tokens:** `src/api/test/authHelpers.ts` gives `tokenFor({ sub, role })`, `expiredToken()`, `badSignatureToken()` and `bearer(token)`, all signed with the test secret.
- **Shared helpers:** `src/api/test/routeList.ts` derives the route list from the real app (`listRoutes`, `guardedRoutes`, `PUBLIC_ROUTES`, `toRequest`), used by the guard and route tests, so no test keeps a route list by hand. `src/test/expectAppError.ts` asserts a promise or function fails with an `AppError` of a given status (always `await` it).
- **Type-check:** Vitest doesn't type-check. Run `npm run typecheck` in `packages/backend` (or `typecheck:backend` from the root): `tsc --noEmit` on each package, then `tsconfig.test.json`, which covers test files and, like Vitest, resolves `@alumni/businesslogic` to source (so it says nothing about `dist/` either).
- **Test file location:** co-located (`PostManager.ts` → `PostManager.test.ts`); route tests in `src/api/routes/`.
- **Guard test** that must stay green: `src/api/routes/routeGuard.test.ts` (every non-public route answers 401 without a token). It reads Express 4 internals (`app._router.stack`) and asserts a minimum route count, so an Express 5 upgrade breaks it loudly; fix the walker, don't delete it.
- **Not covered:** real SQL against Postgres (no migration runner to build a schema). Revisit when one exists.

## Comments

- _(When are comments expected? When are they noise?)_
- _(TODO/FIXME format — must include a tracking link?)_

## Git

> **STATUS: needs verification** — the pattern used in REQ-001 (2026-10-05).

- **Commit message format:** Conventional Commits with the REQ tag: `feat(frontend): … [REQ-001]`, `fix(…)`, `docs(adlc): …`.
- **Branch naming:** `feat/REQ-NNN-<slug>` (bugs: `bugfix/BUG-NNN-<slug>`).
- **PR title format:** same as the commit format.

## TypeScript

Verified against the tsconfig files on 2026-10-05.

**Backend and shared** — `packages/backend`, `packages/backend/src/{api,businessLogic,dal}` and `packages/shared` extend the root `tsconfig.json` (TypeScript 5.9):

- `strict: true` (implies `noImplicitAny`, `strictNullChecks`); `esModuleInterop`, `skipLibCheck`.
- Target/module `ESNext`, `moduleResolution: bundler`; declarations, declaration maps and source maps are emitted.
- `noUncheckedIndexedAccess` is not enabled.

**Frontend** — `packages/frontend` does **not** extend the root (the root's emit settings left stray `vite.config.js/.d.ts/.map` files beside source). TypeScript **6.0** (not 7: `typescript-eslint` 8.71 supports TS < 6.1). `tsconfig.json` only references the two configs below; `npm run typecheck` runs both.

- `tsconfig.app.json` (`src/`): `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax` (use `import type`), `erasableSyntaxOnly` (no enums, namespaces or parameter properties), `moduleDetection: force`, `noEmit`, `allowImportingTsExtensions`, `jsx: react-jsx`, `types: ["vite/client"]`, target `ES2022`, lib `ES2023 + DOM + DOM.Iterable`, `skipLibCheck`. Path alias `@/*` → `./src/*` via `paths` only — no `baseUrl` (TS 6 rejects it, TS5101).
- `tsconfig.node.json` (`vite.config.ts`, `scripts/**/*.ts`): same strictness flags, `types: ["node"]`, target/lib `ES2023`, `noEmit`. The `.js` lint configs are not type-checked.
- `exactOptionalPropertyTypes` is deliberately off (poor fit with third-party prop types).

## Linting

Verified against `packages/frontend/eslint.config.js`, `stylelint.config.js` and `.prettierrc.json` on 2026-10-05. Frontend only: the backend and shared packages have no lint or format config.

- **ESLint 9.39** (flat config; not 10, because `eslint-plugin-jsx-a11y` supports ESLint ≤ 9). `npm run lint` runs ESLint, then Stylelint.
  - `.ts`/`.tsx`: `@eslint/js` recommended, `typescript-eslint` **strictTypeChecked + stylisticTypeChecked** (type-aware via `projectService`), `react-hooks` recommended, `react-refresh` (Vite), `jsx-a11y` recommended. `.js` files get `@eslint/js` recommended without type info.
  - **Tokens-only rule** (`src/**/*.{ts,tsx}` except `src/styles/**`): no string/template literal matching a raw color (`#rgb…`, `rgb(`, `rgba(`, `hsl(`, `hsla(`), and no `boxShadow` in a JSX `style` prop.
  - **Import boundaries** (`no-restricted-imports`, alias and relative forms both blocked): `src/components/ui/**` may not import `services`, `store`, `features`, `app`, `axios`, `@tanstack/react-query`; `src/services/**` may not import `react`, `components`, `store`, `features` or `app`; `src/store/**` may not import `services`, `features` or `app`; `src/features/**` and the rest of `src/components/**` may not import `app`. So nothing in `features/`, `store/`, `services/` or `components/` may import `app/`. Test files (`*.test.{ts,tsx}`) keep every ban except the `app/` one, so tests may import `app/` providers to render a component. Each layer has one `no-restricted-imports` block for source files and one for its tests, with non-overlapping globs, because flat config does not merge a rule's options across blocks (the last match wins).
  - `eslint-config-prettier` comes last (formatting rules off). `dist/` and `coverage/` are ignored.
- **Stylelint 17** on `src/**/*.css` (`stylelint-config-standard` + `stylelint-declaration-strict-value`): `color-no-hex`, `color-named: never`, no `rgb/rgba/hsl/hsla/hwb/lab/lch/oklch/color()` functions, no `box-shadow`/`text-shadow`. Color, `fill`, `stroke`, `background`, `font`, `font-size`, `line-height`, `font-weight`, `padding*`, `margin*`, `*gap`, `border-radius` must use `var(--…)` or a keyword (`0`, `inherit`, `initial`, `unset`, `currentcolor`, `transparent`, `none`, `auto`, `100%`). 1px hairline border widths are allowed. CSS Module class names must be camelCase. `src/styles/tokens.css` (generated) is exempt.
- **Prettier 3**: single quotes, semicolons, trailing commas everywhere, print width 100. Ignores `dist`, `coverage`, `package-lock.json`, `src/styles/tokens.css`. `npm run format:check` must pass.
- `scripts/enforcement.test.ts` lints bad fixtures through the ESLint and Stylelint Node APIs to prove these rules still fire. Change a rule → update that test.

## Frontend

Applies to `packages/frontend` (rebuilt in REQ-001). Each `src/` folder has a `README.md` with its own rules; this is the summary.

- **Folder purposes:**
  - `app/` — App root, providers (TanStack Query → Jotai), router, shared `QueryClient`, `AppShell` layout, `RouteError`. Nothing in `features/`, `store/`, `services/` or `components/` may import it; in practice only `main.tsx` does.
  - `features/<domain>/` — a domain's hooks, queries and domain components; wires primitives to state and services. May not import `app/`.
  - `components/ui/<Name>/` — design-system primitives, one folder each with `Name.tsx`, `Name.module.css`, `Name.test.tsx`, `index.ts`. Props in, events out.
  - `store/` — Jotai atoms for client-only state. Server data goes in TanStack Query, never in an atom.
  - `services/` — `httpClient.ts` (the one axios instance, `baseURL: '/api'`), `authToken.ts` (the only home of the auth token, `localStorage['token']`) and endpoint functions (`authApi.ts`). No React.
  - `styles/` — generated `tokens.css`, `global.css`. `test/` — Vitest setup only; production code never imports it.
- **Import boundaries:** see Linting (lint-enforced). Use the `@/` alias for cross-folder imports.
- **HTTP:** every API call goes through `httpClient`; its request interceptor is the only place `Authorization` is set. Never build auth headers at a call site, and never call axios from `components/ui/`. Endpoint functions live in `services/` and only return data; storing tokens, caching and navigation belong to the calling feature.
- **401 handling (ADR-03):** `httpClient` has one response interceptor that, on a 401 from a request that carried a token (except `/auth/login` and `/auth/register`), calls the handler registered with `setUnauthorizedHandler(fn)` and re-throws. Only `features/auth/SessionBridge` registers it; never add another 401 interceptor or log out from a call site. The handler acts only if the failed request's token is still the current one. Code that ends a session calls `clearToken()` before navigating, and navigations to `/login` pass `flushSync: true` (needs `RouterProvider` from `react-router/dom`). Signed-in pages go under `RequireAuth`, guest-only pages under `GuestOnly`; redirect-back uses only `location.state.from` through `resolveFrom`, never a URL parameter.
- **Forms (ADR-04):** no form library. Controlled state in the page, pure tested validators in `features/<x>/validation.ts` whose messages mirror the backend's, `useMutation` for submit, server errors mapped by a pure function (e.g. `authErrors.ts`). On submit with errors, show them per field via `Input error` and focus the first invalid field; the submit button gets `loading`. Revisit when a form passes ~8 fields or needs dynamic field arrays.
- **State (ADR-02):** server state → TanStack Query with the shared `QueryClient` (30 s stale time, no refetch on focus, retries ≤ 2 and never on 4xx, mutations not retried). Client-only state → Jotai atoms in `store/`.
- **UI (ADR-01):** no component library. Primitives are our own, styled with CSS Modules using only design tokens. Behavior for complex widgets (dialogs, menus, selects, radio groups) comes from Base UI (`@base-ui/react`, headless), wrapped behind our own props; today `Menu` and `SegmentedControl` use it (`ThemeToggle` is built on `SegmentedControl`).
- **Tokens workflow:** `docs/design/design-system/tokens.json` is the single source for colors, spacing, type, radii and motion (`--duration-fast`, `--easing-standard`). Edit it, run `npm run tokens` to regenerate `src/styles/tokens.css`, run `npm test` (stale-file and contrast tests). Never edit `tokens.css` by hand. Spacing and type are emitted in rem, radii in px; type styles are `font` shorthands (`font: var(--text-label)`). `main.tsx` imports the Inter font, then `tokens.css`, then `global.css`.
- **Motion and layout sizes:** transitions use `var(--duration-fast) var(--easing-standard)` by convention (no lint rule checks it). Layout sizes stay literal and are not tokens (decided in REQ-001 review): e.g. the 72rem content width, the 6px tag dot, 0.5 disabled opacity. Add a token only when a value is shared design language, not a one-off size.
- **Theme:** `themePreferenceAtom` (`light | dark | system`, `localStorage['alumni.theme']`, JSON) + `useApplyTheme` set `<html data-theme>`. The inline script in `index.html` must use the same key (a test checks it). Components get light/dark values only through tokens; today no component CSS uses a `[data-theme]` selector.
- **Focus:** global `:focus-visible` is a 2px accent outline. Input is the exception: its focus signal is the accent border (no ring), per the design README.
- **Package setup:** ESM (`"type": "module"`), Node ≥ 24 (`npm run tokens` runs a `.ts` file with Node's type stripping). React must stay a single copy — after dependency changes check `npm ls react`.

## Anything else specific to this codebase

- _(stack-specific quirks, framework conventions, team preferences)_
