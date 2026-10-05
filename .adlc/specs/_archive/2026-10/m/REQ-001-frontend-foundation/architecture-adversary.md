# Architecture adversary — REQ-001-frontend-foundation

Written by: architecture-adversary (tier: balanced), dispatched sub-agent.

| Field | Value |
|---|---|
| Generated | 2026-10-04 |
| Trigger | new-adr, large-blast-radius, ui-surface |
| Verdict | found problems |

## Summary

Checked 10 tasks, 2 ADRs, all spec ACs, and the design READMEs. I ran the risky tool wiring (Stylelint 17, ESLint 9 + typescript-eslint 8.71, Node 24.14) in the scratchpad, outside the repo. 9 findings: 0 critical, 5 major, 4 minor (3 trivials not listed). The biggest: TASK-002's lint tooling cannot pass its own acceptance as written (ADV-001, ADV-002, ADV-003), so the "tokens-only is enforced" AC rests on a setup nobody ran.

Dispatch questions: package versions and peers checked (all fine except jsdom/Node, ADV-007); TS 6 vs backend TS 5 hoisting checked, nothing (root keeps 5.9.3, frontend nests 6.0.x); Node type-stripping for `generate-tokens.ts` checked, works (with a warning).

## Findings

### ADV-001: Enforcement test lints a file that does not exist, so ESLint returns a parse error

| Field | Value |
|---|---|
| Severity | major |
| Confidence | high |
| Lens | testability |
| Where | `tasks/TASK-002.md` §Approach (enforcement.test.ts), architecture.md §Enforcement |

**What:** The test calls `lintText` with `filePath: src/components/ui/Bad.tsx` while ESLint runs with `projectService: true`. The file is not on disk.
**Break scenario:** I reproduced it with the same setup: result is one fatal "Parsing error ... not found by the project service" with `ruleId: null`. The test asserts specific rule IDs, so it fails, or the implementer weakens it. With a real file on disk the same config reports `no-restricted-syntax`.
**Why it holds up:** I tried an in-memory path under `src/` that the tsconfig `include` glob covers. The glob is matched against disk, so it does not help.
**Recommendation:** In TASK-002, commit small fixture files (for example `scripts/fixtures/bad/*.tsx`, `*.module.css`) inside a tsconfig-covered path and exclude them from `eslint .`/`stylelint` via ignores. Or run the test's ESLint instance without type info (`disableTypeChecked`), since the rules under test are syntactic. Say which in the task.

### ADV-002: `npm run lint` cannot exit 0 on the TASK-002 tree

| Field | Value |
|---|---|
| Severity | major |
| Confidence | high |
| Lens | testability |
| Where | `tasks/TASK-002.md` Acceptance 1, `TASK-001.md` §Scripts, architecture.md §Toolchain (`lint`) |

**What:** Two wiring gaps. (a) `stylelint "src/**/*.css"` exits 1 with `NoFilesFoundError` when no CSS exists, and no CSS exists until TASK-004. (b) `stylelint.config.js` is written as ESM, but `packages/frontend/package.json` has no `"type": "module"` and TASK-001 does not add it.
**Break scenario:** Implementer runs `npm run lint` at the end of TASK-002 per its acceptance. (a) the `&&` chain fails; (b) Stylelint's config loader throws `SyntaxError: Unexpected token 'export'`. I reproduced both on Node 24 / Stylelint 17. (ESLint's config and the TS script load fine, with only a warning.)
**Why it holds up:** Node's module-syntax detection rescued the ESLint config and `generate-tokens.ts`, but not Stylelint's CommonJS-first loader.
**Recommendation:** TASK-001: add `"type": "module"` to `packages/frontend/package.json` (also removes the Node warning). TASK-001/002: change the script to `stylelint "src/**/*.css" --allow-empty-input`. Re-check Vite/Vitest still load config after the type change.

### ADV-003: `stylelint-config-standard` rejects the generated `tokens.css` and the planned CSS

| Field | Value |
|---|---|
| Severity | major |
| Confidence | high |
| Lens | contradiction |
| Where | `tasks/TASK-002.md` (override for tokens.css), `TASK-004.md` (global.css, generator) |

