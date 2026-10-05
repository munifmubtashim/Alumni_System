# Lesson candidates — REQ-001

## CAND-001 [implement-task]
**Claim:** After a major-version bump in a workspace, run `npm ls react` (or the bumped package) and check for a second hoisted copy; run `npm dedupe` if one appears.
**Saw it in:** `package-lock.json` (`node_modules/react` stayed 18.3.1 after upgrading the frontend to 19.3)
**Context:** npm kept the old lock placement, so root-hoisted libs (Base UI, TanStack Query, Jotai) would have loaded React 18 next to the app's React 19.

## CAND-002 [implement-task]
**Claim:** When vitest is nested in a workspace's node_modules, make sure `@vitest/mocker` is nested beside it; if hoisted alone it cannot find `vite`.
**Saw it in:** `package-lock.json` (`node_modules/@vitest/mocker` vs `packages/frontend/node_modules/vite`)
**Context:** Backend `@types/node@20` at the root forces vitest to nest; fix was deleting the vite/vitest/@vitest lock entries and reinstalling.

## CAND-003 [implement-task]
**Claim:** Do not set `baseUrl` in TypeScript 6 tsconfigs; `paths` alone works and `baseUrl` is a hard error (TS5101).
**Saw it in:** `packages/frontend/tsconfig.app.json:23`
**Context:** Many templates still put `baseUrl: "."` next to `paths`.

## CAND-004 [implement-task]
**Claim:** Frontend tsconfigs must not extend the repo-root tsconfig; it turns on declaration/sourcemap emit.
**Saw it in:** `tsconfig.json:9` (root)
**Context:** That emit is what left `vite.config.js/.d.ts/.map` beside source; the frontend now uses its own `noEmit` configs.

