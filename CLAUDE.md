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
- `npm run dev:frontend` — runs the Vite dev server alone (`packages/frontend`).
- `npm run build` (inside `packages/frontend`) — `tsc && vite build`.
- `npm run preview` (inside `packages/frontend`) — preview the frontend production build.
- No test suite exists in this repo yet (no test runner configured).
- No lint script is wired at the root; frontend has an ESLint flat config (`packages/frontend/eslint.config.js`) — run `npx eslint .` from `packages/frontend` if needed.

### Rebuilding businessLogic/dal after editing them

`@alumni/businesslogic`'s `package.json` points `main` at `./dist/index.js` (a compiled build), not its TypeScript source, so **the API process does not pick up changes to `packages/backend/src/businessLogic/src/**` until that package is recompiled** (`tsc` inside `packages/backend/src/businessLogic`, using its local `tsconfig.json`). `@alumni/dal`'s `main` points straight at `index.ts`, so `dal` changes are picked up live by `tsx watch` without a build step. When editing business logic, rebuild before assuming the running API reflects your change.

## Environment

A single `.env` at the repo root is read by both the API server and the DB pool config (each loads it via a relative `dotenv.config({ path: ... })`, so the required relative path differs by file — see `packages/backend/src/api/server.ts` and `packages/backend/src/dal/config/db.ts`). Required vars: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `PORT`, `JWT_SECRET`. Postgres is the only datastore (raw `pg` queries, no ORM/migration tool). Schema changes are hand-written, idempotent SQL files in `db/migrations/` applied with `psql -f` (there's no runner and no record of which migrations have run).

## Architecture

> This section describes the code as it stood before the redesign. Where it disagrees with **Conventions (redesign)** below, the conventions win.

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
- `authApi.ts` decodes the JWT client-side (`atob` on the payload segment) to get `{ id, role }` for `getCurrentUser()` (used for nav/ownership checks; it does not check expiry). Profile data for the logged-in user comes from `GET/PUT /api/me` (`services/meApi.ts`), which identifies the user only from the verified JWT — never from params or body.
- `pages/` are route-level components (`LoginPage`, `DashboardPage`, `PostFeedPage`); `components/` are reusable pieces used by pages (`LoginForm`, `Dashboard`, `PostFeed`).
- Vite dev server has no API proxy configured (`vite.config.ts` is default) — API calls use relative paths like `/api/auth/login`, so confirm how requests actually reach the backend port before assuming same-origin dev works out of the box.

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
- State: Jotai atoms in src/store/.
- UI library: Claude may recommend one; I approve it at the architect gate.
- Scandinavian design: neutral palette, generous whitespace, clean typography, few accents.
- Theme: light, dark, system; toggle in header; choice persisted; follows prefers-color-scheme in system mode.
- All colors/spacing/type come from design tokens; no hardcoded values in components.
- Designs live in docs/design/ (Claude Design bundle); follow them.
- Responsive from 360px up; no layout breaks at 200% zoom.
- Components get typed props from @alumni/shared; no API calls inside UI components.
