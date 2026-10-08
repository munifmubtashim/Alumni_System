# TASK-003 — Vitest + React Testing Library harness

| Field | Value |
|---|---|
| REQ | REQ-001 |
| Tier | 1 |
| Status | complete |
| Repo | alumni-system |
| Depends on | TASK-001 |
| Blocks | TASK-004, TASK-005 |

## Goal

`npm test` runs Vitest once in jsdom with RTL, jest-dom matchers, the `@/` alias, and exits 0.

## Files to touch

| Path | Action |
|---|---|
| `packages/frontend/vite.config.ts` | edit — `test` block |
| `packages/frontend/src/test/setup.ts` | create |
| `packages/frontend/src/test/smoke.test.tsx` | create |
| `packages/frontend/tsconfig.app.json` | edit only if needed for test types |

## Approach

- `test: { environment: 'jsdom', setupFiles: ['./src/test/setup.ts'], include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'], css: { modules: { classNameStrategy: 'non-scoped' } }, restoreMocks: true, coverage: { provider: 'v8', include: ['src/**'], exclude: ['src/test/**', '**/*.test.*'] } }`. Scripts' tests run in `node` environment via `environmentMatchGlobs` or a per-file `// @vitest-environment node` comment.
- `setup.ts`: `import '@testing-library/jest-dom/vitest'`; `afterEach(cleanup)`; clear `localStorage`; remove `data-theme` from `<html>`; install a controllable `window.matchMedia` stub (exported helper `setPrefersDark(bool)` that fires `change` listeners) since jsdom lacks it.
- `smoke.test.tsx`: renders a tiny component imported via `@/` alias and asserts `toBeInTheDocument()`; asserts `matchMedia` stub responds to `setPrefersDark`.

## Acceptance

- [ ] `npm test` exits 0 with the smoke test passing.
- [ ] `npm run test:coverage` produces a report without error.
- [ ] `npm run typecheck` still passes (test files type-check with explicit `vitest` imports, no globals).
- [ ] `npm run lint` still passes for the new files.

## Notes

### Implementation notes (2026-10-05)

- **No `environmentMatchGlobs` in Vitest 5.0.3** (removed). scripts/** tests (TASK-002's `scripts/enforcement.test.ts`) must start with `// @vitest-environment node`, or they run in jsdom. `setup.ts` guards all DOM work on `typeof window !== 'undefined'` so it loads in either environment.
- **setup.ts** resets state in both `beforeEach` and `afterEach` (clears localStorage, removes `data-theme`, resets the matchMedia stub to light and drops its listeners); `cleanup()` runs after each test. `setPrefersDark` is exported from `@/test/setup` and only fires `change` listeners when the value actually changes. The stub also supports the deprecated `addListener`/`removeListener`.
- **Smoke test** covers: RTL render + jest-dom matcher, the `@/` alias (renders the placeholder `App`), the matchMedia stub, and state reset between tests (one test leaks state, the next asserts it is gone; relies on Vitest's default in-file sequential order).
- **tsconfig.app.json untouched:** the side-effect import of `@testing-library/jest-dom/vitest` in setup.ts (which is under `src/`) gives the matcher types; no `types` change needed.
- **Checks run:** `npm test` 5/5 pass; `npm run test:coverage` writes a v8 report; `npm run typecheck` passes; `npm run lint` exits 0 under the TASK-001 ESLint config (TASK-002's ESLint/Stylelint/Prettier configs had not landed yet). Prettier with default settings flags the new files; re-check `format:check` once `.prettierrc.json` exists.
- **Re-run after TASK-002 configs landed:** `eslint --fix` dropped two unneeded type assertions in setup.ts (the stub object already matches `MediaQueryList` and the `typeof === 'function'` check already narrows the listener), and `prettier --write` reformatted the three files (semicolons). lint, format:check, test (19/19, including `scripts/enforcement.test.ts` in Node), and typecheck all exit 0.
- **Follow-up (out of scope):** `coverage/` is not in `packages/frontend/.gitignore` and was linted by `eslint .` (3 warnings). I deleted the generated folder. TASK-002 should ignore it in ESLint/Prettier; someone should add it to `.gitignore`.

## Related

- Architecture: [[specs/2026-10/m/REQ-001-frontend-foundation/architecture]]
- Lessons checked: none exist yet