**What:** TASK-002 turns off only the token rules for `tokens.css`. The standard config's style rules still fire on it, and on the planned `global.css`.
**Break scenario:** Run against a file shaped like the generator output, Stylelint 17 reports: `#ffffff` must be `#fff` (`color-hex-length`), `BlinkMacSystemFont`/`Helvetica`/`Arial` must be lowercase (`value-keyword-case`), missing blank line before custom properties. The planned `@import '@fontsource-variable/inter';` fails `import-notation` (needs `url(...)`), and `currentColor` (listed in `ignoreValues`) fails `value-keyword-case`. TASK-004's `lint` acceptance then fails, and the generator would have to mangle JSON values to please a linter. Also, the ESLint `ignores` entry for `tokens.css` is meaningless; ESLint never lints CSS.
**Why it holds up:** I looked for a built-in exemption for generated files and found none.
**Recommendation:** Put `src/styles/tokens.css` in Stylelint `ignoreFiles` (not a rule override). Use `@import url('@fontsource-variable/inter');` in global.css and `currentcolor` in `ignoreValues`. Drop the ESLint ignore for it.

### ADV-004: Nothing imports `tokens.css`, so every `var(--…)` is undefined in the browser

| Field | Value |
|---|---|
| Severity | minor |
| Confidence | high |
| Lens | omission |
| Where | `tasks/TASK-004.md` (global.css, main.tsx edit), architecture.md §Design tokens |

