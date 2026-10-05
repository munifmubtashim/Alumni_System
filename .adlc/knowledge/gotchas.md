# Gotchas

Consolidated list of codebase quirks — things that exist for non-obvious reasons and **should not be simplified, removed, or "cleaned up" without understanding why they're there**.

Each entry has a stable `^g##` block anchor. Reference from other vault pages as `[[knowledge/gotchas#^g05|G05]]`.

## How to add an entry

1. Find the highest existing `^g##` anchor and increment.
2. Append a new entry using the shape in `templates/gotcha-template.md`.
3. Link from relevant spec/concept/component pages.
4. Append a line to `hot.md`: `## [DATE] gotcha | G## — title`.

## Distinction from lessons

- **Gotcha:** "this code does X for non-obvious reason Y — don't simplify it." Describes *existing* weirdness.
- **Lesson:** "next time you do X, remember Y." Describes *future* behavior.

Use both. They serve different purposes.

---

## Entries

<!-- Newest entries below this line. Add new ones at the bottom; existing anchors must not be renumbered. -->

## G01 — Theme storage key is duplicated in index.html and themeAtom.ts ^g01

| Field | Value |
|---|---|
| Discovered | 2026-10-05 |
| REQ | REQ-001 |
| Component | frontend / theme |
| Status | confirmed |
| Severity | trap |

**What:** The key `alumni.theme` and the light/dark/system resolution exist twice: in the inline no-flash script and in the Jotai atom.

**Where:** `packages/frontend/index.html` (inline `<script>` in `<head>`), `packages/frontend/src/store/themeAtom.ts` (`THEME_STORAGE_KEY`)

**Why it's surprising:** One constant would be the normal design, but the inline script runs before any module loads, so it can't import it.

**Why it exists:** Avoiding a light flash on load needs a blocking script before the stylesheet. A test (`themeAtom.test.ts`) asserts the two keys match and runs the script in jsdom; jsdom's injected-script global has no `matchMedia`, so the test bridges it through `document`.

**Don't:** Don't rename the key or change the stored format (JSON string) in one place only. Don't turn the inline script into a module.

**Related:** [[knowledge/components/frontend]] · [[REQ-001]]

## G02 — Vitest is nested under packages/frontend, and @vitest/mocker must sit beside it ^g02

| Field | Value |
|---|---|
| Discovered | 2026-10-05 |
| REQ | REQ-001 |
| Component | npm workspaces |
| Status | confirmed |
| Severity | careful |

**What:** Root `@types/node@20` (backend) forces vitest and vite to install under `packages/frontend/node_modules`. If `@vitest/mocker` is hoisted to the root alone, it can't resolve `vite` ("Cannot find package 'vite'").

**Where:** `package-lock.json` entries for `vite`, `vitest`, `@vitest/*`

**Why it's surprising:** Workspace hoisting usually just works.

**Why it exists:** Peer-range conflicts between the backend's and the frontend's toolchains.

**Don't:** Don't hand-edit those lock entries. If vitest breaks after an install, delete the vite/vitest/@vitest lock entries and reinstall.

**Related:** [[knowledge/components/frontend]] · [[REQ-001]]

## G03 — Frontend tsconfigs stand alone: no extending root, no baseUrl ^g03

| Field | Value |
|---|---|
| Discovered | 2026-10-05 |
| REQ | REQ-001 |
| Component | frontend / toolchain |
| Status | confirmed |
| Severity | careful |

**What:** `packages/frontend/tsconfig*.json` don't extend the repo-root `tsconfig.json`, and use `paths` without `baseUrl`.

**Where:** `packages/frontend/tsconfig.app.json`, `tsconfig.node.json`, root `tsconfig.json`

**Why it's surprising:** Every other package extends the root.

**Why it exists:** The root turns on declaration/source-map emit, which left compiled `vite.config.js/.d.ts/.map` beside source. TypeScript 6 makes `baseUrl` a hard error (TS5101).

**Don't:** Don't add `extends: ../../tsconfig.json` or `baseUrl` back.

**Related:** [[knowledge/components/frontend]] · [[REQ-001]]

## G04 — Stylelint rejects bare numbers for type props; hover rules use :where() for specificity ^g04

