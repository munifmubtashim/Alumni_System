# Conventions

Project-specific rules. The reviewer agents (`quality-reviewer`, `architecture-reviewer`) check code against this file. If a convention isn't documented here, it isn't enforced — write it down or accept that the code will drift.

> The TypeScript and Linting sections below were partly synthesized from:
> - `tsconfig.json` (root; every package's tsconfig extends it)
> - `packages/frontend/eslint.config.js`
>
> STATUS: needs verification — review each entry; the source configs may have rules I didn't translate.

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

- **Frameworks:** _(jest, vitest, xunit, pytest)_
- **Coverage expectations:** _(per-module minimums, what's exempt)_
- **Mock policy:** _(when to mock, when to integration-test for real)_
- **Test file location:** _(co-located, parallel `tests/` tree)_

## Comments

- _(When are comments expected? When are they noise?)_
- _(TODO/FIXME format — must include a tracking link?)_

## Git

- **Commit message format:** _(e.g., conventional commits: `feat(scope): description`)_
- **Branch naming:** _(e.g., `feat/REQ-xxx-slug`, `bugfix/BUG-xx`)_
- **PR title format:** _(typically matches the commit format)_

## TypeScript

> **STATUS: needs verification** — synthesized from `tsconfig.json` on 2026-10-04. Review and edit; remove this banner when confirmed.

- **Strict mode is on** (`"strict": true`) for every package — the root `tsconfig.json` is extended by backend, api, businessLogic, dal, shared, and frontend. This implies `noImplicitAny` and `strictNullChecks`.
- `noUncheckedIndexedAccess` is not enabled.
- Target/module: `ESNext`, `moduleResolution: bundler`; declarations and source maps are emitted.

## Linting

> **STATUS: needs verification** — synthesized from `packages/frontend/eslint.config.js` on 2026-10-04. Review and edit; remove this banner when confirmed.

- Frontend only: no ESLint config exists for the backend or shared packages.
- Frontend `.ts`/`.tsx` files follow the stock presets: `@eslint/js` recommended, `typescript-eslint` recommended, `react-hooks` recommended, `react-refresh` (Vite). No custom rules are set.
- `dist/` is ignored.

## Anything else specific to this codebase

- _(stack-specific quirks, framework conventions, team preferences)_
