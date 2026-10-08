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

## Area conventions (read the one for your area)

The rules for these areas moved to their own files (same wording) so this core file stays under budget. They are in force exactly as before.

- `context/conventions-api.md` — API conventions: response format, ids, pagination (`{ items, total }`), auth and status codes, the `GET /api/alumni` contract.
- `context/conventions-frontend.md` — Frontend: structure, import boundaries, HTTP, session and 401s, state, UI, routing, lazy routes and URL list state (ADR-08), the directory feature.
- `context/conventions-testing.md` — Testing: frontend (Vitest, RTL, guard tests) and backend (Vitest, supertest).

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

Verified against `packages/frontend/eslint.config.js`, `stylelint.config.js` and `.prettierrc.json` on 2026-10-06. Frontend only: the backend and shared packages have no lint or format config.

- **ESLint 9.39** (flat config; not 10, because `eslint-plugin-jsx-a11y` supports ESLint ≤ 9). `npm run lint` runs ESLint, then Stylelint.
  - `.ts`/`.tsx`: `@eslint/js` recommended, `typescript-eslint` **strictTypeChecked + stylisticTypeChecked** (type-aware via `projectService`), `react-hooks` recommended, `react-refresh` (Vite), `jsx-a11y` recommended. `.js` files get `@eslint/js` recommended without type info.
  - **Tokens-only rule** (`src/**/*.{ts,tsx}` except `src/styles/**`): no string/template literal matching a raw color (`#rgb…`, `rgb(`, `rgba(`, `hsl(`, `hsla(`), and no `boxShadow` in a JSX `style` prop.
  - **Import boundaries** (`no-restricted-imports`, alias and relative forms both blocked): `src/components/ui/**` may not import `services`, `store`, `features`, `config`, `app`, `axios`, `@tanstack/react-query`; `src/services/**` may not import `react`, `components`, `store`, `features` or `app`; `src/store/**` may not import `services`, `features` or `app`; `src/config/**` may not import `features`, `components`, `store`, `services` or `app` (a leaf); `src/features/**` and the rest of `src/components/**` may not import `app`. So nothing in `features/`, `store/`, `services/` or `components/` may import `app/`. Test files (`*.test.{ts,tsx}`) keep every ban except the `app/` one, so tests may import `app/` providers to render a component. Each layer has one `no-restricted-imports` block for source files and one for its tests, with non-overlapping globs, because flat config does not merge a rule's options across blocks (the last match wins).
  - `eslint-config-prettier` comes last (formatting rules off). `dist/` and `coverage/` are ignored.
- **Stylelint 17** on `src/**/*.css` (`stylelint-config-standard` + `stylelint-declaration-strict-value`): `color-no-hex`, `color-named: never`, no `rgb/rgba/hsl/hsla/hwb/lab/lch/oklch/color()` functions, no `box-shadow`/`text-shadow`. Color, `fill`, `stroke`, `background`, `font`, `font-size`, `line-height`, `font-weight`, `padding*`, `margin*`, `*gap`, `border-radius` must use `var(--…)` or a keyword (`0`, `inherit`, `initial`, `unset`, `currentcolor`, `transparent`, `none`, `auto`, `100%`). 1px hairline border widths are allowed. CSS Module class names must be camelCase. `src/styles/tokens.css` (generated) is exempt.
- **Prettier 3**: single quotes, semicolons, trailing commas everywhere, print width 100. Ignores `dist`, `coverage`, `package-lock.json`, `src/styles/tokens.css`. `npm run format:check` must pass.
- `scripts/enforcement.test.ts` lints bad fixtures through the ESLint and Stylelint Node APIs to prove these rules still fire. Change a rule → update that test.

## Anything else specific to this codebase

- _(stack-specific quirks, framework conventions, team preferences)_
