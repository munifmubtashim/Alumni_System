# REQ-001 — Codebase exploration

| Field | Value |
|---|---|
| Generated | 2026-10-04 |
| By | codebase-explorer (tier: fast) |
| Repo(s) scanned | alumni-system |

## 1. Similar existing implementations

| Path | What it does | Recommended action |
|---|---|---|
| `packages/frontend/src/services/*.ts` | Axios-based HTTP client wrappers; each service manually reads JWT from localStorage and attaches Bearer token in Authorization header. E.g., `authApi.ts`, `postsApi.ts`, `meApi.ts`. | **Keep pattern**: new HTTP client should centralize token injection in one place, not per-call-site, but the localStorage key and Bearer scheme are correct. Consolidate into a single shared HTTP client in the new build. |
| `packages/frontend/src/store/*.ts` | Jotai atoms for shared state (`currentUserAtom`, `postsAtom`, `accountAtom`). Lightweight atom-per-domain pattern. | **Keep pattern**: Jotai atoms are mentioned in CLAUDE.md conventions; continue using atoms for client state. The new build will have atoms for auth, loading states, and cached data. |
| `packages/frontend/src/hooks/useLogin.ts` | Custom hook managing login submission state and error handling; resolves to a JWT token or null. Called by pages to manage form submission. | **Keep pattern**: continuation of hook-per-flow. The new build's hooks will follow the same mold. |
| `docs/design/design-system/tokens.json` | Complete token set (colors, typography, spacing, radius) in light/dark theme pairs. Used to inform component specs. No code consumes it yet. | **Consume directly**: new components must pull tokens from this file. Tokens must be available to components at build/runtime (via CSS variables, CSS Modules, or CSS-in-JS). This is the **single source of truth**; sync must be automated or enforced by lint. |
| `docs/design/design-system/components/*.md` | READMEs for Button, Input, Card, Tag, ThemeToggle, describing variants, accessibility, token usage, and visual behavior. E.g., "Input: border-subtle at rest → border-strong/accent on focus, no glow." | **Follow exactly**: each component implementation must match its README. Example: Input README says "no glow or outer ring"; a lint rule should block any `box-shadow` outside `styles/`. |
| `packages/frontend/src/theme/AppThemeProvider.tsx` | Old theme provider wrapping the app in antd's ConfigProvider + App. Using antd's theming, not design tokens. | **Replace**: will be deleted. New theme provider will toggle `data-theme` on the document root, and CSS will respond via token values. No UI library theming layer. |

## 2. Blast radius

