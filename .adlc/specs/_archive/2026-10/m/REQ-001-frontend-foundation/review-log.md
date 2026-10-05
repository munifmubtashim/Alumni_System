# REQ-001-frontend-foundation — Review log

Full reviewer narratives. The consolidated verdict lives in `verification.md` —
read that first; come here for the long form behind a finding ID.

## Correctness findings

Written by: correctness-reviewer (tier: balanced)

**Summary:** Read all 95 added/changed source, config and script files in the packet (app, ui primitives, theme, services, store, token generator, vite/eslint/test setup). 0 critical, 0 major, 3 minor, 1 trivial not listed. Biggest: the token generator's "run only when executed directly" check can silently do nothing, which would make `tokens:check` pass on a stale file. Dispatch questions: none given. Packet-gap: none.

### CORR-001: `generate-tokens.ts` can silently exit 0 without doing anything

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/frontend/scripts/generate-tokens.ts:1344-1347` |
| Category | logic |

**What:** The CLI runs only if `pathToFileURL(process.argv[1]).href === import.meta.url`. Node sets `import.meta.url` from the real path (symlinks resolved), but `argv[1]` is not resolved. If the repo or `scripts/` is reached through a symlink, the two differ and the script exits 0 with no output.
**Why it matters:** `npm run tokens:check` (meant for CI) would report success without checking, so a stale `tokens.css` slips through. `npm run tokens` would silently not write. The Vitest test still guards drift, which is why this is minor. Not run here; confirm with `ln -s` and run `node scripts/generate-tokens.ts --check`.
**Recommendation:** Compare `pathToFileURL(realpathSync(entry)).href` to `import.meta.url`, or use `import.meta.main` (Node 24.2+; `engines` says `>=24.0`, so bump it if you do).

### CORR-002: Dev proxy port can be wrong or empty

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/frontend/vite.config.ts:3873` |
| Category | input-validation |

**What:** `loadEnv(mode, repoRoot, '').PORT ?? '3000'` loads the whole shell environment too, and `??` does not catch an empty string.
**Why it matters:** A stray `PORT=5173` (or `PORT=`) in the developer's shell or an empty `PORT=` line in `.env` gives a proxy target of `http://localhost:` or the Vite port itself, so every `/api` call fails or loops with an unhelpful error. The API itself would use the same shell `PORT`, so the two may agree; the empty case is the real gap.
**Recommendation:** Use `const apiPort = loadEnv(...).PORT || '3000'` and optionally check it is digits.

### CORR-003: `RouteError` hides the error completely in production

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/frontend/src/app/RouteError.tsx:1605-1609` (packet lines) |
| Category | error-handling |

**What:** The error is logged only when `import.meta.env.DEV`. In a production build the user sees "Something went wrong" and nothing is logged or reported.
**Why it matters:** A crash in a deployed build leaves no trace in the console to attach to a bug report. There is also no check for `isRouteErrorResponse` (404/401 get the same message).
**Recommendation:** Always `console.error(error)` (or call a reporting hook later). Keep the generic text on screen. Optional: branch on `isRouteErrorResponse` once feature routes can throw responses.

(1 trivial not listed: `index.html` no-flash script falls back to light, while the atom falls back to system, when the stored value is not valid JSON.)

### Round 2 re-review

Written by: correctness-reviewer (tier: balanced). Read the 17 round-2 files in the packet plus `vite.config.ts` and `src/test/setup.ts` on disk. Round 1: 3 of 3 resolved. New: 0 critical, 0 major, 1 minor (CORR-004), 1 trivial (CORR-005). Tests were not run (read-only).

| Round-1 ID | Status | Evidence |
|---|---|---|
| CORR-001 (m5) | resolved | `generate-tokens.ts` `isCliEntry()` compares `realpathSync(argv[1])` with `realpathSync(fileURLToPath(import.meta.url))`; the `existsSync` guard keeps it false under Vitest (argv[1] is the vitest binary, a different file). |
| CORR-002 (m6) | resolved | `vite.config.ts:14-15` falls back to 3000 on undefined or `''`. Left as is: a stray shell `PORT` still wins via `loadEnv(..., '')`, but the API reads the same variable, so they agree. |
| CORR-003 (m7) | resolved | `RouteError.tsx` calls `console.error(error)` in every build; the new outer-layer test asserts the call. |

### CORR-004: Layer-ban globs `**/app`, `**/services` etc. also match npm sub-paths, and ban `app/` for feature tests

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/frontend/eslint.config.js` (`layerBan`, `NO_APP`) |
| Category | logic |

**What:** `layerBan` adds `**/<layer>` and `**/<layer>/**`, which match any specifier containing that segment, not only our folders. So `import ... from 'firebase/app'` or `'some-lib/components/x'` (in services) is reported as a boundary breach. Separately, `NO_APP` covers every file under `src/features/**`, including `*.test.tsx`, so a feature test that wraps its render in `AppProviders` (`@/app/providers`) fails lint.
**Why it matters:** Not hit today (the suite is green per the packet), but the first third-party sub-path import or the first feature test using `AppProviders` gets a misleading "Only src/main.tsx may import from app/" error.
**Recommendation:** Keep the relative-path catch but anchor it: use `../**/<layer>`, `../**/<layer>/**` (relative only) next to the `@/` forms, so bare package names are untouched. Provide a render helper in `src/test/` for feature tests, or add a test-file `ignores` to the features block. Add one allowed-import case (`'firebase/app'`) to `enforcement.test.ts`.

### CORR-005: `checkMotion` validates durations only

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `packages/frontend/scripts/generate-tokens.ts` `checkMotion` |
| Category | input-validation |

**What:** `easing-standard` and any non-`duration-` name pass through unchecked into the CSS, so `"ease; } x {"` in `tokens.json` would emit broken CSS. Also `^\d+ms$` rejects `0.5ms`-style values (fine today).
**Why it matters:** `tokens.json` is design-owner input, so risk is a typo, not an attack. A typo is caught by Stylelint/build, not by the generator.
**Recommendation:** Optional: reject values containing `;`, `{`, `}` for all motion tokens.