| Field | Value |
|---|---|
| Discovered | 2026-10-05 |
| REQ | REQ-001 |
| Component | frontend / css |
| Status | confirmed |
| Severity | trap |

**What:** `font-weight: 600` and `line-height: 1.5` fail lint (use `var(--text-*-weight|line)`), and hover guards are wrapped in `:where(...)`.

**Where:** `packages/frontend/stylelint.config.js` (declaration-strict-value), `src/components/ui/Button/Button.module.css`, `Input/Input.module.css`

**Why it's surprising:** Unitless numbers look harmless, and `:where()` looks redundant.

**Why it exists:** Tokens-only enforcement covers type props too. Without `:where()`, `.input:hover:not(:disabled)` out-ranks `.input:focus` and hides the focus border.

**Don't:** Don't remove the `:where()` wrappers. Don't silence the strict-value rule for a quick value; add or use a token.

**Related:** [[knowledge/components/frontend]] · [[REQ-001]]

## G05 — Base UI 1.8 Radio: focus via :focus-visible, name from text, hidden native input ^g05

| Field | Value |
|---|---|
| Discovered | 2026-10-05 |
| REQ | REQ-001 |
| Component | frontend / ui-primitives |
| Status | confirmed |
| Severity | careful |

**What:** Base UI's `Radio.Root` sets no `data-focus-visible`. Its accessible name is its text content. It also renders a visually hidden native `<input type=radio>` (`aria-hidden`, `tabIndex=-1`).

**Where:** `packages/frontend/src/components/ui/ThemeToggle/ThemeToggle.tsx`, `.module.css`

**Why it's surprising:** Docs for other headless libs use focus data attributes, and DOM queries find six radios for three options.

**Why it exists:** Library behavior in @base-ui/react 1.8.

**Don't:** Don't style focus with `[data-focus-visible]`. Don't count `input[type=radio]` in tests or audits; query `role=radio`.

**Related:** [[knowledge/components/frontend]] · [[REQ-001]]

## G06 — generate-tokens.ts detects CLI runs by realpath; Vitest stubs CSS imports ^g06

| Field | Value |
|---|---|
| Discovered | 2026-10-05 |
| REQ | REQ-001 |
| Component | frontend / design-tokens |
| Status | confirmed |
| Severity | careful |

**What:** The token script compares `realpathSync(argv[1])` with its own resolved path to decide whether to run, and its test reads `tokens.css` from disk rather than importing it.

**Where:** `packages/frontend/scripts/generate-tokens.ts` (`isCliEntry`), `scripts/generate-tokens.test.ts`

**Why it's surprising:** `import.meta.url === argv[1]` or `import css from '…?raw'` would be the obvious code.

**Why it exists:** Through a symlinked path the plain comparison is false, and `tokens:check` would exit 0 without checking. Vitest returns '' for CSS imports, even with `?raw`.

**Don't:** Don't simplify `isCliEntry` back to a string compare. Don't import CSS in tests to read it.

**Related:** [[knowledge/components/frontend]] · [[REQ-001]]

## G07 — Lint self-test lints fixtures without type info; some lint behaviour is pinned on purpose ^g07

| Field | Value |
|---|---|
| Discovered | 2026-10-05 |
| REQ | REQ-001 |
| Component | frontend / linting |
| Status | confirmed |
| Severity | trap |

**What:** `scripts/enforcement.test.ts` lints in-memory fixtures with type-aware parsing turned off. It also pins two deliberate behaviors: a bare `'#feed'` string is flagged as a color, and TanStack Query tests use `client.query()` with `retryDelay: 0`.

**Where:** `packages/frontend/scripts/enforcement.test.ts`, `eslint.config.js`, `src/app/queryClient.test.ts`

**Why it's surprising:** Type-aware ESLint on a path not on disk returns a fatal parse error with no rule ID, so a naive test passes or fails for the wrong reason. `fetchQuery` is deprecated in TanStack Query 5.104 and fails `no-deprecated`.

**Why it exists:** Fixture correctness, and deliberate review decisions (REQ-001 m11, TASK-005).

**Don't:** Don't switch the fixtures back to type-aware parsing. Don't "fix" the `#feed` flag; use a non-hex anchor or the documented escape. Don't use `fetchQuery`.

**Related:** [[knowledge/components/frontend]] · [[REQ-001]]