| Path | Why touched | Risk |
|---|---|---|
| `packages/frontend/src/` | All pages, components, hooks, services, layouts, stores, utils, and content will be deleted per AC "Everything in `packages/frontend/src` from before this REQ is removed". | **high** — complete deletion; but git history preserved and this is the goal. No other package imports from frontend src. |
| `packages/frontend/package.json` | React 18.2.0 → 19 (peer dep version bump); antd + @ant-design/icons removed; new build tooling added (Vitest, React Testing Library, Prettier, ESLint plugins, TS strict flags, path-alias plugins for Vite/esbuild). | **high** — dependency surgery; build script changed from `tsc && vite build` to maintain. |
| `packages/frontend/tsconfig.app.json` | May need `compilerOptions.paths` entry for `@/*` alias pointing to `./src`. `baseUrl` + `paths` are needed for alias resolution in editor and tsc. | **medium** — tsconfig.node.json unaffected. Root tsconfig.json may or may not need `paths` (only if shared across all packages). |
| `packages/frontend/eslint.config.js` | Already exists and references packages not in frontend `package.json`: `eslint`, `globals`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`. These are hoisted to root `node_modules` from root `package.json` devDependencies. Addition of accessibility rules (e.g., `jsx-a11y`) and stricter React rules (no direct API calls in components) will expand config. | **low** — config extends, no code deletion. Hoisting works; no change needed unless those packages are removed from root. |
| `packages/frontend/index.html` | Can remain unchanged: has `<div id="root"></div>` and script src pointing to `main.tsx`, which matches React 19 entry pattern. | **low** — no changes needed. Pure HTML; Vite will inject the build output the same way. |
| `packages/frontend/public/` | Public assets (`favicon.svg`, `icons.svg`) stay. Will be copied to dist/ by Vite build. | **low** — no changes. |
| `.adlc/context/conventions.md` | Frontend section describes old antd-based state management, missing test framework, and no design token enforcement. Needs rewrite to document new build (Vitest + RTL, design-token-only colors, lint rules for no raw colors, path aliases, strict TypeScript flags). | **medium** — documentation-only change; doesn't affect code. Reviewer agents will use this to validate. |
| `/CLAUDE.md` (root) | "Frontend" section (lines 69–76) and "Commands" section (lines 26–40) describe old antd state, lack of test setup, and Vite dev server with no proxy. Must update to describe new build, new Commands (npm run typecheck, npm run lint, npm run format, npm run test), and that a Vite proxy to `/api` is now configured (or a note on relative path dev behavior). Also "Conventions (redesign)" lines 90–99 are target state and should remain. | **medium** — documentation updates for onboarding and CI/CD. Violations won't break the build but will confuse the team. |
| `packages/frontend/.gitignore` | Already lists compiled files (`vite.config.js`, `.d.ts`, `.map`) emitted by root tsconfig.json. No change needed; existing entries cover new emitted files. | **low** — pattern already correct. |
| `packages/backend/src/api/app.ts` | CORS is enabled with default settings (`cors()` with no options) — allows all origins and credentials. Vite dev server makes requests from `http://localhost:5173` (or similar) to `http://localhost:3000/api/*`; CORS will work without change. No frontend-specific change needed. | **low** — backend unchanged; relying on existing CORS open-ness. If CORS config tightens later, Vite proxy configuration in frontend may be needed. |
| `packages/shared/package.json` | `main` points to `src/index.ts` (source, no build). Frontend continues to import types from `@alumni/shared`. Frontend new types (e.g., component prop types, theme context shapes) may be added to `packages/shared` later or kept in frontend; decision is for architect. | **low** — shared package doesn't change for this REQ. Frontend consumes it as-is. |
| Root `.gitignore` | Already lists `packages/frontend/vite.config.js*` compiled artifacts. No new entries needed unless a new temp-file pattern emerges. | **low** — existing pattern sufficient. |
| Root `tsconfig.json` | Has `declaration: true`, `declarationMap: true`, `sourceMap: true`, which causes TypeScript to emit `.d.ts`, `.d.ts.map`, `.js.map` files next to source. This is why `vite.config.ts` → `vite.config.js` + `.d.ts` files. Frontend package doesn't need these for Vite build (Vite handles TS natively); root tsconfig could exclude these flags from frontend's `tsconfig.app.json` by setting them to false locally, but they're already ignored by git. No frontend-facing change needed; if desired, root tsconfig could move these to backend-only config. | **low** — working as designed; root config unaffected for this REQ. |

## 3. Integration points

### API communication
- **Backend listens on `PORT` from `.env` (default 3000).** Frontend dev server (Vite, default 5173) makes requests to relative paths `/api/*`. CORS is open; requests reach the backend without proxy configuration needed in Vite. (Spec AC: "npm run dev serves the app, and a relative /api/... request from the browser reaches the local API server" — this already works.)
- **Auth token persistence:** Token is stored in `localStorage.getItem("token")` after login/register. Each API call reads it and attaches `Authorization: Bearer <token>`. New HTTP client must centralize this in one place (not per-call-site), but localStorage key and Bearer scheme are non-negotiable (backend expects them).
- **Backend auth middleware** (`packages/backend/src/api/Middleware/authMiddleware.ts`, line 11) expects `Authorization` header with a token; splits on space and verifies. No change needed.
- **JWT payload** decoded client-side (line 17 of `packages/frontend/src/services/authApi.ts`) via `atob` to extract `{ sub, role, exp }`. New code should continue this pattern for nav checks; do not remove.
- **Public routes:** `/api/auth/*` (login, register) are public (no authMiddleware). All other routes (`/api/users/*`, `/api/posts/*`, `/api/comments/*`, `/api/alumni/*`, `/api/me/*`) apply authMiddleware. Frontend pages importing these must be guarded by auth checks, which the shell's routing layer handles.

### Design system
- **Tokens are defined in `docs/design/design-system/tokens.json`** with light/dark pairs for colors, typography (family, size, line-height, weight), spacing (4px scale, space-1 through space-8), and radius (sm/md/lg/pill).
- **Every color, space, and type style must come from tokens.** Spec AC: "An automated check (lint rule or test) fails when a file under `src/` outside `styles/` contains a raw color value." — this is enforced (future work during /architect gate).
- **No `box-shadow`:** Design system principle is "borders, not shadows." Lint must reject box-shadow outside `styles/`. (Input README: "no glow or outer ring"; Button README: "no shadow or glow".)
- **Theme toggle:** Must flip `data-theme` on the document root between `light` and `dark`; all CSS reacts via CSS custom properties or equivalent. `System` mode listens to `prefers-color-scheme` and updates live.