Checked, nothing: new `RAW_COLOR` regex (`#abcde`/`#faded` correctly skipped, `#feed` flagged, alternation backtracks correctly; `ANCHOR_ATTR` also exempts any `to`/`href` literal, harmless); ThemeToggle `::after` (extra grid row is zero-height so only width is reserved; unsupported `content: ... / ''` syntax drops the declaration and degrades to the old width jump; accessible name unaffected); `RouteError` effect logs once per error object (StrictMode dev double-run is cosmetic); AppShell test `setPrefersDark` import and `act` wrapper match the existing smoke test usage.

### Round 3 re-review

**CORR-004: resolved.** Ran the real config through the ESLint API (34 import cases). `firebase/app` passes in ui and features; `features/foo/x.test.tsx` and `ui/Button/x.test.tsx` importing `../../app/providers` pass; the same import from non-test feature or ui source is blocked. Test files in ui still hit the `axios` and `services` bans.
**CORR-005: left as-is** (trivial, accepted).

**New-hole check: none found.** Blocked as expected, from ui/services/store/features: `./services`, `../services`, `../../services/x`, `../../../services/x/index`, `../../../../src/services/x`, `@/services/x`, bare folders such as `../features`. Source-block and test-block globs do not overlap: the test block copies the source `files` with `*.test.` and keeps `ignores`, the source block ignores `**/*.test.*`, and `components/**` ignores `ui/**`. So no file gets two `no-restricted-imports` blocks and none replaces the other's options. Features has only NO_APP, so no test block is emitted, which is correct.

### CORR-006: Relative-form globs can false-positive on same-named local paths
**Severity:** Low (over-blocking, not a hole)
**What:** `./**/app` also matches `./app` and `./x/app`. Test: `./app` imported from a ui file is blocked, so a sibling file or folder named `app`, `store`, `services` or `features` inside a layer fails lint even though it is not the layer.
**Recommendation:** Accept and note it in the conventions, or rename the local file. No change needed now.

Not covered (existing, not new): `src/` folders outside the listed globs (hooks, lib) have no boundary; store importing `components` is allowed by design.

## Quality findings

Written by: quality-reviewer (tier: balanced), dispatched sub-agent

**Summary:** Checked 95 added/modified files (packet diff) against `conventions.md` (Testing, TypeScript, Linting, Frontend sections). 7 findings: 0 critical, 0 major, 6 minor, 1 trivial. Biggest: the Naming, Logging, Error handling, Config, Comments and Git sections of `conventions.md` are still blank templates, so most quality rules cannot be enforced yet (QUAL-001). Duplication of `cx` in ThemeToggle, RouteError inline styles and the partly unenforced import boundaries are already filed as ARCH-003, ARCH-002, ARCH-001, so not repeated here. Dead/debug code: checked, nothing (the only `console.error` is DEV-gated in `RouteError.tsx:7`). TODO/FIXME: none. Commented-out code: none. Co-located test naming: followed.

**Packet-gap:** none for the packet itself. I also read `.adlc/context/conventions.md` (required reading) and grepped `docs/`, `src/`, README for the old accent hex values: no stale copies.

### QUAL-001: Most `conventions.md` sections are still template placeholders

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `.adlc/context/conventions.md:5-61` |
| Category | documentation (convention-gap) |
| Rule | n/a: this is the gap |

**What:** Naming, Logging, Error handling, Config, API, Comments and Git are all `_(e.g., ...)_` placeholders; only Testing, TypeScript, Linting and Frontend were filled in by this REQ.
**Why it matters:** The diff already follows de facto rules nobody wrote down (PascalCase component folders, camelCase CSS classes, `SCREAMING_SNAKE` constants like `THEME_STORAGE_KEY`, `useX` hooks, `import type`, DEV-only `console.error`, TODO format). Reviewers cannot flag drift from them.
**Recommendation:** Fill Naming, Logging (is `console.error` in DEV allowed?), Comments (TODO needs a link?) and Git (commit/branch format used here: `feat(frontend): ... [REQ-001]`, `feat/REQ-001-slug`) from what the code already does. Mark the backend-only sections "n/a for frontend".

