# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Alumni System: an alumni networking/social platform (login, posts feed with comments, alumni profiles). npm workspaces monorepo with a React/Vite frontend, an Express/Postgres backend split into layered sub-packages, and a shared types package.

## Commands

Run from the repo root unless noted.

- `npm run dev` — runs both the API and frontend concurrently (dev only).
- `npm run dev:api` — runs the API alone (`tsx watch server.ts` inside `packages/backend/src/api`), auto-reloads on change.
- `npm run dev:frontend` — runs the Vite dev server alone (`packages/frontend`).
- `npm run build` (inside `packages/frontend`) — `tsc && vite build`.
- `npm run preview` (inside `packages/frontend`) — preview the frontend production build.
- No test suite exists in this repo yet (no test runner configured).
- No lint script is wired at the root; frontend has an ESLint flat config (`packages/frontend/eslint.config.js`) — run `npx eslint .` from `packages/frontend` if needed.

### Rebuilding businessLogic/dal after editing them

`@alumni/businesslogic`'s `package.json` points `main` at `./dist/index.js` (a compiled build), not its TypeScript source, so **the API process does not pick up changes to `packages/backend/src/businessLogic/src/**` until that package is recompiled** (`tsc` inside `packages/backend/src/businessLogic`, using its local `tsconfig.json`). `@alumni/dal`'s `main` points straight at `index.ts`, so `dal` changes are picked up live by `tsx watch` without a build step. When editing business logic, rebuild before assuming the running API reflects your change.

## Environment

A single `.env` at the repo root is read by both the API server and the DB pool config (each loads it via a relative `dotenv.config({ path: ... })`, so the required relative path differs by file — see `packages/backend/src/api/server.ts` and `packages/backend/src/dal/config/db.ts`). Required vars: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `PORT`, `JWT_SECRET`. Postgres is the only datastore (raw `pg` queries, no ORM/migration tool).

## Architecture

### Backend: strict layered pipeline

`packages/backend/src` contains three independent npm workspaces that form one request pipeline. Each layer only imports from the layer directly below it via its workspace package name (never reach across a layer):

```
routes (Express Router) → controllers → businessLogic Managers → dal Query classes → pg Pool
      @alumni/api                         @alumni/businesslogic         @alumni/dal
```

- **`api/`** (`@alumni/api`) — Express app wiring. `app.ts` mounts routers under `/api/*`; `server.ts` is the entrypoint (`dotenv.config` + `app.listen`). `routes/*Routes.ts` map HTTP verbs/paths straight to named exports in `controllers/*Controller.ts`. Controllers parse `req`/`res`, construct DTOs, call a `*Manager`, and translate results/errors into HTTP responses (each controller function has its own try/catch → status code, no shared error-handling middleware). `Middleware/authMiddleware.ts` (note the filename's mixed case: `authMIddleware.ts`) verifies the JWT and sets `req.user`; `Middleware/roleMiddleware.ts` (`requireRole(...roles)`) gates by `req.user.role`. `types/express.d.ts` augments `Express.Request` with `user: { sub, role }`. **Not all routes currently apply `authMiddleware`/`requireRole`** — check each route file rather than assuming auth is enforced.
- **`businessLogic/`** (`@alumni/businesslogic`) — one `*Manager` class per domain (`PostManager`, `CommentManager`, `AlumniManager`, `UserManager`), each a thin pass-through to a corresponding `dal` `*Query` class. This is where cross-entity rules would go (e.g. `PostManager.updateCommentCount`) but most methods today are 1:1 delegations. `TestManager.ts` is scratch/manual-test code (commented-out calls), not a real module.
- **`dal/`** (`@alumni/dal`) — data access. `config/db.ts` creates the single shared `pg.Pool`. `dto/*DTO.ts` are plain classes (constructor-based, `id!: number` set after construction) implementing `BaseDTO`; they double as the shape passed into `Query` methods and as parsed rows returned from queries — controllers build a DTO instance even for read/delete calls just to carry an id. `query/*Query.ts` hold the raw parameterized SQL (`pool.query('...', [params])`) — this is the only place SQL should live. `index.ts` re-exports the public DTOs/Queries other packages should import.

Each backend sub-package is its own workspace with its own `package.json`/`tsconfig.json` (extending the root `tsconfig.json`), and is linked into the root `node_modules/@alumni/*` via npm workspace symlinks — import via the package name (`@alumni/businesslogic`, `@alumni/dal`), never by relative path across package boundaries.

### Shared types

`packages/shared` (`@alumni/shared`) exports plain TypeScript interfaces/types (`alumni.types.ts`, `comment.types.ts`, `post.types.ts`, `user.types.ts`) consumed by the frontend for API response shapes (e.g. `import type { Post } from "@alumni/shared"`). It has no runtime code. Note this is a parallel, separate type surface from the backend's `dal` DTOs (classes with constructors) — they aren't the same types, so keep them in sync manually when a shape changes.

### Frontend

`packages/frontend/src`, React + Vite + TypeScript, routed with `react-router-dom`, styled via `antd`, state via `jotai` atoms (`store/*Atom.ts`, e.g. `postsAtom`, `postsLoadingAtom`, `currentUserAtom`).

- `services/*Api.ts` wrap `axios` calls to the backend (e.g. `authApi.ts`, `postsApi.ts`); authenticated calls manually attach `Authorization: Bearer <token>` read from `localStorage` (no axios interceptor — each call site builds its own headers).
- `authApi.ts` decodes the JWT client-side (`atob` on the payload segment) to get `{ id, role }` for `getCurrentUser()` — there is no `/me` endpoint.
- `pages/` are route-level components (`LoginPage`, `DashboardPage`, `PostFeedPage`); `components/` are reusable pieces used by pages (`LoginForm`, `Dashboard`, `PostFeed`).
- Vite dev server has no API proxy configured (`vite.config.ts` is default) — API calls use relative paths like `/api/auth/login`, so confirm how requests actually reach the backend port before assuming same-origin dev works out of the box.