**What:** `main.tsx` imports only `global.css`, and the listed content of `global.css` has no `@import './tokens.css'`.
**Break scenario:** All tests are green (jsdom doesn't process CSS), `build` passes, and `npm run dev` shows an unstyled page with no theme colors. Caught only at the `/review` browser pass.
**Why it holds up:** An implementer may add it by instinct, but the task is explicit about both files and silent on this link, and no test detects it.
**Recommendation:** TASK-004: first line of `global.css` imports `./tokens.css`; add an assertion in `tokens.test.ts` that `global.css` contains that import.

### ADV-005: Auth token lives in two places; ADR-02 and the architecture disagree

| Field | Value |
|---|---|
| Severity | major |
| Confidence | high |
| Lens | contradiction |
| Where | `adr-02` §Decision table (token in Jotai atoms) vs architecture.md §Server state (`services/authToken.ts` over localStorage), `TASK-005.md` |

**What:** ADR-02 says the auth session token and decoded user claims are client state in Jotai. The plan makes `httpClient` read `localStorage['token']` through a plain module, which sits below the store and cannot import it (services may not import React/UI, and the `store` direction is undecided).
**Break scenario:** The auth REQ follows the ADR and puts the token in an atom for reactive UI; the interceptor still reads localStorage. The two drift (logout clears one, other-tab login updates one). Alternatively the auth REQ follows the code and the ADR is wrong the day it's accepted.
**Why it holds up:** I looked for a sync mechanism (atom reading `authToken`, or the reverse) in the architecture and tasks. There isn't one.
**Recommendation:** Before the gate, pick one and fix the other document. Simplest: ADR-02 table says "the token's storage is `services/authToken.ts`; atoms hold decoded claims derived from it", and note which layer may import which.

### ADV-006: The plan builds known WCAG AA contrast failures with no check to catch them

| Field | Value |
|---|---|
| Severity | major |
| Confidence | high (math), medium (how the user weighs it) |
| Lens | ux-consistency |
| Where | `docs/design/design-system/README.md` ("every pairing meets 4.5:1"), Button/Input/Tag READMEs, `TASK-007.md` |

**What:** I computed contrast from `tokens.json` (light theme). Warning-tone Tag text on `surface-sunken`: 3.0:1. Success: 4.0:1. Primary Button `accent-ink` on `accent` at 13px: 4.0:1. Input helper text (`ink-muted`, 12px) on page: 3.1:1, on sunken 2.8:1. Input resting border vs fill: 1.15:1. The design system's claim of 4.5:1 is false for these. The plan flags only the Input focus ring (architecture §Risks).
**Break scenario:** TASK-007 builds exactly per README. `jsx-a11y` and jest-dom cannot see contrast. The ui-reviewer sees a normal-looking UI. Every later page inherits low-contrast helper text and warning tags.
**Why it holds up:** Dark theme passes everywhere (5.8:1 or better), so the issue is light-only and easy to miss in a dark-mode spot check. No AC requires contrast, but the design system itself promises it.
**Recommendation:** Add a contrast check for the token pairs the primitives use (a test in `tokens.test.ts` is enough). Then give the user the choice at the gate: accept design as-is, or use `ink-secondary` for helper text and neutral text with a tone-colored dot for status Tags. Record the choice in TASK-007.

### ADV-007: `jsdom` is unpinned and its current major needs a newer Node than the one installed

| Field | Value |
|---|---|
| Severity | minor |
| Confidence | medium |
| Lens | failure-mode |
| Where | `tasks/TASK-001.md` (deps list `jsdom`), architecture.md §Toolchain |

**What:** `npm view`: jsdom 30.1.x requires Node `^22.22.2 || ^24.15.0 || >=26`. Installed Node is 24.14.1. jsdom 29.1 supports `>=24.0.0`. No `engines`, `.nvmrc`, or `.npmrc` pins any of this.
**Break scenario:** TASK-001 `npm install` resolves jsdom 30 and prints EBADENGINE; the whole test harness (TASK-003) then runs on an unsupported Node, with possible runtime failures that look like React or Vitest bugs.
**Why it holds up:** npm only warns, so it may work; I can't prove it breaks. But the risk is avoidable by one pin.
**Recommendation:** TASK-001: pin `jsdom@^29.1`, and add `"engines": {"node": ">=24"}` to the frontend package.

### ADV-008: The "UI never imports services" rule is bypassed by a relative path

| Field | Value |
|---|---|
| Severity | minor |
| Confidence | medium |
| Lens | testability |
| Where | `tasks/TASK-002.md` (`no-restricted-imports`), spec AC "make no API calls and import nothing from services/" |

**What:** The banned patterns are `@/services/*`, `@/store/*` etc. Nothing bans `../../../services/httpClient`.
**Break scenario:** A later component imports the client by relative path; lint passes and the architecture claim "lint-enforced import boundary" is false.
**Why it holds up:** `@/` is the convention, but the whole point of the rule is not to rely on convention.
**Recommendation:** Add `**/services/**`, `**/store/**`, `**/features/**`, `**/app/**` as patterns (not just `@/` forms), and add a relative-import fixture to the enforcement test.

### ADV-009: Tokens are emitted in `px`, so type and spacing ignore the user's browser font-size setting

| Field | Value |
|---|---|
| Severity | minor |
| Confidence | medium |
| Lens | ux-consistency |
| Where | architecture.md §Design tokens, `TASK-004.md` |

**What:** The generator copies `16px`, `26px` etc. straight through. The spec checks only 200% zoom, which px survives; a raised default font size does not scale px text.
**Break scenario:** A user with browser default font at 20px gets 16px body text everywhere.
**Why it holds up:** Design-system values are in px, but `N/16 rem` is identical at defaults, so converting breaks no design.
**Recommendation:** Make `renderTokensCss` output rem for spacing, radius (except pill) and font sizes; test it. Or record "px, accepted" in the architecture.

## Coverage

- **Lenses run:** omission, failure-mode, hidden-coupling, rollback, contradiction, testability, ux-consistency.
- **Lenses skipped:** cross-repo (single repo). Rollback found nothing: old code is in git, the work is on a feature branch, and deleting `src/` before removing antd has no runtime effect.
- **Acceptance-criteria coverage:** every AC in Clean slate, Toolchain, Structure, Design tokens and theme, UI primitives, App shell, Server-state/HTTP, and Decisions recorded was checked against the tasks. All map to a task. Tokens-only enforcement (ADV-001/002/003/008), reload/live-theme (checked, nothing), no-flash (checked, nothing; relies on `/review` browser pass as the plan states), 360px/200% zoom (manual only; stated in the plan), ThemeToggle announced correctly (checked, nothing; Base UI fallback is stated in TASK-008).

(3 trivials not listed: Stylelint strict-value ignores values inside functions like `min(100%, 12px)`; TASK-003's "lint still passes" acceptance runs in parallel with TASK-002; the hex regex flags anchors like `'#feed'`.)