## CAND-005 [implement-task]
**Claim:** In Vitest 5, give Node-only test files a `// @vitest-environment node` comment; `environmentMatchGlobs` no longer exists.
**Saw it in:** `packages/frontend/vite.config.ts` (test.include covers scripts/**)
**Context:** The task approach offered environmentMatchGlobs; it is absent from vitest 5.0.3 types. The other option is `test.projects`.

## CAND-006 [implement-task]
**Claim:** Keep `src/test/setup.ts` safe to load without a DOM (guard on `typeof window`), because it also runs for Node-environment tests.
**Saw it in:** `packages/frontend/src/test/setup.ts`
**Context:** setupFiles apply to every test file, including scripts/** tests that run in Node.

## CAND-007 [implement-task]
**Claim:** Add `coverage/` to the frontend .gitignore and the ESLint/Prettier ignores; `npm run test:coverage` writes it inside packages/frontend.
**Saw it in:** `packages/frontend/.gitignore`
**Context:** After a coverage run, `eslint .` linted coverage/*.js (3 warnings) and git would show it as untracked.

## CAND-008 [implement-task]
**Claim:** Lint in-memory ESLint fixtures with `projectService: false, project: null` plus `disableTypeChecked.rules`, and assert no fatal messages.
**Saw it in:** `packages/frontend/scripts/enforcement.test.ts:18`
**Context:** Type-aware parsing returns a fatal parse error (no ruleId) for a lintText path not on disk, so a rule-ID assertion could silently pass or fail for the wrong reason.

## CAND-009 [implement-task]
**Claim:** Raw `font-weight: 600` and `line-height: 1.5` fail Stylelint; use `var(--…)` tokens for them too.
**Saw it in:** `packages/frontend/stylelint.config.js:25`
**Context:** declaration-strict-value checks unitless numbers as well; multi-value shorthands like `padding: var(--a) var(--b)` and `margin: 0 auto` do pass.

## CAND-010 [implement-task]
**Claim:** Name both alias and relative globs (`@/x`, `@/x/**`, `**/x`, `**/x/**`) in no-restricted-imports patterns; a bare-folder import like `../services` only matches `**/services`.
**Saw it in:** `packages/frontend/eslint.config.js:75`
**Context:** ADV-008 caught that alias-only patterns let relative imports through.

## CAND-011 [implement-task]
**Claim:** Use `queryClient.query(options)`, not `fetchQuery`; `fetchQuery` is deprecated in TanStack Query 5.104 and fails lint via `no-deprecated`.
**Saw it in:** `packages/frontend/src/app/queryClient.test.ts:31`
**Context:** strictTypeChecked enables `@typescript-eslint/no-deprecated`, so docs-era examples using fetchQuery break `npm run lint`.

## CAND-012 [implement-task]
**Claim:** Pass `retryDelay: 0` on the query under test when asserting retry counts; the default backoff makes each retried test wait 1s+2s.
**Saw it in:** `packages/frontend/src/app/queryClient.test.ts:38`
**Context:** Overriding only the delay keeps the client's real `retry` default under test.

## CAND-013 [implement-task]
**Claim:** Don't read CSS in Vitest with `import x from './file.css?raw'` — Vitest stubs CSS imports (even `?raw`) to `''` unless `test.css.include` matches; read it from disk instead.
**Saw it in:** `packages/frontend/scripts/generate-tokens.ts:137`
**Context:** the token sync test got `''` for tokens.css and failed as "stale".

## CAND-014 [implement-task]
**Claim:** Code under `src/` (tests included) is typechecked by tsconfig.app.json with no Node types, so a `node:*` import there, or in any file it imports, fails `npm run typecheck`.
**Saw it in:** `packages/frontend/scripts/generate-tokens.test.ts:1`
**Context:** Fix: put Node-side tests in `scripts/` (tsconfig.node.json has Node types) instead of working around it; JSON imports from src work fine.

## CAND-015 [implement-task]
**Claim:** Record an accepted contrast exception as a floor per theme (two decimals, rounded down) — the dark-theme Input border (1.51:1) also misses 3:1, though architecture says dark passes every pair.
**Saw it in:** `packages/frontend/src/styles/contrast.test.ts:66`
**Context:** Light is 1.146, which the architecture table rounds up to 1.15; asserting ≥1.15 would fail on unchanged tokens.

## CAND-016 [implement-task]
**Claim:** Style Base UI 1.8 Radio focus with `:focus-visible`, not `[data-focus-visible]` — Radio.Root emits no focus-visible data attribute.
**Saw it in:** `node_modules/@base-ui/react/radio/root/RadioRootDataAttributes.d.ts` (only data-checked/unchecked/disabled/…; data-focused needs Field.Root)
**Context:** TASK-008's approach named `data-focus-visible`; the installed version doesn't set it.

## CAND-017 [implement-task]
**Claim:** Base UI Radio.Root renders a `<span role="radio">` whose text content is its accessible name — no `<label>` or aria-label needed per option.
**Saw it in:** `packages/frontend/src/components/ui/ThemeToggle/ThemeToggle.tsx:44`
**Context:** Tests query `getByRole('radio', { name: 'Dark' })` and pass with plain children text.

## CAND-018 [implement-task]
**Claim:** Wrap state guards in `:where()` (`:hover:where(:not(:disabled, :focus))`) so hover rules don't out-rank later `:focus`/`:disabled` rules.
**Saw it in:** `packages/frontend/src/components/ui/Input/Input.module.css:33`
**Context:** `.input:hover:not(:disabled)` (0,3,0) beat `.input:focus` (0,2,0); stylelint `no-descending-specificity` caught it.

## CAND-019 [implement-task]
**Claim:** In user-event keyboard tests, tab to the control before any click; a prior click leaves focus on it, so `user.tab()` moves focus away.
**Saw it in:** `packages/frontend/src/components/ui/Button/Button.test.tsx:31`
**Context:** Enter/Space test failed with focus on body after click-then-tab.

## CAND-020 [implement-task]
**Claim:** `atomWithStorage(..., { getOnInit: true })` reads storage once at module load, not per store; to test "reload reads it back", `vi.resetModules()` and re-import the atom module.
**Saw it in:** `packages/frontend/src/store/themeAtom.test.ts:10`
**Context:** A fresh `createStore()` returns the import-time value until the atom is mounted.

## CAND-021 [implement-task]
**Claim:** Jotai's `createJSONStorage(() => localStorage)` does not catch a throwing storage getter; wrap getItem/setItem/subscribe in try/catch or a private-mode browser crashes at module load.
**Saw it in:** `packages/frontend/src/store/themeAtom.ts:22`
**Context:** With `getOnInit` the read happens at import, so an uncaught SecurityError kills the app before render.

## CAND-022 [implement-task]
**Claim:** Scripts injected into jsdom run in its inner global, which lacks the test-setup `matchMedia` stub; bridge it via a property on `document`.
**Saw it in:** `packages/frontend/src/store/themeAtom.test.ts:91`
**Context:** `window.matchMedia` existed in the test but the injected index.html script hit `ReferenceError: matchMedia is not defined`.

## CAND-023 [implement-task]
**Claim:** Put page-level `errorElement`s on a path-less child route, not only on the layout route; a layout-route errorElement replaces the whole layout.
**Saw it in:** `packages/frontend/src/app/router.tsx:16`
**Context:** Architecture called RouteError "in-shell", but errorElement on `/` alone would drop the header on any page error.

## CAND-024 [implement-task]
**Claim:** Make the route tree a factory (`createRoutes(pageRoutes)`) so tests can inject a throwing page into the real tree with `createMemoryRouter`.
**Saw it in:** `packages/frontend/src/app/router.tsx:16`, `packages/frontend/src/app/AppShell/AppShell.test.tsx:63`
**Context:** Testing the error layer needed a page that throws without shipping a test route in the app.

## CAND-025 [implement-task]
**Claim:** To prove an npm install left other workspaces alone, snapshot `packages` path→version from package-lock.json before and diff after; `git diff` on the lockfile is useless once the branch already rewrote it.
**Saw it in:** `package-lock.json` (TASK-010 antd removal: 64 removed, 0 added, 0 changed outside packages/frontend)
**Context:** The branch's lockfile diff vs main was 9k lines from TASK-001, hiding what this install changed.

## CAND-026 [implement-task]
**Claim:** Count React copies with `npm ls react --all | grep -E "[─ ]react@" | grep -v deduped`; a plain `grep react@` also matches `@base-ui/react@` and `@testing-library/react@`.
**Saw it in:** `packages/frontend/package.json` (deps `@base-ui/react`, `@testing-library/react`)
**Context:** The naive grep reported react@1.8.0 and react@16.3.3, which looked like extra Reacts but were not.

## CAND-027 [implement-task]
**Claim:** After a dev-server check, kill the whole tree (npm run → npm run dev → tsx watch / vite → node), then confirm with `lsof -iTCP:5173 -iTCP:3000 -sTCP:LISTEN`.
**Saw it in:** `package.json:9` (root `dev:api`/`dev:frontend` wrap a workspace `npm run dev`)
**Context:** Each server sat four processes deep; killing only the listening PID would leave the npm and tsx watch parents behind.

## CAND-028 [implement-task]
**Claim:** In this zsh shell, quote separators and globs in agent commands (`echo '----'`, `--include='*.css'`); `====` and an unmatched glob abort the whole command.
**Saw it in:** agent Bash calls in TASK-010 (zsh `=cmd` expansion and NOMATCH)
**Context:** Two verification commands died mid-way; one left background servers running past the failed check.

## CAND-UI-001 [ui-review]
**Claim:** When a muted token is swapped for contrast on one element, grep every other use of it (placeholders, disabled text) in the same pass.
**Saw it in:** `packages/frontend/src/components/ui/Input/Input.module.css` (`::placeholder` still `--ink-muted`, 2.79:1)
**Context:** Helper text was moved to ink-secondary but the placeholder was missed.

## CAND-029 [review-arch]
**Claim:** When docs say a layer boundary is lint-enforced, add an enforcement-test case per boundary; a rule list shorter than the doc list is silent drift.
**Saw it in:** `packages/frontend/eslint.config.js:793-830`
**Context:** Only ui and services overrides exist; the "nothing imports app/ but main.tsx" rule has no lint rule.

## CAND-030 [review-arch]
**Claim:** Inline `style` objects bypass CSS-only token linting; require a CSS Module even for tiny components.
**Saw it in:** `packages/frontend/src/app/RouteError.tsx:6-8`
**Context:** Stylelint strict-value covers only .css files, so inline spacing/font would pass unchecked.

## CAND-031 [review-arch]
**Claim:** When an ADR changes a convention, update the "Conventions" list in root CLAUDE.md in the same REQ.
**Saw it in:** `CLAUDE.md` Conventions (redesign) / Frontend ("State: Jotai atoms")
**Context:** ADR-02 added TanStack Query but the conventions list still reads Jotai-only.

## CAND-029 [review-corr]
**Claim:** Detect "run as CLI" in ESM scripts with realpath-resolved paths (or `import.meta.main`), never raw `argv[1]` vs `import.meta.url`.
**Saw it in:** `packages/frontend/scripts/generate-tokens.ts:1344`
**Context:** Symlinked paths make the check false and the script exits 0 silently, so a CI `--check` passes without checking.

## CAND-030 [review-corr]
**Claim:** Use `||` not `??` when defaulting values read from env files, since empty strings are valid-but-useless.
**Saw it in:** `packages/frontend/vite.config.ts:3873`
**Context:** `PORT=` in `.env` yields an empty proxy port.

## CAND-029 [review-reflect]
**Claim:** Before adding a small helper under `components/ui/`, check `cx.ts` and sibling primitives; write a short "ui primitives" concept page listing shared helpers.
**Saw it in:** `packages/frontend/src/components/ui/ThemeToggle/ThemeToggle.tsx:22`
**Context:** `joinClasses` duplicates `cx`; no concept page told the author `cx` existed.

## CAND-030 [review-reflect]
**Claim:** (ADR-gap) Record the choice of React Router 8 data router with two errorElement layers, and the frontend's own tsconfigs not extending the root, as an ADR or concept.
**Saw it in:** `packages/frontend/src/app/router.tsx:20`, `packages/frontend/tsconfig.app.json`
**Context:** Both are structural, recur in every page REQ, and live only in README/conventions prose.

## CAND-031 [review-reflect]
**Claim:** (gotcha) The theme storage key `alumni.theme` exists in `index.html` and `themeAtom.ts`; do not rename it in one place.
**Saw it in:** `packages/frontend/index.html:15`, `packages/frontend/src/store/themeAtom.ts:11`
**Context:** Inline script duplicates the key on purpose (no flash); only a test guards it.

## CAND-032 [review-reflect]
**Claim:** (gotcha) `@alumni/shared` still resolves to its source and frontend uses `~6.0` TypeScript while backend uses 5.9; don't unify tsconfigs or bump TS to 7 without checking typescript-eslint support.
**Saw it in:** `packages/frontend/package.json` (`typescript ~6.0.3`), `.adlc/context/conventions.md` TypeScript section
**Context:** Version pins (TS 6, ESLint 9, jsdom 29) each rest on a plugin or Node limit written only in README/conventions.

## CAND-033 [review-reflect]
**Claim:** Inline `style` objects in TS bypass Stylelint; keep all component styling in `.module.css`, or extend the ESLint rule to non-color properties.
**Saw it in:** `packages/frontend/src/app/RouteError.tsx:6`
**Context:** Same root as REFL-004; becomes a lesson if a second inline-style file appears.

## CAND-032 [review-qual]
**Claim:** Fill the Naming, Logging, Comments and Git sections of conventions.md when a package is rebuilt; blank templates leave reviewers nothing to enforce.
**Saw it in:** `.adlc/context/conventions.md:5-61`
**Context:** REQ-001 filled Testing/TypeScript/Linting/Frontend only.

## CAND-033 [review-qual]
**Claim:** A lint-rule self-test must have one fixture per rule block, not just per rule family.
**Saw it in:** `packages/frontend/scripts/enforcement.test.ts:1005`
**Context:** The services/ import override has no fixture; deleting it keeps the guard green.

## CAND-034 [review-qual]
**Claim:** Guard tests that list "pairs in use" (contrast) must be updated whenever CSS starts using a new foreground/background pair.
**Saw it in:** `packages/frontend/src/styles/contrast.test.ts:3314`
**Context:** Skip link and RouteError link use accent as text on surface-raised, only tested at 3:1.

## CAND-035 [review-qual]
**Claim:** Regex-based raw-color lint on string literals false-positives on hex-looking words (#feed); document or pin the escape hatch.
**Saw it in:** `packages/frontend/eslint.config.js:730`
**Context:** Feed page anchors are a likely first victim.

## CAND-036 [review-qual]
**Claim:** Decide whether motion durations and layout sizes are tokens or allowed literals; the tokens-only rule is silent on them.
**Saw it in:** `packages/frontend/src/components/ui/Button/Button.module.css:11`
**Context:** `0.15s ease` repeated in three primitives.

## CAND-037 [review-qual]
**Claim:** Do not write tests that rely on the previous test leaking state to prove a reset.
**Saw it in:** `packages/frontend/src/test/smoke.test.tsx:36`
**Context:** Reset check passes only under sequential order.

## Candidate verdicts

IDs CAND-029–033 were minted twice by reviewers running in parallel; the source tag disambiguates them (a = architecture, c = correctness, r = reflector, q = quality). Cross-branch dedup: `origin/main` has no `knowledge/lessons/` (as of 15 hours ago), so there was nothing to match.

| Candidate | Verdict | Target / Reason |
|---|---|---|
| CAND-001, CAND-026 | promote | LESSON-REQ-001-2 |
| CAND-002 | demote-to-gotcha | ^g02 |
| CAND-003, CAND-032r | promote | LESSON-REQ-001-1 |
| CAND-004 | demote-to-gotcha | ^g03 |
| CAND-005, CAND-006, CAND-014 | promote | LESSON-REQ-001-3 |
| CAND-007 | discard | fixed in `.gitignore`/ignores; no recurring rule |
| CAND-008, CAND-011, CAND-012, CAND-035q | demote-to-gotcha | ^g07 |
| CAND-009, CAND-018 | demote-to-gotcha | ^g04 |
| CAND-010, CAND-029a, CAND-033q | promote | LESSON-REQ-001-4 |
| CAND-013, CAND-029c | demote-to-gotcha | ^g06 |
| CAND-015, CAND-UI-001, CAND-034q | promote | LESSON-REQ-001-6 |
| CAND-016, CAND-017 | demote-to-gotcha | ^g05 |
| CAND-019 | discard | generic Testing Library behaviour, documented upstream |
| CAND-020, CAND-021 | promote | LESSON-REQ-001-9 |
| CAND-022, CAND-031r | demote-to-gotcha | ^g01 |
| CAND-023, CAND-024 | promote | LESSON-REQ-001-7 |
| CAND-025, CAND-027, CAND-028 | discard | agent/tooling operating notes, not project knowledge |
| CAND-030a, CAND-033r | promote | LESSON-REQ-001-5 |
| CAND-030c | discard | superseded: lint bans `\|\|`; empty PORT handled explicitly |
| CAND-031a | promote | LESSON-REQ-001-8 |
| CAND-029r | discard | covered by the filled component page (shared helpers listed) |
| CAND-030r | discard | recorded as a follow-up (ADR or concept for the router layout and standalone tsconfigs) |
| CAND-032q | discard | handled in this wrap-up (conventions Naming/Git filled, marked needs verification) |
| CAND-036q | discard | resolved: motion tokens added, layout literals recorded in conventions |
| CAND-037q | discard | trivial, single test |
