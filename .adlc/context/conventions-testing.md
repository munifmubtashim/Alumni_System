# Conventions — Testing

> Split out of `conventions.md` on 2026-10-06 (`/config budgets`) to keep it under the 8KB budget. Same rules, same wording; nothing summarized. The core file `context/conventions.md` lists the area files. Reviewers: read this one when the change touches tests (frontend or backend).

## Testing

Two Vitest suites: frontend (`packages/frontend`) and backend (`packages/backend`, see **Backend** below). `@alumni/shared` has no tests.

### Frontend

- **Frameworks:** Vitest 5 + React Testing Library 16 + `@testing-library/user-event` 14 + `@testing-library/jest-dom`. Run with `npm test` (`vitest run`) inside `packages/frontend`.
- **Environment:** jsdom 29 by default (pinned: jsdom 30 needs Node ≥ 24.15). Tests under `scripts/` must start with `// @vitest-environment node` — Vitest 5 has no `environmentMatchGlobs`, so without the comment they run in jsdom.
- **Setup (`src/test/setup.ts`):** jest-dom matchers; a `window.matchMedia` stub (default light; `setPrefersDark(bool)` from `@/test/setup` flips it and fires `change`); localStorage, `<html data-theme>` and the stub are reset before and after every test, and RTL `cleanup()` runs after each.
- **Globals off:** import `describe`/`it`/`expect`/`vi` from `vitest` explicitly. `restoreMocks: true` is set.
- **Test file location:** co-located — `Button.tsx` → `Button.test.tsx`; `scripts/foo.ts` → `scripts/foo.test.ts`.
- **CSS in tests:** CSS Module class names are not hashed (`classNameStrategy: 'non-scoped'`), so tests may assert on `.primary` etc. CSS imports are stubbed (`?raw` returns `''`); read files from disk when a test needs CSS content (`node:fs` only works in `scripts/` tests; in `src/` read source text with `import.meta.glob(..., { query: '?raw', import: 'default', eager: true })`, as `app/lazyRoutes.test.ts` does).
- **Mock policy:** mock at the boundary only — HTTP via axios's per-request `adapter` option (no extra mocking library), media queries via the setup stub. Test components through roles and visible text, keyboard paths with `user-event`.
- **Guard tests** that must stay green: `scripts/generate-tokens.test.ts` (tokens.css matches tokens.json), `src/styles/contrast.test.ts` (WCAG pairs), `scripts/enforcement.test.ts` (lint rules still fire), `src/store/themeAtom.test.ts` (no-flash script and atom share the storage key), `src/app/lazyRoutes.test.ts` (nothing statically imports `features/directory`; the ESLint `LAZY_DIRECTORY_BAN` is the first layer).
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