### Shared types
- **@alumni/shared exports only types.** Frontend imports `type { Post, User, Comment, Alumni, AuthResponse, ... }` from it. New components will likely add prop types to shared if they're reusable across the API and frontend; otherwise keep them in frontend. Decision for /architect.
- **No runtime code in shared.** Shared is source-only; no build step. Frontend directly consumes `src/index.ts`.

### Build and dev tooling
- **Path aliases:** Spec AC requires `@/components/ui/Button` style imports. Vite + TypeScript both need config. `tsconfig.app.json` gets `compilerOptions.paths: { "@/*": ["./src/*"] }`; `vite.config.ts` needs `resolve.alias` or a Vite plugin (e.g., `@vitejs/plugin-basic-ssl` is standard but doesn't handle `@/` — use explicit alias or `vite-tsconfig-paths`).
- **TypeScript strict mode:** Root tsconfig.json already has `strict: true`. Spec AC: "npm run typecheck — TypeScript with strict: true, zero errors." No additional flags at frontend level unless /architect approves (spec mentions `noUncheckedIndexedAccess` as an open question).
- **Linting:** ESLint flat config already in place; references hoisted packages from root `package.json`. Spec requires zero lint errors on clean checkout; no custom rules currently, but a no-raw-colors lint rule must be added or configured.
- **Formatting:** Spec AC: "npm run format:check — Prettier reports no unformatted files; npm run format fixes them. ESLint and Prettier do not fight." Prettier config must exist and not conflict with ESLint. (No Prettier config exists yet; added during /implement.)

### State management
- **Jotai atoms remain the primary client-state mechanism** (per CLAUDE.md conventions). Each domain (auth, posts, UI loading states) gets an atom or atom family in `src/store/`.
- **TanStack Query adoption is an open question** (spec line 68: "If TanStack Query is adopted...then its provider is wired into the app root"). This is a decision for /architect, recorded as an ADR. If adopted, the line between Query (server state, caching) and Jotai (client state, UI) must be documented; if not, HTTP calls are wrapped in atoms or hooks (current approach).

### Project layout
- Spec AC: "`src/` is organized as `app/`, `features/`, `components/ui/`, `store/`, `services/`, `styles/` (plus a test-setup location)." Each folder's purpose documented in README or conventions doc. No breaking change to backend; purely frontend restructuring.

## 4. Test coverage

| Test file | Scenarios covered | Gaps for new code |
|---|---|---|
| _None exist_ | — | **Complete gap:** Spec AC requires "npm test — Vitest + React Testing Library, runs once and exits with a pass." New code must have at least one test per UI primitive (Button, Input, Card, Tag, ThemeToggle variants and keyboard/accessible behavior). Spec AC line 61: "Each primitive has at least one React Testing Library test covering its variants and its keyboard/accessible behavior." No test framework is configured; Vitest + RTL setup is part of /implement. |

## Vault references

None. Vault is newly initialized; no prior lessons, gotchas, ADRs, or concepts yet.

## Open questions

1. **Hoisted dependencies in frontend ESLint config:** `packages/frontend/eslint.config.js` imports `eslint`, `globals`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh` — none listed in `packages/frontend/package.json`. These are in root `package.json` devDependencies and hoisted to `root/node_modules/`. Will this setup continue in the new build, or should these be added to frontend `package.json`? (Hoisting is valid in npm workspaces; decision is for /architect.)
2. **Design tokens delivery mechanism:** Spec AC says "every color, spacing, radius and type-style token in tokens.json is available to components." How? CSS custom properties (`--accent`, `--space-4`), CSS Modules (importing a generated `.module.css`), a Tailwind-like utility layer, or a TypeScript constant export? This determines how `tokens.json` stays in sync and how lint rules validate no raw colors. Decision for /architect.
3. **Path alias plugin for Vite:** Standard approaches are `resolve.alias` in `vite.config.ts`, `@vitejs/plugin-tsconfigpaths`, or manual entries. Which? Decision for /architect.
4. **Lint rule for no raw colors:** Spec AC: "An automated check (lint rule or test) fails when a file under src/ outside styles/ contains a raw color value." Implementation options: a custom ESLint rule, a Stylelint rule (if CSS files), or a Biome rule. Decision for /architect, recorded as an ADR if a non-standard tool is chosen.