### QUAL-002: Lint self-test never exercises the `services/` import rule

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/frontend/scripts/enforcement.test.ts:1005-1092` |
| Category | test-coverage |
| Rule | conventions.md Linting: "Change a rule -> update that test" |

**What:** All ESLint cases lint a file under `components/ui/__fixture__`. The `src/services/**` override (no `react`, no `components`) has no fixture, and Stylelint's `/^margin/`, `/gap$/`, `border-radius` and `selector-class-pattern` rules have none either.
**Why it matters:** Conventions list this test as a guard that must stay green; the services rule could be deleted or broken and it would still pass.
**Recommendation:** Add a `fixtureDir`-style path for `src/services/__fixture__/Bad.ts` with a `react` import and a `@/components/...` import, plus one `.Bad_Name` class case and one `gap: 8px` case.

### QUAL-003: Shell-crash error layer and the "follows OS" test do not test what they claim

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/frontend/src/app/AppShell/AppShell.test.tsx:1500-1505` (packet lines), `router.tsx:11-20` |
| Category | test-coverage |
| Rule | conventions.md Testing: error paths tested |

**What:** Two gaps. (1) `router.tsx` documents two `errorElement` layers, but the only error test throws inside a page (inner layer); the outer layer (shell crash, no header) has no test. (2) "starts in System mode and follows the OS setting" only checks the default light; it never flips the OS, so the name overpromises (`useApplyTheme.test.tsx` covers the live part).
**Why it matters:** Removing the outer `errorElement` leaves a blank white screen on a shell crash and every test stays green.
**Recommendation:** Add a test that renders a route tree whose `AppShell` element throws and asserts the "Something went wrong." heading with no `banner` role. Rename the System test to "starts in System mode" or add a `setPrefersDark(true)` step.

### QUAL-004: Contrast test misses text pairs the CSS really uses

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/frontend/src/styles/contrast.test.ts:1314-1327` (packet lines) |
| Category | test-coverage |
| Rule | conventions.md Testing: guard tests |

**What:** `accent` on `surface-raised` is checked only at 3:1 (focus border), but it is used as text: skip link (`AppShell.module.css`, `color: var(--accent)` on `surface-raised`) and the RouteError link inside a Card. Hover text `accent-strong` on `surface-raised` (secondary Button) and on `surface-sunken` (ghost Button) is also absent.
**Why it matters:** Test's header says it covers "the pairs the UI primitives actually use"; a later token edit could break those pairs unnoticed.
**Recommendation:** Add `accent` on `surface-raised` at `TEXT`, and `accent-strong` on `surface-raised` and `surface-sunken` at `TEXT`.

### QUAL-005: Motion and size literals sit outside the tokens-only lint

| Field | Value |
|---|---|
| Severity | minor |
| Effort | medium |
| File | `Button.module.css:1841-1844`, `Input.module.css:2136-2138`, `ThemeToggle.module.css:2468-2470` (packet lines); `Tag.module.css` `.dot` (6px) |
| Category | convention (convention-gap) |
| Rule | root CLAUDE.md Frontend: "All colors/spacing/type come from design tokens" |

**What:** `0.15s ease` is repeated in three transitions, plus `6px` dot size, `72rem` shell width, `48rem` breakpoint and `opacity: 0.5`. None are tokens and the strict-value rule does not cover `transition`, `width` or `opacity`.
**Why it matters:** Not a violation of the written rule (colors, spacing, type), but the duration will drift between components once more primitives arrive.
**Recommendation:** Decide whether motion duration belongs in `tokens.json` (design owner) or document "motion and layout sizes are allowed literals" in conventions.md. If tokenized, add `--duration-fast` and use it in the three files.

### QUAL-006: Raw-color lint rule flags hex-looking words such as `'#feed'`

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/frontend/eslint.config.js:730` |
| Category | convention |
| Rule | conventions.md Linting: tokens-only rule |

**What:** `RAW_COLOR` matches any string with `#` followed by 3-8 hex letters at a word boundary. `'#feed'`, `'#face'`, `'#add'`, `'#dead'` are all valid hex, and this app has a posts feed whose anchor link may well be `#feed`.
**Why it matters:** First time someone writes `href="#feed"` they get a confusing "use a design token" error.
**Recommendation:** Accept it and document `// eslint-disable-next-line no-restricted-syntax -- anchor, not a color` in `conventions.md` Linting, or add a fixture test that pins the intended behavior either way.

### QUAL-007: Harness smoke test depends on the previous test's leftovers

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `packages/frontend/src/test/smoke.test.tsx:3686-3696` (packet lines) |
| Category | test-coverage |
| Rule | n/a |

**What:** "starts each test with clean storage" deliberately dirties `localStorage` and `data-theme`; the next test passes only if it runs right after.
**Why it matters:** Shuffled or filtered runs (`-t`, `--sequence.shuffle`) make the second test pass or fail for the wrong reason.
**Recommendation:** Replace the pair with one test that dirties state in `afterEach` of a nested `describe`, or drop the second test and assert the reset in `setup.ts` through a single self-contained check.

### Round 2 re-review

Written by: quality-reviewer (tier: balanced), dispatched sub-agent

**Summary:** Checked the round-2 diff (17 files) against my 7 round-1 findings. 5 resolved, 1 deferred, 1 not addressed (trivial, agreed). 2 new minor findings, 1 trivial not listed. No packet gaps. I did not run the suite (read-only); verdicts come from the diff and a grep of `src/`.

| Round-1 | Status | Evidence |
|---|---|---|
| QUAL-001 (blank conventions sections) | deferred to `/wrapup` (d3) | Not in the diff. Still open, as agreed. |
| QUAL-002 (services rule untested) | resolved | `enforcement.test.ts`: `BOUNDARY_CASES` covers all four layers in alias and relative form, plus the `react` ban in services, and Stylelint cases for margin, gap and `selector-class-pattern`. |
| QUAL-003 (shell crash and OS test) | resolved | `AppShell.test.tsx`: new "shell itself throws" test asserts no banner/main and the logged error; the System test now calls `setPrefersDark(true)` inside `act` and expects `dark`. |
| QUAL-004 (contrast pairs) | resolved | `contrast.test.ts` adds accent on raised, accent-strong on raised and sunken, and the placeholder pairs. I spot-checked the new recorded floors (1.44 and 1.6 light) by hand; they match. |
| QUAL-005 (motion literals) | resolved (motion) | `--duration-fast` and `--easing-standard` are in `tokens.json`, `tokens.css`, and used in Button, Input and ThemeToggle; the generator test pins them. The layout literals (6px dot, 72rem, 48rem, opacity) stay literal by your choice, but that choice is not written in `conventions.md` yet, so it belongs with d3. |
| QUAL-006 (`'#feed'`) | resolved | Decision is pinned both ways in tests: bare `'#feed'` flagged, `'#feed-list'`, `'#faded'` and `href="#feed"` pass. |
| QUAL-007 (smoke test order) | not addressed (trivial) | Agreed to leave. |

### QUAL-008: CLI realpath fix has no test

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/frontend/scripts/generate-tokens.ts:1111-1115` (packet lines), `generate-tokens.test.ts` |
| Category | test-coverage |
| Rule | conventions.md Testing: error paths tested |

**What:** The packet table says m5 is "fixed (+ test)", but the only test added to `generate-tokens.test.ts` covers motion tokens. `isCliEntry()` (the symlink fix for CORR-001) is not exercised.
**Why it matters:** `tokens:check` is the CI guard. If `isCliEntry` regresses, it exits 0 and does nothing, and every test stays green.
**Recommendation:** Add a Node-environment test that makes a temp symlink to `generate-tokens.ts` and runs `node <link> --check`, expecting the "up to date" line (or exit 1 on a stale copy). If that is too heavy, say in the packet that m5 is untested.

### QUAL-009: Design README still describes the old Input border

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `docs/design/design-system/README.md:248` (Components list, Input bullet) |
| Category | documentation |
| Rule | n/a (design doc vs code drift) |

**What:** The Input bullet says "a `border-subtle` resting state that deepens to `border-strong`/`accent` on focus". The code now rests on `border-strong` with no hover step (d1). The README's color table was updated for this ("control resting border"), so this one line contradicts it.
**Why it matters:** The next person who builds a control from the README will pick `border-subtle` and undo the d1 contrast decision.
**Recommendation:** Reword to "a `border-strong` resting state that switches to the `accent` border and raised fill on focus". Also add a one-line note in `Input.module.css`'s header pointing to the README line, or leave it as is since the CSS comment already records the departure.

(1 trivial not listed: the generator test hard-codes the full motion token list `['duration-fast', 'easing-standard']`, so adding a third token fails it for the wrong reason.)

### Round 3 re-review

| Finding | Status | Evidence |
|---|---|---|
| QUAL-008 (isCliEntry untested) | resolved | `generate-tokens.test.ts:130-150` runs the script through a symlink with `--check`, once for up to date (exit 0) and once for a stale copy (exit 1). Both fail if the realpath fix is removed. Test file runs in 0.3s, 11 pass. |
| QUAL-009 (design README Input line) | resolved | `docs/design/design-system/README.md:77` now says `surface-sunken`, `border-strong` rest, `accent` on focus, `ink-secondary` text. Matches the CSS. |
| Trivial: hard-coded motion list | resolved | The test now loops over `tokens.motion.tokens`; only the two current values are pinned, which is a fair contract. |

### QUAL-010: Symlink CLI test is not portable to Windows or restricted CI (minor)
**Where:** `generate-tokens.test.ts:122`
**What:** `symlinkSync` throws `EPERM` on Windows without developer mode, and in some sandboxes. The throw fails the test in the run body, not as a skip, so it reads as a product bug.
**Recommendation:** Catch `EPERM`/`EACCES` and skip. Optional, because `engines` is node >=24 and the team is on macOS.

### QUAL-011: Spawned process has no timeout, and the first test depends on live repo state (trivial)
**Where:** `generate-tokens.test.ts:123`, `:130`
**What:** `spawnSync` has no `timeout`, so a hung child would block until vitest's 5s test limit, and a synchronous call cannot be interrupted by that limit. The first test also fails whenever the real `tokens.css` is stale. That is the same signal as `tokens:check`, so it is acceptable but not isolated.
**Recommendation:** Add `timeout: 15_000`. Optional.

Checked, nothing: temp-dir cleanup (every dir goes through `tempDir()` and `afterEach` removes it with `force`), flakiness (no shared state, no network, macOS `/var` to `/private/var` is covered by realpath), and runtime (about 50ms per spawn). Bare `node file.ts` relies on type stripping, which is fine under `engines >=24`.

## Architecture findings

Written by: architecture-reviewer (tier: balanced), dispatched sub-agent

**Summary:** Checked the 95 added/changed files in the packet (app, services, store, features, ui, lint/stylelint/vite/ts config, docs) against ADR-01, ADR-02, the REQ architecture and `context/conventions.md`. 4 findings: 0 critical, 1 major, 3 minor (1 trivial not listed). Biggest: the import-boundary rules that docs call "lint-enforced" are only half built, so `features/`, `store/` and `services/` can import `app/` with no lint error. Layering of ui, services, store, app and the ADR-01/02 choices otherwise match the design. No packet gaps.

### ARCH-001: Import boundaries documented as lint-enforced are only partly enforced

| Field | Value |
|---|---|
| Severity | major |
| Effort | small |
| File | `packages/frontend/eslint.config.js:793-830` |
| Category | layering |
| Rule broken | REQ-001 architecture.md "Folder structure" (import rules, ESLint overrides); `context/conventions.md` Frontend "Import boundaries ... lint-enforced" |

**What:** Only two overrides exist: `components/ui` (blocks services, store, features, app, axios, react-query) and `services` (blocks react and `components`). Nothing stops `features/`, `store/` or `services/` from importing `app/`, or `services/` from importing `features/`, or `store/` from importing `services/`/`features/`. Architecture.md says "nothing imports `app/` except `main.tsx`"; CLAUDE.md, README and conventions.md say this is lint-enforced.
**Why it matters:** The first feature REQ is the one most likely to import `app/queryClient` or `app/providers` from a feature, creating a cycle (`app` imports `features`). The docs tell reviewers it is already caught, so it will be trusted and missed.
**Recommendation:** In `eslint.config.js` add overrides: `src/features/**`, `src/store/**`, `src/services/**` forbid `@/app`, `**/app` (alias and relative); `services` also forbid `@/features`, `@/store`; `store` also forbid `@/services`, `@/features`; and any `src/**` except `src/main.tsx` and `src/app/**` forbid `app`. Add matching cases to `scripts/enforcement.test.ts`. Or, if you prefer not to add rules, reword the four docs to say which boundaries are enforced.
**References:** [[architecture/adr-01-ui-layer-headless-css-modules]], REQ-001 architecture.md (Folder structure), `packages/frontend/src/features/README.md`, `store/README.md`, `services/README.md`

### ARCH-002: RouteError styles itself with inline style objects instead of a CSS Module

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/frontend/src/app/RouteError.tsx:6-8,13,17` |
| Category | pattern |
| Rule broken | ADR-01 (components style with CSS Modules; Stylelint enforces tokens-only) |

**What:** `TITLE_STYLE` and `LINK_STYLE` are `CSSProperties` objects holding `font` and `color` token references. Every other component, including `AppShell` next door, uses a `.module.css`.
**Why it matters:** Stylelint's strict-value rule only reads CSS files, so inline `padding`, `margin` or `font-size` would pass here with raw values. It also sets a precedent that inline styles are fine for "small" components.
**Recommendation:** Add `RouteError.module.css` with `.title` and `.link` using `var(--text-heading-md)`, `var(--accent)`, `var(--text-label)`; drop the style props.
**References:** [[architecture/adr-01-ui-layer-headless-css-modules]], `packages/frontend/src/app/AppShell/AppShell.module.css`

### ARCH-003: ThemeToggle re-implements the shared `cx` helper

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/frontend/src/components/ui/ThemeToggle/ThemeToggle.tsx:34-36,55` |
| Category | pattern |
| Rule broken | Established pattern: Button, Card, Input, Tag all use `cx` from `components/ui/cx.ts` |

**What:** A private `joinClasses` does the same job as `cx`.
**Why it matters:** The next primitive may copy either one; two class-joining helpers in one folder is how they diverge (for example, one handles `false`, one does not).
**Recommendation:** Delete `joinClasses`; `import { cx } from '../cx'` and call `cx(styles.track, className)`.
**References:** `packages/frontend/src/components/ui/Button/Button.tsx:2`

### ARCH-004: Root CLAUDE.md redesign conventions still say state is Jotai only

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `CLAUDE.md` ("Conventions (redesign) / Frontend": "State: Jotai atoms in src/store/", "UI library: Claude may recommend one") |
| Category | contract |
| Rule broken | ADR-02 (accepted): server state in TanStack Query; vault rule "contradiction between sources: surface it" |

**What:** The Architecture > Frontend bullets in the same file were updated for ADR-01/02, but the Conventions list the diff leaves untouched still reads as if all state is Jotai and the UI library is undecided.
**Why it matters:** Future reviewers and agents read that list as the contract and may flag TanStack Query hooks as a violation, or put server data in atoms.
**Recommendation:** This is your call (the Conventions block is your own text). Suggest one edit: "State: Jotai atoms in src/store/ for client-only state; server state in TanStack Query (ADR-02)" and "UI library: Base UI headless + CSS Modules (ADR-01)".
**References:** [[architecture/adr-02-server-state-tanstack-query]], [[architecture/adr-01-ui-layer-headless-css-modules]]

(1 trivial not listed: theme resolution logic exists twice, in `index.html` and `useApplyTheme.ts`, and `ThemeToggleValue` mirrors `ThemePreference`; both are documented and tested.)

### Round 2 re-review

**Summary:** All four of my round-1 findings are checked against the round-2 diff. ARCH-001, ARCH-002 and ARCH-003 are resolved; ARCH-004 stays open with you (the proposal file exists, the root CLAUDE.md is untouched). No new layering, boundary or ADR problems. One trivial gap noted below.

- **ARCH-001 (M1): resolved.** `eslint.config.js` now has one non-overlapping `no-restricted-imports` block per layer. `services` bans react, components, store, features and app. `store` bans services, features and app. `features` and `components` (outside `ui`) ban app. `layerBan` covers alias, relative and bare-folder forms. `enforcement.test.ts` has a rejection case for every ban plus allow-cases for the permitted imports, so a regression would fail the tests. The options-don't-merge trap is handled by keeping one block per file glob.
- **ARCH-002 (m1): resolved.** `RouteError.tsx` uses `RouteError.module.css` (`.title`, `.link`, tokens only); the inline `CSSProperties` objects are gone, so Stylelint now covers this file's styles.
- **ARCH-003 (m2): resolved.** `ThemeToggle.tsx` imports `cx` from `../cx` and `joinClasses` is deleted; the only class joiner left in `components/ui` is `cx.ts`.
- **ARCH-004 (d2): not resolved, open with the user.** `d2-claude-md-proposal.md` has the wording (state split per ADR-02, UI per ADR-01, plus the PORT line in Environment). It is a sound fix. Nothing changes until you approve and edit the root `CLAUDE.md`.

**New in round 2 (trivial, no action needed):** `src/main.tsx`, `src/test/**` and `src/styles/**` have no import-boundary block, so they may import any layer. That matches the design (main.tsx is the one legal importer of `app/`) but means a helper in `src/test/` could reach any layer unchecked. ADR-01 and ADR-02 are consistent with the new rules, and the motion tokens (m12) fit the ADR-01 tokens-only model. No packet gaps.

## Reflection findings

Written by: reflector (tier: balanced)

**Summary:** Checked 0 lessons (the folder is empty), 0 gotchas (none written), 2 accepted ADRs, 2 concept/component pages, 3 Mermaid diagrams, plus the vault records and user docs the dispatch named. 0 critical, 0 major, 6 minor, 1 trivial (3 vault-stale, 1 missing-vault-page, 1 concept-drift, 1 re-derivation, 1 diagram-stale). Both ADRs are implemented as written (headless Base UI only in ThemeToggle, Base UI types hidden behind our props, token only in `authToken.ts`, QueryClient defaults match ADR-02). Biggest: the vault pages meant to describe this work are still stubs. 28 candidates already existed from earlier phases; I added 5 more (CAND-029 to 033).
**Dispatch questions:** ADR-01 conflict: checked, one soft drift (REFL-004). ADR-02 conflict: checked, nothing. Doc staleness: REFL-003 and REFL-007. Packet-gap: none (only vault and doc reads, which are my mandate).

### REFL-001: Vault stubs for frontend component and design-tokens concept are unfilled

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `.adlc/knowledge/components/frontend.md`, `.adlc/knowledge/concepts/design-tokens.md`, `.adlc/index.md` |
| Category | missing-vault-page |
| Vault reference | [[knowledge/components/frontend]], [[knowledge/concepts/design-tokens]] |

**What:** Both pages still say `stub — STATUS: needs verification (filled in by /wrapup)`. `index.md` has empty REQ, ADR, Concept and Component tables, though two ADRs are accepted.
**Why it matters:** The next REQ (auth, feed) reads these first. The frontend is a 150-file module with a lint-enforced folder contract; a one-paragraph stub will be skipped.
**Recommendation:** Needs-decision for `/wrapup` step 3. Fill the component page with the folder map, import boundaries, HTTP/State/Theme rules and guard tests (copy from `conventions.md` Frontend section). Fill the concept page with the tokens workflow (generate, test, rem units, `font` shorthands, recorded Input-border contrast exception). Add the ADR, concept, component and REQ rows to `index.md`, then drop the stub banners.

### REFL-002: context/architecture.md and conventions.md still carry empty or unverified sections

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `.adlc/context/architecture.md` (Layering rules, Related ADRs, Cross-cutting), `.adlc/context/conventions.md` (Naming, Error handling, Config, Comments) |
| Category | vault-stale |
| Vault reference | [[architecture/adr-01-ui-layer-headless-css-modules]], [[architecture/adr-02-server-state-tanstack-query]] |

**What:** `architecture.md` "Related ADRs" says "populated as ADRs land", "Layering rules" names only the backend, and every section keeps the README-synthesis banner. `conventions.md` Naming and Config are still template text, though this REQ fixed several answers: PascalCase component folders, camelCase CSS Module classes, co-located `*.test.ts(x)`, `PORT` read in `vite.config.ts` only.
**Why it matters:** Reviewers check code against `conventions.md`; a rule that is only in a README is not enforced.
**Recommendation:** Needs-decision for `/wrapup`. Link ADR-01 and ADR-02 under Related ADRs, add the frontend import boundaries to Layering rules, fill Naming and Config from what the code now does. Leave the backend lines marked unverified.

### REFL-003: Root CLAUDE.md redesign conventions and Environment section lag the new frontend

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `CLAUDE.md` ("Conventions (redesign) / Frontend", "Environment") |
| Category | vault-stale |
| Vault reference | [[architecture/adr-01-ui-layer-headless-css-modules]], [[architecture/adr-02-server-state-tanstack-query]] |

**What:** Three lines are now out of date. "State: Jotai atoms in src/store/" omits TanStack Query for server data (ADR-02). "UI library: Claude may recommend one; I approve it at the architect gate" was settled by ADR-01. "Environment" says the root `.env` is read by the API server and DB pool; `packages/frontend/vite.config.ts` now reads `PORT` from it too.
**Why it matters:** The "conventions win" rule in that file would send a future agent back to atoms-for-everything.
**Recommendation:** These lines are yours (user-owned conventions), so this is a decision, not an edit I make. Suggest: "State: Jotai for client state, TanStack Query for server state (ADR-02)", "UI: Base UI + CSS Modules (ADR-01)", and add the Vite config to the `.env` readers.

### REFL-004: RouteError styles are inline objects, outside the Stylelint tokens-only net

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/frontend/src/app/RouteError.tsx:6-7` |
| Category | concept-drift |
| Vault reference | [[architecture/adr-01-ui-layer-headless-css-modules]] |

**What:** ADR-01 says all styling is CSS Modules on token variables so lint can enforce "tokens only". `RouteError` uses two `CSSProperties` constants. They use `var(--…)` today, but Stylelint never sees TS, and the ESLint rule only catches raw colors and `boxShadow`, so a raw `padding` or `font-size` there would pass.
**Why it matters:** It is the only component outside the pattern, and the file comment says why (one file), so it will be copied.
**Recommendation:** Move both styles into `RouteError.module.css` (a `.title` and a `.link` class) and delete the constants.

### REFL-005: ThemeToggle redefines the shared class-name joiner

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/frontend/src/components/ui/ThemeToggle/ThemeToggle.tsx:22-24` |
| Category | re-derivation |
| Vault reference | none (no concept page; see CAND-029) |

**What:** `joinClasses` is a copy of `components/ui/cx.ts`, which Button, Card, Input and Tag all import.
**Why it matters:** Two joiners with different signatures drift apart.
**Recommendation:** Import `cx` from `../cx` in ThemeToggle and delete `joinClasses`.

### REFL-006: REQ architecture diagram shows one route error layer; the code has two

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `.adlc/specs/2026-10/m/REQ-001-frontend-foundation/architecture.md:164-172` |
| Category | diagram-stale |
| Vault reference | n/a (REQ-local page; carry to the component page) |

**What:** The flowchart draws `/ — AppShell layout (errorElement: RouteError)` with an `<Outlet/>` under it. `router.tsx:20-24` has an outer `errorElement` plus a path-less inner route with its own. The prose under the diagram describes both layers; the picture does not. The first diagram also names `tokens.test.ts`; the real file is `scripts/generate-tokens.test.ts`.
**Why it matters:** The diagram is the part read at a glance, and it is the one a component page would copy.
**Recommendation:** Add the inner path-less node to the flowchart and fix the test name. When REFL-001 copies a diagram into the component page, use the corrected one.

### REFL-007: Root README.md frontend tree is stale

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `README.md` (tree around `packages/frontend`) |
| Category | vault-stale |
| Vault reference | n/a |

**What:** The tree lists the old `App.tsx`, `pages/`, `LoginForm.tsx`, `authApi.ts` and stray `vite.config.js*` files. `docs likely affected: README.md` (frontend tree); the other docs I swept are current: `packages/frontend/README.md` matches `package.json` scripts and versions, and `docs/design` has no copy of the old accent hex.
**Recommendation:** `/wrapup` regenerates the tree or replaces it with a pointer to `packages/frontend/README.md`.

### Round 2 re-review

Written by: reflector (tier: balanced). Read the round-2 packet table and checked the working tree (CSS, contrast test, eslint config, docs).

**Summary:** 3 of my 7 round-1 findings resolved, 1 resolved in code with a leftover doc line, 3 deferred, 1 awaiting you. The round-2 fixes opened 5 new doc-drift items, all minor (needs-decision for `/wrapup`, no code change). The d2 wording matches ADR-01 and ADR-02 with one wording nit.

| Round 1 | Status | Evidence |
|---|---|---|
| REFL-004 (RouteError inline styles) | resolved | `RouteError.module.css` exists; packet row m1 |
| REFL-005 (`joinClasses`) | resolved | ThemeToggle now uses `cx` (packet row m2) |
| REFL-007 (root README tree) | resolved | `README.md` is modified in the working tree; packet row d4 |
| REFL-001, 002, 006 | deferred | /wrapup items (packet row d3); stubs and architecture.md diagram unchanged. Note REFL-006: diagram still shows one error layer |
| REFL-003 (CLAUDE.md lines) | awaiting you | `d2-claude-md-proposal.md` drafted, CLAUDE.md untouched |

### REFL-008: Input resting border still documented as `border-subtle` in five places

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `docs/design/design-system/README.md:77`, `components/Input/README.md:1`, `components/Input/preview.html:12,16`, `packages/frontend/README.md:97`, REQ `architecture.md:158,259` |
| Category | vault-stale |
| Vault reference | [[architecture/adr-01-ui-layer-headless-css-modules]] (tokens-only, design is the source) |

**What:** `Input.module.css:24` now rests on `border-strong`, and the design README token table (line 23) says "control resting border", but its own Input bullet (line 77), the Input README and `preview.html` still say `border-subtle` with a hover step. `packages/frontend/README.md:97` and architecture.md row 158 name `border-subtle` and ratios 1.14/1.51; `contrast.test.ts` now records `border-strong` at 1.44/1.94 (fill) and 1.60/1.83 (page). Architecture.md line 259 and the line about `ink-muted` "kept for placeholders" (row 153) are stale too (placeholder is now `ink-secondary`).
**Why it matters:** The design bundle is the stated source of truth; the preview will show a different Input than the shipped one, and the README describes an exception the test no longer pins.
**Recommendation:** In `/wrapup`: change those lines to `border-strong`, drop the hover sentence, update the recorded ratios, and say in the Input README that the field departs from the original bundle on purpose (decision d1).

### REFL-009: Import-boundary docs lag the new lint overrides (M1)

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `.adlc/context/conventions.md:86`, `packages/frontend/README.md:73-75` |
| Category | vault-stale |
| Vault reference | n/a (conventions.md is the vault's rule page) |

**What:** M1 added bans for features/store/services/components → `app`, services ↛ store/features, store ↛ services/features. conventions.md Linting still lists only the `components/ui` and `services` rules; frontend README lists the same two plus "Only `main.tsx` imports `app/`".
**Why it matters:** Reviewers read conventions.md as the enforced list; it now understates it, and the README promise "only main.tsx imports app" is still not fully true (e.g. `components/` non-ui, `test/`).
**Recommendation:** List the new rules in both places, and word the `app/` line exactly as the config enforces it.

### REFL-010: Motion tokens are not mentioned in the frontend docs

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `packages/frontend/README.md:83`, `.adlc/context/conventions.md:107`, `.adlc/context/conventions.md:88` |
| Category | vault-stale |
| Vault reference | n/a |

**What:** Both say tokens cover "colors, spacing, type and radii" and the Stylelint rule list has no `transition`. The design README now has a Motion section, `tokens.css` has `--duration-fast` and `--easing-standard`, and three CSS files use them. Nothing enforces them: a raw `transition: 0.2s` still lints clean.
**Recommendation:** Add "motion" to the token list in both docs, and note that motion is by convention, not lint (or add a `transition` strict-value rule later).

(New candidate CAND-034 not added: the "decide, then record the exception in the contrast test" pattern is already covered by existing candidates.)

**d2 proposal vs ADRs:** accurate. State line matches ADR-02's "server is the source of truth, query; browser-only, atom". UI line matches ADR-01 (CSS Modules on tokens, Base UI for hard widgets, wrapped behind our props). One nit: "no component library" reads as contradicting Base UI. ADR-01 rejects a *styled kit*; suggest "no styled component kit". The Environment sentence is correct (`vite.config.ts` reads only `PORT`; CORR-002 fix keeps that true). Also keep the "UI components make no API calls" bullet, which the proposal correctly leaves alone.

### Round 3 re-review

Written by: reflector (tier: balanced). Read the working tree directly.

| Finding | Status | Evidence |
|---|---|---|
| REFL-003 (CLAUDE.md) | resolved | CLAUDE.md:102-103 state line, UI line ("no styled component kit", Base UI, ADR-01/02) and the Environment `PORT` sentence (line 51) match d2 and my nit |
| REFL-006 (arch diagram) | resolved | architecture.md:170-172 shows both error layers; test name is `generate-tokens.test.ts` (line 105) |
| REFL-010 (motion) | resolved | frontend README:84,104 and conventions.md:107-108 name the tokens and say motion is convention, not lint |
| REFL-008 (Input border) | partly | Design README:77, Input README, preview.html, frontend README:98 and arch rows 156/159 fixed. Left: architecture.md:150 ("dark Input border 1.51:1") and :261 ("`accent` vs `border-subtle`"); design README:23 still says "Hover/focus borders" though Input has no hover step |
| REFL-009 (boundaries) | partly | conventions.md:86,97 and frontend README:71-76 are exact. `CLAUDE.md:81` still lists only the `components/ui` and `services` rules and says "only `main.tsx` imports `app/`" |

**New (trivial, needs-decision):** CLAUDE.md:81 should say: add `store/` and `services/` bans, and "nothing in features/store/services/components imports `app/` (tests exempt)". Leave line 103 ("colors/spacing/type") alone or add "motion".

**For /wrapup, tokens.json usage strings:** confirmed `ink-muted` ("Placeholder text", line 53) is wrong; the Input now uses `ink-secondary` for placeholders. `border-subtle` ("inputs", line 33) is wrong for the same reason. Add: the `border-strong` usage (line 36) is already correct. Also carry over the two stale architecture.md lines above and design README:23.



**Summary:** No browser tool and no Playwright/Puppeteer here, so this is a static review (code + tokens + computed contrast), not a run. All 7 UI ACs and the 3 flagged items covered from source. 0 critical, 0 major, 3 minor, 1 trivial. Biggest: the placeholder/muted text colour fails 4.5:1 in light mode (2.8:1). The dark no-flash script, live system-mode listener, persistence, no-shadow rule, radiogroup semantics and 360px/200% wrapping all check out in code. Nothing was started, so no dev server to tear down.

### UI-001: Muted placeholder text is below 4.5:1 in light mode

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| Route / flow | Input primitive (not mounted; static) |
| Lens | a11y |
| Evidence | Computed: `--ink-muted` #948c84 on `--surface-sunken` #f0ebe3 = 2.79:1 (dark: 3.74:1 on raised) |

**What:** `Input.module.css` `.input::placeholder` uses `--ink-muted`. The helper text was already moved to `ink-secondary` for contrast, but the placeholder was not. **Why:** placeholders are text under WCAG 1.4.3 (4.5:1). **Fix:** use `--ink-secondary` for the placeholder (4.84:1 light), or darken `ink-muted` in tokens.json so every muted use passes.

### UI-002: Input resting border is nearly invisible

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| Route / flow | Input primitive (static) |
| Lens | a11y / design-match |
| Evidence | Computed: `--border-subtle` #e4dcd0 vs `--surface-raised` #fff = 1.36:1; sunken fill vs page = 1.11:1 |

**What:** At rest an Input is a sunken fill with a subtle border, so its edge is about 1.1-1.4:1 against the page (WCAG 1.4.11 wants 3:1 for a field boundary). **Why:** low-vision users may not see where to type. Focus is fine: the accent border is 4.5:1 and the fill changes, so border-only focus is acceptable. **Fix:** use `--border-strong` at rest, or raise the issue with the design bundle. This follows the design, so it is a design decision for the user.

### UI-003: ThemeToggle shifts width when the selection changes

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| Route / flow | Header toggle, every page |
| Lens | design-match / interaction-state |
| Evidence | `ThemeToggle.module.css` `.option[data-checked]` sets weight 600; resting weight is 500 |

**What:** The checked label gets heavier, so that option widens a pixel or two and the whole pill (and the brand row beside it, when it wraps) nudges on each click. **Fix:** keep one weight, or reserve the bold width (a hidden `::after` with `content: attr(data-label)` at weight 600 and `height:0`). Needs a browser check to size it. Alternatively, accept it; the weight is there because the raised segment alone is only ~1.2:1.

### UI-004: Toggle options are 28px tall

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| Route / flow | Header toggle |
| Lens | a11y |
| Evidence | padding `--space-1` x2 + 18px line + 2px border = 28px (from CSS) |

Passes WCAG 2.2 minimum (24px) but is small for touch at 360px. Optional: `--space-2` vertical padding.

### Acceptance criteria, checked in source

- Three-way toggle, persists: `ThemeToggle.tsx` is a Base UI radiogroup named "Theme"; `themeAtom.ts` stores to `alumni.theme` with `getOnInit`. Pass.
- System follows OS live: `useApplyTheme.ts` adds and removes the `change` listener per preference. Pass.
- No flash: inline script in `index.html` sets `data-theme` before paint and its key matches the atom. Pass in production build. In the Vite dev server CSS arrives via JS, so a brief unstyled frame is possible (dev only, not a finding).
- No box-shadow: grep of `src` for "shadow" found none in CSS. Pass.
- 360px/200% zoom: header is `flex-wrap`, gutters in rem, `min-height:100vh`, no fixed widths. Pass in code; not measured.
- Keyboard/announcement: radiogroup + `aria-checked`, Tab lands on checked, arrows move the choice, `:focus-visible` outline (tests cover it). Pass.
- Primitives vs README: Button/Tag/Card/Input CSS use tokens only; disabled uses native `disabled`. Checked, nothing beyond UI-001/002. RouteError inline token styles: work, no issue. Skip link and `main` focus target are correct.

**UI review tier:** static-only - AppShell, ThemeToggle, theme hook/atom, 4 primitives, index.html, tokens; 0 screenshots; 0 critical / 0 major / 3 minor.

### Round 2 re-review

Written by: ui-reviewer (tier: balanced). **Tier: static-only again** (no Chrome tool, no Playwright/Puppeteer; nothing started, no dev server to tear down). Read the working-tree CSS/TSX, not a render. Main session runs the manual checklist in Chrome.

**Round-1 findings**

- UI-001 placeholder: **resolved.** `Input.module.css` `::placeholder` is `ink-secondary`; `contrast.test.ts` now pins it at 4.5:1 on sunken and raised, both themes.
- UI-002 resting border: **partly, by user decision (d1).** Now `border-strong`; still 1.44:1 (light) / 1.94:1 (dark) against its fill, below 3:1. Recorded as exceptions that the test holds from getting worse. The hover rule is gone, so nothing else competes with the focus signal.
- UI-003 width shift: **resolved in source, unproven on screen.** `.option::after` (hidden, `height:0`, weight 600) reserves bold width in an `inline-grid`; no height change because the second grid row is 0px. Needs the step 5 browser check.
- UI-004 28px targets: **not addressed** (trivial, as agreed).

**New issues from the fixes**

### UI-005: Placeholder is close to a filled value in dark mode

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| Route / flow | Input primitive (not mounted yet) |
| Lens | design-match |
| Evidence | `Input.module.css:35` placeholder `ink-secondary`, value `ink-primary`; also the same colour as helper text (`:56`) |

**What:** Placeholder and value now differ only by the primary/secondary step (light about 4.8 vs 13:1; dark #b7afa5 vs #f1ece4). Nothing else (italic, weight) marks it as a hint. **Why:** the label above and helper text below are the same grey, so an empty field can read as pre-filled. Not wrong, and the contrast fix required it. **Recommendation:** judge it in Chrome (checklist step 9); if it reads as a value, darken `ink-muted` in tokens.json to 4.5:1 and revert the placeholder to it.

### UI-006: Design README still describes the old Input border

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| Route / flow | `docs/design/design-system/README.md:248` |
| Lens | design-match |
| Evidence | Components line says "`border-subtle` resting state that deepens to `border-strong`/`accent` on focus" |

**What:** The token table (`border-strong` "control resting border") was updated; the Input component line was not, and the hover step it implies no longer exists. **Recommendation:** reword to "`border-strong` resting, `accent` on focus".

**Checked, nothing:** `::after` leaking into the accessible name. `content: attr(data-label) / ''` sets empty alt text and `visibility:hidden` also removes it from the accessibility tree, so the radio name stays "Light/Dark/System". Where a browser does not parse the `/ ''` form, the whole declaration is dropped and the toggle falls back to round-1 behaviour (a small width shift), not a duplicate label. RouteError CSS module is tokens-only and matches the old look. Motion tokens: `tokens.css:17-18` match `tokens.json`; reduced-motion handling in `global.css:58` and the toggle.

**Manual-checklist changes (for the main session)**

- Step 5 (alters): click Light/Dark/System and measure the pill width in DevTools; it must not change. Also select the text of the toggle and run a screen reader or the Accessibility tab: each radio's name is a single word, not "LightLight".
- Step 9 (new): render an Input (the design preview `components/Input/preview.html` or a temporary mount) in both themes: resting border visible as a line, placeholder readable but clearly a hint (UI-005), focus turns the border accent and the fill raised, no hover change.
- Step 10 (new): trigger a route error (go to an unknown nested route or throw in a route): heading and "Go to the home page" link look the same as before, and the console shows the error in the production build (`npm run build && npm run preview`).
- Step 11 (new): hover a Button and tab through it: colour change takes ~150ms, and none under OS "reduce motion".

**UI review tier (round 2):** static-only - ThemeToggle, Input, Button CSS, RouteError, motion tokens; 0 screenshots; 0 critical / 0 major / 0 minor, 2 new trivial.

## UI manual-verification checklist

1. `npm run dev:frontend`, open http://localhost:5173. Header shows "Alumni Network" and Light / Dark / System; System is selected on first load.
2. Pick Dark, reload with the cache cleared: no light flash. Repeat with Light, System.
3. Pick System, switch the OS appearance: page changes without reload.
4. Tab to the toggle: focus lands on the checked option with a visible ring; Left/Right change the choice. Screen reader says "Theme, radio group, Dark, selected".
5. Click Light, Dark, System in turn and watch the pill: does its width jump (UI-003)?
6. DevTools at 360px wide and at 200% zoom: no horizontal scrollbar, toggle wraps under the brand if needed.
7. Tab first thing on the page: "Skip to content" appears top-left, Enter moves focus to main.
8. Open `docs/design/design-system/components/*/preview.html` beside the code for Button/Input/Card/Tag in both themes.

