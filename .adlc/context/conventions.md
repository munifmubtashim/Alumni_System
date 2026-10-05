# Conventions

Project-specific rules. The reviewer agents (`quality-reviewer`, `architecture-reviewer`) check code against this file. If a convention isn't documented here, it isn't enforced — write it down or accept that the code will drift.

## Naming

- **Files:** _(e.g., kebab-case for .ts, PascalCase for .tsx components)_
- **Variables:** _(e.g., camelCase, no single-letter except for loop indices)_
- **Constants:** _(e.g., SCREAMING_SNAKE_CASE)_
- **Types/interfaces:** _(e.g., PascalCase, no `I` prefix)_

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

- **Response format:** _(e.g., `{ data, error }`, `{ success, payload }`)_
- **Pagination:** _(cursor vs offset, page size limits)_
- **Versioning:** _(URL path vs header vs none)_
- **Auth:** _(bearer token, session cookie, API key)_

## Testing

Frontend only (`packages/frontend`). The backend and `@alumni/shared` have no test runner yet.

- **Frameworks:** Vitest 5 + React Testing Library 16 + `@testing-library/user-event` 14 + `@testing-library/jest-dom`. Run with `npm test` (`vitest run`) inside `packages/frontend`.
- **Environment:** jsdom 29 by default (pinned: jsdom 30 needs Node ≥ 24.15). Tests under `scripts/` must start with `// @vitest-environment node` — Vitest 5 has no `environmentMatchGlobs`, so without the comment they run in jsdom.
- **Setup (`src/test/setup.ts`):** jest-dom matchers; a `window.matchMedia` stub (default light; `setPrefersDark(bool)` from `@/test/setup` flips it and fires `change`); localStorage, `<html data-theme>` and the stub are reset before and after every test, and RTL `cleanup()` runs after each.
- **Globals off:** import `describe`/`it`/`expect`/`vi` from `vitest` explicitly. `restoreMocks: true` is set.
- **Test file location:** co-located — `Button.tsx` → `Button.test.tsx`; `scripts/foo.ts` → `scripts/foo.test.ts`.
- **CSS in tests:** CSS Module class names are not hashed (`classNameStrategy: 'non-scoped'`), so tests may assert on `.primary` etc. CSS imports are stubbed (`?raw` returns `''`); read files from disk when a test needs CSS content.
- **Mock policy:** mock at the boundary only — HTTP via axios's per-request `adapter` option (no extra mocking library), media queries via the setup stub. Test components through roles and visible text, keyboard paths with `user-event`.
- **Guard tests** that must stay green: `scripts/generate-tokens.test.ts` (tokens.css matches tokens.json), `src/styles/contrast.test.ts` (WCAG pairs), `scripts/enforcement.test.ts` (lint rules still fire), `src/store/themeAtom.test.ts` (no-flash script and atom share the storage key).
- **Coverage expectations:** none enforced yet. `npm run test:coverage` writes a v8 report to `coverage/` (git-ignored).

## Comments

- _(When are comments expected? When are they noise?)_
- _(TODO/FIXME format — must include a tracking link?)_

## Git

- **Commit message format:** _(e.g., conventional commits: `feat(scope): description`)_
- **Branch naming:** _(e.g., `feat/REQ-xxx-slug`, `bugfix/BUG-xx`)_
- **PR title format:** _(typically matches the commit format)_

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
  - `services/` — `httpClient.ts` (the one axios instance, `baseURL: '/api'`) and `authToken.ts` (the only home of the auth token, `localStorage['token']`). No React.
  - `styles/` — generated `tokens.css`, `global.css`. `test/` — Vitest setup only; production code never imports it.
- **Import boundaries:** see Linting (lint-enforced). Use the `@/` alias for cross-folder imports.
- **HTTP:** every API call goes through `httpClient`; its request interceptor is the only place `Authorization` is set. Never build auth headers at a call site, and never call axios from `components/ui/`.
- **State (ADR-02):** server state → TanStack Query with the shared `QueryClient` (30 s stale time, no refetch on focus, retries ≤ 2 and never on 4xx, mutations not retried). Client-only state → Jotai atoms in `store/`.
- **UI (ADR-01):** no component library. Primitives are our own, styled with CSS Modules using only design tokens. Behavior for complex widgets (dialogs, menus, selects, radio groups) comes from Base UI (`@base-ui/react`, headless), wrapped behind our own props; only `ThemeToggle` uses it today.
- **Tokens workflow:** `docs/design/design-system/tokens.json` is the single source for colors, spacing, type, radii and motion (`--duration-fast`, `--easing-standard`). Edit it, run `npm run tokens` to regenerate `src/styles/tokens.css`, run `npm test` (stale-file and contrast tests). Never edit `tokens.css` by hand. Spacing and type are emitted in rem, radii in px; type styles are `font` shorthands (`font: var(--text-label)`). `main.tsx` imports the Inter font, then `tokens.css`, then `global.css`.
- **Motion and layout sizes:** transitions use `var(--duration-fast) var(--easing-standard)` by convention (no lint rule checks it). Layout sizes stay literal and are not tokens (decided in REQ-001 review): e.g. the 72rem content width, the 6px tag dot, 0.5 disabled opacity. Add a token only when a value is shared design language, not a one-off size.
- **Theme:** `themePreferenceAtom` (`light | dark | system`, `localStorage['alumni.theme']`, JSON) + `useApplyTheme` set `<html data-theme>`. The inline script in `index.html` must use the same key (a test checks it). Components get light/dark values only through tokens; today no component CSS uses a `[data-theme]` selector.
- **Focus:** global `:focus-visible` is a 2px accent outline. Input is the exception: its focus signal is the accent border (no ring), per the design README.
- **Package setup:** ESM (`"type": "module"`), Node ≥ 24 (`npm run tokens` runs a `.ts` file with Node's type stripping). React must stay a single copy — after dependency changes check `npm ls react`.

## Anything else specific to this codebase

- _(stack-specific quirks, framework conventions, team preferences)_
