# TASK-002 — ESLint, Stylelint, Prettier + tokens-only and import-boundary enforcement

| Field | Value |
|---|---|
| REQ | REQ-001 |
| Tier | 1 |
| Status | complete |
| Repo | alumni-system |
| Depends on | TASK-001 |
| Blocks | TASK-007, TASK-008 |

## Goal

`npm run lint` and `npm run format:check` run cleanly, and the lint setup provably rejects raw colors, shadows, raw spacing/type values in CSS, and forbidden imports into `components/ui/`.

## Files to touch

| Path | Action |
|---|---|
| `packages/frontend/eslint.config.js` | rewrite |
| `packages/frontend/stylelint.config.js` | create |
| `packages/frontend/.prettierrc.json`, `.prettierignore` | create |
| `packages/frontend/scripts/enforcement.test.ts` | create |

## Approach

- **ESLint (flat)**: ignores `dist`, `coverage`. For `**/*.{ts,tsx}`: `@eslint/js` recommended, `tseslint.configs.strictTypeChecked` + `stylisticTypeChecked` with `parserOptions.projectService: true`, `react-hooks` recommended, `react-refresh` vite, `jsx-a11y` flat recommended. Rules: `no-restricted-syntax` for `Literal`/`TemplateElement` matching `/#[0-9a-f]{3,8}\b|\b(rgba?|hsla?)\(/i` (message: "Use a design token (var(--…)) instead of a raw color") and JSX `style` objects with a `boxShadow` key; scoped to `src/**` excluding `src/styles/**`. `no-restricted-imports` override for `src/components/ui/**` using `patterns` groups that block both alias and relative forms — `@/services/**`, `@/store/**`, `@/features/**`, `@/app/**`, `**/services/**`, `**/store/**`, `**/features/**`, `**/app/**` — plus `axios`, `@tanstack/react-query`; for `src/services/**` blocking `react`, `@/components/*`. Config/scripts files get `globals.node`; `**/*.js` config files use `tseslint.configs.disableTypeChecked` (they're not in any tsconfig). `eslint-config-prettier` last.
- **Stylelint**: extends `stylelint-config-standard`; plugin `stylelint-declaration-strict-value`. Rules per architecture.md → Enforcement (`color-no-hex`, `color-named: never`, `function-disallowed-list`, `property-disallowed-list: [box-shadow, text-shadow]`, `scale-unlimited/declaration-strict-value` with the property list and `ignoreValues` for `0`, `inherit`, `initial`, `unset`, `currentColor`, `transparent`, `none`, `auto`, `100%`). Allow `selector-class-pattern` camelCase (CSS Modules). `ignoreFiles: ['src/styles/tokens.css', 'dist/**', 'coverage/**']` — the generated file is exempt from every Stylelint rule (stylelint-config-standard would otherwise reject its long hex like `#ffffff` and the `BlinkMacSystemFont` keyword case). Write `currentcolor` (lowercase) in `ignoreValues`. `global.css` has no `@import` (fonts and tokens are imported from `main.tsx`).
- **Prettier**: `{ "singleQuote": true, "semi": true, "trailingComma": "all", "printWidth": 100 }`; ignore `dist`, `coverage`, `package-lock.json`, `src/styles/tokens.css`.
- **enforcement.test.ts**: uses `ESLint` and `stylelint.lint` Node APIs against in-memory fixtures and asserts the expected rule IDs fire. ESLint with `projectService` returns a fatal parse error (no rule ID) for a file not on disk, so create the ESLint instance with `overrideConfig` that turns type info off for the fixture (`languageOptions.parserOptions: { projectService: false, project: null }` plus `tseslint.configs.disableTypeChecked.rules`) and call `lintText(code, { filePath: 'src/components/ui/__fixture__/Bad.tsx' })` — the enforcement rules are syntactic and don't need types. Assert `messages.every(m => !m.fatal)` before checking rule IDs. Stylelint: `code` + `codeFilename` under `src/components/ui/__fixture__/`; a clean fixture produces zero errors. Runs under Vitest (TASK-003 includes `scripts/**/*.test.ts`); if TASK-003 hasn't landed when this task runs, write the test and verify via the CLI on temp fixture files instead, noting it.

## Acceptance

- [ ] `npm run lint` exits 0 on the TASK-001 tree.
- [ ] `npm run format:check` exits 0; `npx eslint-config-prettier src/main.tsx` reports no conflicting rules.
- [ ] Hex in a `.tsx` → ESLint error; `boxShadow` in a style prop → error; `@/services/x` imported from `src/components/ui/**` → error.
- [ ] In a `.module.css`: `#fff`, `rgb(0 0 0)`, `box-shadow`, `padding: 12px`, `font-size: 14px` → Stylelint errors; `padding: var(--space-3)` → clean.
- [ ] A relative import of `../../services/x` from `src/components/ui/**` → error.
- [ ] `scripts/enforcement.test.ts` passes, with no fatal ESLint messages.
- [ ] `npm run lint` exits 0 even though no `.css` files exist yet (`--allow-empty-input`).

## Related

- Architecture: [[specs/2026-10/m/REQ-001-frontend-foundation/architecture]]
- Lessons checked: none exist yet

## Notes

- Done 2026-10-05. `scripts/enforcement.test.ts` runs under Vitest (14 tests pass, no fatal ESLint messages); starts with `// @vitest-environment node` per TASK-003.
- Out-of-list edits (formatting only, Prettier `--write`): `src/main.tsx`, `src/app/App.tsx`, `README.md` — needed for `format:check`; semicolons added, no logic change.
- **Open at handoff:** `npm run lint` and `format:check` fail only on TASK-003's files, which this task may not edit: `src/test/setup.ts:25,47` (two unnecessary `as` casts flagged by strictTypeChecked) and Prettier formatting of `vite.config.ts`, `src/test/setup.ts`, `src/test/smoke.test.tsx`. Fix: `npx eslint --fix src/test/setup.ts && npx prettier --write vite.config.ts src/test`. With `src/test/**` excluded, ESLint exits 0 and Prettier flags only those three files.
- Stylelint behavior pinned by probe: multi-value shorthands with tokens (`padding: var(--a) var(--b)`), `margin: 0 auto`, `calc(var(--x) * 2)` pass; raw `font-weight: 600` / `line-height: 1.5` fail — TASK-007 needs tokens for them.
- Import-boundary patterns include bare-folder forms (`**/services`) because `**/services/**` does not match `../../services` (verified with Linter).
- Services rule also blocks the relative `**/components` form, not just `@/components/*` (same reasoning as ADV-008).
- Rework 2026-10-05 (flaky timeout): with 126 tests, the first ESLint test timed out at 5s from cold ESLint/plugin load under jsdom CPU contention. The ESLint instance is now built in `beforeAll` (60s timeout), which also runs one warm-up ESLint lint and one Stylelint lint; per-test timeouts remain the default. `npx vitest run` passed 126/126 three times in a row; lint, format:check and typecheck exit 0.
