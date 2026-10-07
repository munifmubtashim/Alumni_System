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

## G02 — vitest/vite are hoisted to the root; @vitest/mocker must land beside vite ^g02

| Field | Value |
|---|---|
| Discovered | 2026-10-05 (rewritten 2026-10-06, REQ-003) |
| REQ | REQ-001, REQ-003 |
| Component | npm workspaces |
| Status | confirmed |
| Severity | careful |

**What:** Since REQ-003 added vitest to `packages/backend`, `vitest`, `vite` and `@vitest/*` install once at the root (`node_modules/vitest`), shared by the frontend and the backend. Before that, they were nested under `packages/frontend/node_modules`. Either way, an install can leave `@vitest/mocker` at a level where it can't resolve `vite`. The backend test run then fails with "Cannot find package 'vite'", while the frontend may still pass.

**Where:** `package-lock.json` entries for `vite`, `vitest`, `@vitest/*`. Triggered by any workspace install that touches vitest (`npm install -D vitest --workspace=…`).

**Why it's surprising:** Workspace hoisting usually just works, and `npm ls vitest` looks healthy.

**Why it exists:** Peer-range differences between the workspaces' toolchains decide where npm places each package.

**Don't:** Don't hand-edit those lock entries. After any vitest-related install, run **both** workspaces' tests. If one fails to find `vite`, delete the vite/vitest/@vitest lock entries and reinstall.

**Related:** [[knowledge/components/frontend]] · [[knowledge/components/backend]] · [[REQ-001]] · [[REQ-003]]

---

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

## G08 — RouterProvider must come from react-router/dom, or logout redirects twice ^g08

| Field | Value |
|---|---|
| Discovered | 2026-10-05 |
| REQ | REQ-002 |
| Component | frontend / routing, auth |
| Status | confirmed |
| Severity | trap |

**What:** Navigations that pass `flushSync: true` (logout, session expiry) only flush when `RouterProvider` is imported from `react-router/dom`; from plain `react-router` the flag does nothing.

**Where:** `packages/frontend/src/app/App.tsx` (import), `packages/frontend/src/features/auth/SessionBridge.tsx`, `useLogout.ts`

**Why it's surprising:** Both entry points export a `RouterProvider` that renders the same app. React Router 8 applies route changes in a transition, so without flushSync the token-store change renders first at the old location and `RequireAuth` adds a second `/login` navigation.

**Why it exists:** The plain entry doesn't depend on `react-dom`, so it can't wire `ReactDOM.flushSync`.

**Don't:** Don't "simplify" the import to `react-router`. `AppShell.test.tsx` pins it: two tests (one navigation on logout, two 401s → one redirect) fail if you do.

**Related:** [[architecture/adr-03-frontend-session-and-401-handling|ADR-03]] · [[knowledge/concepts/session-and-401]] · [[REQ-002]]

---

## G09 — Base UI 1.8 Menu: style [data-highlighted]; labels need Menu.Group ^g09

| Field | Value |
|---|---|
| Discovered | 2026-10-05 |
| REQ | REQ-002 |
| Component | frontend / components/ui/Menu |
| Status | confirmed |
| Severity | careful |

**What:** The active menu item carries `[data-highlighted]` (no `data-focus-visible`), and real focus moves onto it; ArrowDown or Enter on the trigger opens the menu and focuses item 1. A non-clickable label must be `Menu.GroupLabel` inside `Menu.Group`.

**Where:** `packages/frontend/src/components/ui/Menu/Menu.tsx`, `Menu.module.css`; `node_modules/@base-ui/react/menu/item/MenuItemDataAttributes.d.ts`

**Why it's surprising:** Docs for other Base UI parts suggest focus-visible attributes; and a plain `<div>` label looks fine but breaks `role="menu"`, which allows only menuitem/group/separator children.

**Why it exists:** Base UI's menu keyboard model; GroupLabel needs the Group context to wire `aria-labelledby`.

**Don't:** Don't style menu items on `:focus-visible` or `[data-focus-visible]`. Don't put bare elements in the popup. Export parts flat (`MenuItem`, `MenuLabel`), not via `Object.assign(Menu, {...})` — react-refresh lint rejects that.

**Related:** [[knowledge/gotchas#^g05|G05]] (same family, Radio) · [[architecture/adr-01-ui-layer-headless-css-modules|ADR-01]]

---

## G10 — Type-aware ESLint rules that shape everyday frontend code ^g10

| Field | Value |
|---|---|
| Discovered | 2026-10-05 |
| REQ | REQ-002 |
| Component | frontend / lint |
| Status | confirmed |
| Severity | careful |

**What:** Five lint rules force non-obvious spellings: (1) form handlers take `SubmitEvent<HTMLFormElement>` — `FormEvent` is deprecated in @types/react 19.2 (`no-deprecated`); (2) optional booleans combine as `disabled === true || loading` (`prefer-nullish-coalescing` flags `||`, and `??` would be wrong); (3) axios error interceptors re-`throw` instead of `return Promise.reject(error)` (`prefer-promise-reject-errors`); (4) react-hooks v7 `refs` rejects callback refs writing into a shared `useRef` map — use one `useRef` per field; (5) react-refresh rejects `Object.assign` compound components.

**Where:** `LoginPage.tsx`, `RegisterPage.tsx`, `Button.tsx`, `httpClient.ts`, `Menu.tsx` (all under `packages/frontend/src/`)

**Why it's surprising:** Each "obvious" spelling compiles and works; only `npm run lint` fails.

**Why it exists:** `eslint.config.js` uses typescript-eslint strict-type-checked plus react-hooks v7 and react-refresh.

**Don't:** Don't commit a page before `npm run lint` and `format:check` pass — a mid-task commit in REQ-002 carried two of these failures.

**Related:** [[knowledge/gotchas#^g07|G07]] · [[REQ-002]]

---

## G11 — Testing axios: a custom adapter's 401 doesn't reject ^g11

| Field | Value |
|---|---|
| Discovered | 2026-10-05 |
| REQ | REQ-002 |
| Component | frontend / services tests |
| Status | confirmed |
| Severity | careful |

**What:** A test adapter that resolves `{ status: 401 }` is treated as success; to exercise error interceptors, reject with an `AxiosError` carrying a `response`. Swap the adapter on `httpClient.defaults.adapter` and restore it in `afterEach`.

**Where:** `packages/frontend/src/services/httpClient.test.ts` (`failingAdapter`), `authApi.test.ts`

**Why it's surprising:** `validateStatus` looks like part of the request pipeline, but it lives inside axios's built-in adapters, which a custom adapter replaces.

**Why it exists:** axios design.

**Don't:** Don't restore the adapter inline at the end of a test — a failed assertion skips it and the mock leaks into later tests.

**Related:** [[REQ-002]]

---

## G12 — Session tests: three Vitest / TanStack Query traps ^g12

| Field | Value |
|---|---|
| Discovered | 2026-10-05 |
| REQ | REQ-002 |
| Component | frontend / features/auth tests |
| Status | confirmed |
| Severity | careful |

**What:** (1) After `queryClient.clear()`, a still-mounted `useQuery` re-creates an empty entry — assert `getQueryData(key)` is `undefined`, not that the cache is empty. (2) A `mutateAsync` promise captured in a click handler and awaited later is reported as an unhandled rejection — attach `.then(ok, err)` when you capture it. (3) For expiry timers, call `vi.useFakeTimers({ shouldAdvanceTime: true })` before creating the token, so `Date.now` (for `exp`) and `setTimeout` share one clock and `findBy*` still polls.

**Where:** `packages/frontend/src/features/auth/session.test.tsx`

**Why it's surprising:** Each looks like a flaky or wrong test, not a library behaviour.

**Why it exists:** Query observers rebuild on re-render; Vitest reports rejections at the tick they occur; fake timers also fake `Date`.

**Don't:** Don't "fix" these by loosening assertions or adding real-time waits.

**Related:** [[knowledge/concepts/session-and-401]] · [[REQ-002]]

---

## G13 — Backend tests mock the pg pool by its resolved source path; a silent run proves it ^g13

| Field | Value |
|---|---|
| Discovered | 2026-10-06 |
| REQ | REQ-003 |
| Component | backend tests |
| Status | confirmed |
| Severity | careful |

**What:** `packages/backend/src/test/setup.ts` mocks `dal/config/db.ts` by its resolved path. That one mock covers query files importing `../config/db.js` and those importing `../config/db` without an extension.

**Where:** `packages/backend/src/test/setup.ts`; `packages/backend/src/dal/config/db.ts` (logs on connection success *and* failure)

**Why it's surprising:** Mocking a specifier string looks like it should only match that exact spelling.

**Why it exists:** Vitest resolves the id before matching. `db.ts` calls `verifyConnection()` at import time, so the mock must apply before any query module loads.

**Don't:** Don't add a per-file pool mock or remove the setup mock. If a DB log line ever appears in a test run, a real Pool was built: find the import that escaped the mock.

**Two queries at once:** when a method runs two queries via `Promise.all` (e.g. items + count), make the mock answer by SQL text (`/COUNT\(/`) and find calls the same way, not by `mockResolvedValueOnce` order or `calls.at(-2)` ([[REQ-005]]).

**Related:** [[architecture/adr-05-backend-tests-vitest-supertest|ADR-05]] · [[knowledge/lessons/LESSON-REQ-003-1-partial-mocks-of-workspace-packages|L-REQ-003-1]]

---

## G14 — `requireId` answers 404 (not 400) for a malformed or out-of-range id ^g14

| Field | Value |
|---|---|
| Discovered | 2026-10-06 |
| REQ | REQ-003 |
| Component | backend (businessLogic) |
| Status | confirmed |
| Severity | careful |

**What:** `requireId(value, "Post")` throws `AppError(404, "Post not found")` for `abc`, `0`, `-1`, `12abc` and anything above 2147483647 (`MAX_DB_ID`, the Postgres `integer` max). It accepts anything `Number()` turns into a positive integer, so `"1e3"` and `" 5 "` pass.

**Where:** `packages/backend/src/businessLogic/src/validation.ts` (`requireId`, `MAX_DB_ID`)

**Why it's surprising:** Most APIs return 400 for a malformed id. Two task files in REQ-003 asked for 400 before the code was read.

**Why it exists:** A malformed id can never match a row. Treating it as "not found" keeps one code path, and the user confirmed it at the REQ-003 implement gate.

**Don't:** Don't write specs or tests expecting 400 for bad ids. Don't change `requireId` per-route; it's shared by every Manager.

**Related:** [[REQ-003]]

---

## G15 — The base schema isn't in `db/migrations/`; constraints live only in `db/backups/` ^g15

| Field | Value |
|---|---|
| Discovered | 2026-10-06 |
| REQ | REQ-003 |
| Component | database |
| Status | `STATUS: needs verification` (the cascade behaviour of `posts`/`comments` → `users` is unconfirmed) |
| Severity | trap |

**What:** `db/migrations/` holds only changes on top of an existing schema. Constraints such as `alumni_profile_user_id_key` (`UNIQUE (user_id)`) and the foreign keys from `posts`/`comments` to `users` appear only in `db/backups/*.sql`.

**Where:** `db/migrations/001_university_and_students.sql` (the only migration), `db/backups/`

**Why it's surprising:** You'd expect migrations to describe the whole schema.

**Why it exists:** The schema predates the migrations folder. `STATUS: needs verification`.

**Column types (checked in [[REQ-005]]):** `alumni.graduation_year` is `integer`; `students.expected_graduation_year` is `VARCHAR(10)`. Don't confuse them; both explorers in REQ-005 did. `db/backups/` is untracked, so a worktree or fresh clone doesn't have it.

**Don't:** Don't assume a constraint is absent because migrations don't mention it. Code that inserts or deletes must still handle 23505 (unique → 409) and 23503 (foreign key → 409), as `AlumniManager.createAlumni` and `UserManager.deleteUser` do.

**Related:** [[REQ-003]] · `isUniqueViolation` / `isForeignKeyViolation` in `businessLogic/src/errors.ts`

---

## G16 — `review.packet.exclude` globs need git's glob mode to match root files ^g16

| Field | Value |
|---|---|
| Discovered | 2026-10-06 |
| REQ | REQ-003 |
| Component | ADLC vault config |
| Status | confirmed |
| Severity | careful |

**What:** As a plain git pathspec, `':!**/package-lock.json'` does not match the root `package-lock.json`. Only `':(exclude,glob)**/package-lock.json'` does, because there `**/` may match zero directories. The first REQ-003 review packet pulled in the whole lockfile and came out at 496KB instead of 163KB.

**Where:** `.adlc/config.yml` → `review.packet.exclude`, consumed by `/review` step 1.5

**Why it's surprising:** The same pattern works in `.gitignore`, where `**/` matches zero directories by default.

**Why it exists:** Git pathspecs use fnmatch unless `:(glob)` magic is given.

**Don't:** Don't build the review-packet diff with bare `:!<glob>` pathspecs. Use `:(exclude,glob)<glob>`, and check the packet size before dispatching reviewers.

**Related:** [[REQ-003]]

---

## G17 — Base UI Tooltip on a Base UI Radio: render the radio through the trigger ^g17

| Field | Value |
|---|---|
| Discovered | 2026-10-06 |
| REQ | REQ-004 |
| Component | components/ui/SegmentedControl |
| Status | confirmed |
| Severity | careful |

**What:** An icon-only segment shows its name as a Tooltip by rendering the radio as the trigger: `<Tooltip.Trigger render={<Radio.Root aria-label={label} value=…/>}>`. The radio keeps its role and roving focus, arrow keys open each tooltip, and the accessible name must come from `aria-label` (the child is only an icon).

**Where:** `packages/frontend/src/components/ui/SegmentedControl/SegmentedControl.tsx`

**Why it's surprising:** Wrapping the radio in a Trigger instead breaks focus order and doubles the focusable element.

**Don't:** Don't nest a Trigger around the Radio, and don't rely on the tooltip text for the name. Test keyboard focus and hover opening.

**Related:** [[knowledge/gotchas#^g05|G05]] · [[knowledge/gotchas#^g09|G09]] · [[REQ-004]]

---

## G18 — Never set `display` on an element toggled with the `hidden` attribute ^g18

| Field | Value |
|---|---|
| Discovered | 2026-10-06 |
| REQ | REQ-004 |
| Component | frontend CSS |
| Status | confirmed |
| Severity | trap |

**What:** A CSS Module rule like `.message { display: block }` beats the browser's `[hidden] { display: none }`, so the element shows even when `hidden` is set.

**Where:** `packages/frontend/src/features/auth/ForgotPasswordHelp.module.css` (`.message` deliberately has no `display`)

**Don't:** Leave `display` off such elements, or add `.x[hidden] { display: none }` if a layout needs `display`.

**Related:** [[REQ-004]]

---

## G19 — Auth and shell test traps ^g19

| Field | Value |
|---|---|
| Discovered | 2026-10-06 |
| REQ | REQ-004 |
| Component | frontend tests |
| Status | confirmed |
| Severity | careful |

**What:**
- `queryByText` ignores `aria-hidden`, so it can't prove text is hidden from assistive tech; use role queries or check the hidden ancestor.
- "Exactly one button" assertions break when a page gains a disclosure or a show/hide toggle; count `type="submit"` buttons instead.
- `/login` and `/register` render in `AuthShell` (no header). To test "a guest sees the header", use an unknown path such as `/does-not-exist`.
- A guest header has `HeaderAuth`'s `<nav aria-label="Account">`; "no nav links" tests must allow it. A signed-in header also has `MainNav` (`<nav aria-label="Main">`, REQ-006). Stand-in routes passed to `createRoutes` are not under `RequireAuth`, so the user menu reads "Account" until /me resolves: find it with `findByRole`.

**Where:** `LoginPage.test.tsx`, `RegisterPage.test.tsx`, `AppShell.test.tsx`

**Related:** [[knowledge/concepts/route-layout]] · [[REQ-004]]

---

## G20 — `index.html` holds copies of two constants; both are pinned by tests ^g20

| Field | Value |
|---|---|
| Discovered | 2026-10-06 |
| REQ | REQ-004 |
| Component | packages/frontend/index.html |
| Status | confirmed |
| Severity | careful |

**What:** Static HTML can't import TypeScript, so `index.html` repeats the theme storage key (inline no-flash script, [[knowledge/gotchas#^g01|G01]]) and the `<title>` (= `BRAND_NAME`). `themeAtom.test.ts` and `config/brand.test.ts` fail if either drifts.

**Don't:** Don't change `BRAND_NAME` or the theme key without editing `index.html` too; don't delete those tests.

**Related:** [[architecture/adr-06-config-leaf-layer|ADR-06]] · [[REQ-004]]

---

## G21 — LIKE escaping: backslash, no `ESCAPE` clause in JS template literals ^g21

| Field | Value |
|---|---|
| Discovered | 2026-10-06 |
| REQ | REQ-005 |
| Component | backend dal |
| Status | confirmed |
| Severity | trap |

**What:** `escapeLike` in `AlumniQuery.ts` prefixes `\`, `%` and `_` with `\`, and the pattern goes in as a bound parameter. Backslash is Postgres's default LIKE/ILIKE escape, so no `ESCAPE` clause is needed.

**Why it's surprising:** `ESCAPE '\'` written inside a JS template literal reaches Postgres as `ESCAPE ''` (the `\'` collapses), which Postgres rejects, so every search would 500. Mocked query tests can't see it ([[knowledge/lessons/LESSON-REQ-005-2-mocked-sql-tests-need-one-real-run|L-REQ-005-2]]).

**Don't:** Don't add an `ESCAPE` clause. If you ever need one, write `ESCAPE '\\'` and test against a real database.

**Related:** [[REQ-005]]

---

## G22 — `dal/dto/BaseDTO.ts`: git name, disk name and imports must share one casing ^g22

| Field | Value |
|---|---|
| Discovered | 2026-10-06 |
| REQ | REQ-005 |
| Component | backend dal |
| Status | confirmed |
| Severity | trap |

**What:** Since REQ-013 the file is `BaseDTO.ts` in git and on disk (like the other DTOs), and the four DTOs import `./BaseDTO`. A mismatch works on a case-insensitive Mac checkout (`core.ignorecase=true` hides it) but fails `tsc` with TS1261 in a fresh clone, worktree, Linux CI, or wherever the disk name differs from the import.

**History:** git used to track `baseDTO.ts`; REQ-005 changed the imports to `./baseDTO`, and later the disk name drifted to `BaseDTO.ts` again (G32). That lowercase rule no longer applies.

**Don't:** rename a tracked file by case alone on macOS: use a two-step `git mv` (`a` → temp → `A`) and check `git ls-files` afterwards. Import with the exact case git tracks.

**Related:** [[REQ-005]] · [[REQ-013]] · [[knowledge/gotchas#^g32|G32]]

---

## G23 — Postgres rejects NUL characters in text; validators turn them into a 400 ^g23

| Field | Value |
|---|---|
| Discovered | 2026-10-06 |
| REQ | REQ-005 |
| Component | backend businessLogic |
| Status | confirmed |
| Severity | careful |

**What:** A `\u0000` in a text parameter makes Postgres fail with 22021, which would surface as a 500. `optionalText` (used by every text validator) rejects it with a 400 "<field> contains an invalid character".

**Don't:** Don't route user text to SQL around `optionalText`/`requiredText`; passwords use `validateNewPassword` and are hashed, so they never reach a text column raw.

**Related:** [[REQ-005]]

---

## G24 — `TestManager.ts` keeps commented calls to Manager methods ^g24

| Field | Value |
|---|---|
| Discovered | 2026-10-06 |
| REQ | REQ-005 |
| Component | backend businessLogic |
| Status | confirmed |
| Severity | trivia |

**What:** `businessLogic/src/TestManager.ts` is scratch code full of commented-out calls. When a REQ deletes or renames a Manager method, a "grep finds nothing" check still matches there.

**Don't:** Sweep `TestManager.ts` in the same change (REQ-003 and REQ-005 both had to).

**Related:** [[REQ-003]] · [[REQ-005]]

---

## G25 — Base UI 1.8 Popover: the dialog needs a name, and focus goes to the first field on open ^g25

| Field | Value |
|---|---|
| Discovered | 2026-10-06 |
| REQ | REQ-006 |
| Component | frontend components/ui (Popover) |
| Status | confirmed |
| Severity | careful |

**What:** `Popover.Popup` is `role="dialog"` with no accessible name unless you render `Popover.Title` or pass `aria-label`; our `Popover` takes a required `label` for that. Opening by mouse or keyboard focuses the first tabbable element in the panel (the popup itself on touch). On close, focus returns to the trigger unless `finalFocus` says otherwise.

**Where:** `components/ui/Popover/Popover.tsx`; `node_modules/@base-ui/react/popover/popup/PopoverPopup.js`, `utils/popups/popupStoreUtils.js`.

**Why it's surprising:** the default return-focus is wrong when applying the popover's value removes its trigger (a filter pill becomes a chip): focus lands on `<body>`.

**Don't:** rely on the default when the trigger can unmount: pass `finalFocus={false}` and focus the replacement yourself, or pass a ref. Use `open`/`onOpenChange` so Apply can close it.

**Related:** [[knowledge/gotchas#^g09|G09]] · [[knowledge/lessons/LESSON-REQ-006-2-list-skeletons-strand-focus|L-REQ-006-2]] · [[REQ-006]]

---

## G26 — Test traps for list pages: adapters, fake timers, scrollIntoView, retries ^g26

| Field | Value |
|---|---|
| Discovered | 2026-10-06 |
| REQ | REQ-006 |
| Component | frontend tests |
| Status | confirmed |
| Severity | careful |

**What:**
- A fake axios adapter must reject non-2xx itself; returning `{ status: 400 }` resolves (see also [[knowledge/gotchas#^g11|G11]]).
- Vitest fake timers with user-event: `vi.useFakeTimers({ shouldAdvanceTime: true })` and `act(() => vi.advanceTimersByTimeAsync(ms))`; plain fake timers hang every `findBy*`/user-event call.
- jsdom has no `Element.prototype.scrollIntoView`; stub it in any test that changes the directory page.
- Test a query's error state with a 4xx. The shared client retries a 5xx twice (1 s and 2 s back-off), past `findBy*`'s 1 s timeout; in the app the same retries keep skeletons on screen for about 3 s before a server error shows.
- `await act(() => fn())` with a sync callback fails type-aware lint; use `act(async () => { fn(); await Promise.resolve(); })`.
- `src/` tests cannot use `node:fs` (no Node types in `tsconfig.app.json`); read source text with `import.meta.glob('...', { query: '?raw', import: 'default', eager: true })` (see `app/lazyRoutes.test.ts`). `scripts/` tests can use `node:fs`.

**Where:** `services/alumniApi.test.ts`, `features/directory/{FilterBar,DirectoryPage,useDirectoryParams}.test.tsx`, `app/queryClient.ts`, `app/lazyRoutes.test.ts`.

**Don't:** copy these into a seventh test file: the token builder and adapter switch are already repeated in six (a shared `src/test/` helper is an open follow-up, QUAL-002).

**Related:** [[knowledge/gotchas#^g12|G12]] · [[knowledge/gotchas#^g19|G19]] · [[REQ-006]]

---

## G27 — Frontend component and lint traps found building the directory ^g27

| Field | Value |
|---|---|
| Discovered | 2026-10-06 |
| REQ | REQ-006 |
| Component | frontend components, lint |
| Status | confirmed |
| Severity | careful |

**What:**
- Two single-class rules from different CSS Modules tie on specificity, so overriding a primitive through `className` (e.g. Pagination shrinking a Button's padding) works only by bundle order. Put a primitive's default sizes inside `:where()` when callers will size it, or add a size prop.
- CSS Modules `composes:` fails our Stylelint (`property-no-unknown`, `value-keyword-case`); share a rule with a small component instead (`VisuallyHidden`).
- `react-refresh/only-export-components` fails a `.tsx` that also exports a helper function (constants pass): keep helpers private and test them through the component, or put them in a sibling `.ts` file.
- Inside a card link, give each line its own block element (`div`/`p`); with `span`s the link's accessible name runs words together ("Amira MendesClass of 2017").
- To ban an import across `src/` next to the per-layer blocks, use `@typescript-eslint/no-restricted-imports` (a different rule id): flat config keeps only the last matching block's options per rule, so a second core `no-restricted-imports` block would silently drop the layer bans.
- Use `cx` (`components/ui/cx.ts`) for conditional class names everywhere, `app/` included; CSS-module values are `string | undefined`, so template literals fail `restrict-template-expressions`.
- `ink-muted` on `surface-sunken` is below 3:1 ([[knowledge/lessons/LESSON-REQ-004-2-check-design-colours-against-token-pairs|L-REQ-004-2]]): fine only on `aria-hidden` decoration (the search icon, the no-results icon), never for text.
- A new `contrast.test.ts` row must differ from the existing ones in colours or minimum, or it adds no coverage.

**Where:** `features/directory/{Pagination.module.css,AlumniCard.tsx,DirectoryStates.tsx}`, `components/ui/{Skeleton,VisuallyHidden}`, `eslint.config.js` (`LAZY_DIRECTORY_BAN`), `app/AppShell/MainNav.tsx`.

**Related:** [[knowledge/gotchas#^g04|G04]] · [[knowledge/gotchas#^g07|G07]] · [[knowledge/gotchas#^g10|G10]] · [[REQ-006]]


## G28 — Type-aware lint traps found building the profile page ^g28

| Field | Value |
|---|---|
| Discovered | 2026-10-07 |
| REQ | REQ-008 |
| Component | frontend lint |
| Status | confirmed |
| Severity | careful |

**What:**
- A bare number in a template-literal URL (`/posts/user/${userId}`) passes `tsc` but fails `restrict-template-expressions`: wrap it in `String()`.
- A dependent query uses `skipToken` as its `queryFn` while the input is `undefined`; `enabled` plus a `!` assertion fails because lint bans `!` and `as` narrowing.
- `const { state } = useLocation()` fails `no-unsafe-assignment` (`state` is `any`): read it into `const x: unknown = location.state` and validate.
- `line-height: normal` fails Stylelint `strict-value` ([[knowledge/lessons/LESSON-REQ-008-5-design-line-height-vs-stylelint|L-REQ-008-5]]); use a token line height.

**Where:** `services/alumniApi.ts`, `features/profile/usePostsByUser.ts`, `BackLink.tsx`, `stylelint.config.js`

**Related:** [[knowledge/gotchas#^g10|G10]] · [[knowledge/gotchas#^g27|G27]]

## G29 — Test traps found building the profile page ^g29

| Field | Value |
|---|---|
| Discovered | 2026-10-07 |
| REQ | REQ-008 |
| Component | frontend tests |
| Status | confirmed |
| Severity | careful |

**What:**
- Pin the locale (`'en'`) in `Intl` formatters and build expected dates with the same `Intl` call; the default locale and the runner's time zone vary by machine.
- The full `npm test` can time out on the heavy page tests (Directory, AppShell, Login, Register) when several agents run Vitest at once in the same tree: rerun on a quiet tree before blaming a change.
- In component tests of an error state, turn query retry off on the test client; the app policy retries 5xx twice with backoff and the test waits ~3 s.
- A leading space inside a `VisuallyHidden` span is trimmed from the accessible name in tests: put the space as a text node outside the span.
- After a Base UI Menu opens, wait for focus with `waitFor`; `findByRole` returns the item a tick before focus lands (the flaky "opens the user menu from the keyboard" test failed 3 of 8 runs).
- A page's own `<header>` inside `<main>` also matches `getByRole('banner')`: find the app shell by a header control instead.

**Where:** `features/profile/relativeTime.test.ts`, `RecentPosts.test.tsx`, `ProfileHeader.tsx`, `app/AppShell/AppShell.test.tsx`

**Related:** [[knowledge/gotchas#^g12|G12]] · [[knowledge/gotchas#^g19|G19]] · [[knowledge/gotchas#^g26|G26]]

## G30 — CSS override order and live regions on the profile page ^g30

| Field | Value |
|---|---|
| Discovered | 2026-10-07 |
| REQ | REQ-008 |
| Component | frontend css, accessibility |
| Status | confirmed |
| Severity | careful |

**What:**
- Overriding a `components/ui` primitive with a same-specificity className works only if the primitive's CSS loads first. `Card.module.css` is in the main bundle (via `RouteError`), so a lazy chunk's rule wins; a primitive that lives only in another lazy chunk could win instead. For a size override on an `[data-size]` primitive use a selector at least as specific as the primitive's own.
- Never put a `role="status"` line inside an `aria-busy="true"` container: some screen readers hold live-region updates inside a busy subtree. Put `aria-busy` only on the decorative skeleton.

**Where:** `features/profile/RecentPosts.module.css`, `RecentPosts.tsx`, `ProfileStates.tsx`, `ProfileHeader.module.css`

**Related:** [[knowledge/gotchas#^g18|G18]] · [[knowledge/gotchas#^g27|G27]]

## G31 — SQL traps in the post and comment queries ^g31

| Field | Value |
|---|---|
| Discovered | 2026-10-07 |
| REQ | REQ-009 |
| Component | backend dal |
| Status | confirmed |
| Severity | careful |

**What:**
- An edit that must answer 404 when the row was deleted meanwhile is one CTE (`WITH u AS (UPDATE … RETURNING *) SELECT u.*, author fields FROM u JOIN users`); zero rows means the Manager throws the 404 (the dal cannot import `AppError`).
- A 0-or-1 child id (`author_alumni_id`) is a scalar subquery `(SELECT MIN(a.id) FROM alumni a WHERE a.user_id = …)`, not a LEFT JOIN: `findAlumniByUserId` shows the schema does not guarantee one alumni row per user, and a join would duplicate feed rows.

**Where:** `packages/backend/src/dal/query/CommentQuery.ts`, `PostQuery.ts`

**Don't:** replace the subquery with a join, or split the update and its read-back into two statements.
**Related:** [[knowledge/lessons/LESSON-REQ-009-1-profile-links-need-the-alumni-id|L-REQ-009-1]]

## G32 — Backend typecheck needs a fresh businessLogic dist ^g32

| Field | Value |
|---|---|
| Discovered | 2026-10-07 |
| REQ | REQ-009 |
| Component | backend tooling |
| Status | confirmed |
| Severity | careful |

**What:**
- `npm run typecheck:backend` type-checks `api` against `businessLogic/dist/*.d.ts`: after adding a Manager method, run `tsc` in `packages/backend/src/businessLogic` first or it fails with "does not exist". Tests and `tsconfig.test.json` read the source, so they never show it.
- Fixed in REQ-013: the TS1261 casing failure at the dal step (git tracked `baseDTO.ts`, the disk had `BaseDTO.ts`) is gone, since the file is now `BaseDTO.ts` everywhere (G22). The script chains with `&&`, so a failure in an early step still skips `tsconfig.test.json`.

**Where:** `packages/backend/package.json` (typecheck script), `packages/backend/src/dal/dto/`

**Don't:** trust a green `typecheck:backend` as proof that `dist/` is current (it reads `dist/*.d.ts` only for `api`; tests read the source).
**Related:** [[knowledge/gotchas#^g12|G12]] · [[knowledge/gotchas#^g22|G22]]

## G33 — Two contrast pairs the tokens do not cover ^g33

| Field | Value |
|---|---|
| Discovered | 2026-10-07 |
| REQ | REQ-009 |
| Component | frontend css, accessibility |
| Status | confirmed |
| Severity | careful |

**What:**
- `--error` text on the Menu highlight (`--accent-soft`) is 4.48:1 light and 4.25:1 dark, under 4.5:1; a highlighted danger item sits on `--surface-sunken` instead.
- `--ink-muted` on `--surface-raised` is under 4.5:1, and S4 uses it for times; card meta text uses `--ink-secondary`. `contrast.test.ts` has no ink-muted text pair, so nothing flags it.

**Where:** `components/ui/Menu/Menu.module.css`, `features/feed/PostCard.module.css`, `CommentThread.module.css`

**Don't:** copy a muted grey from a design file for text on a card without a contrast check.
**Related:** [[knowledge/concepts/design-tokens]]

## G34 — Test traps found building the feed ^g34

| Field | Value |
|---|---|
| Discovered | 2026-10-07 |
| REQ | REQ-009 |
| Component | frontend tests |
| Status | confirmed |
| Severity | careful |

**What:**
- Axios has serialised the body to a JSON string before a fake adapter runs: `JSON.parse(config.data)`.
- After `fetchNextPage()` inside `act`, wait for the hook's rendered `data` with `waitFor`; `result.current` can still hold the old pages.
- A helper default parameter (`me = ME`) cannot express "no user" with `undefined`; take `null`.
- `invalidateQueries` refetches only active queries; with no observer assert `getQueryState(key).isInvalidated`.
- To test "a paused mutation is ignored" seed one with `getMutationCache().build(client, { mutationKey }, { status: 'pending', isPaused: true, … })`; toggling `onlineManager` pauses every write and a mounted client resumes them all.
- The test setup defines `matchMedia` (reporting "narrow"), so a hook that reads a width breakpoint must be told the width in each test.

**Where:** `features/feed/*.test.tsx`, `services/postsApi.test.ts`

**Don't:** copy the fake-adapter and token helpers into another test file (now 10 copies, see G26); build the shared helper at the next feature.
**Related:** [[knowledge/gotchas#^g26|G26]] · [[knowledge/gotchas#^g29|G29]]

## G35 — Menu focus, delete state and tap targets in the feed ^g35

| Field | Value |
|---|---|
| Discovered | 2026-10-07 |
| REQ | REQ-009 |
| Component | frontend components |
| Status | confirmed |
| Severity | careful |

**What:**
- A Base UI `MenuItem` closes after `onSelect` and puts focus back on its trigger after the callback: move focus to the edit box or confirm one animation frame later.
- Keep a delete's mutation hook and error in a parent that stays mounted (`FeedPage`, `CommentThread`); the optimistic remove unmounts the card and a hook inside it loses the rollback error.
- Text-only inline actions (Reply · Edit · Delete) are about 16px tall with `padding: 0`; use `min-block-size` plus a negative margin no bigger than the gap to the nearest link, or the button covers it.

**Where:** `features/feed/EditBox.tsx`, `PostCard.tsx`, `FeedPage.tsx`, `CommentThread.module.css`

**Don't:** put the delete hook inside the item being deleted.
**Related:** [[knowledge/gotchas#^g25|G25]] · [[knowledge/gotchas#^g30|G30]]

## G36 — Toast and status-region traps ^g36

| Field | Value |
|---|---|
| Discovered | 2026-10-07 |
| REQ | REQ-010 |
| Component | components/ui/Toast |
| Status | confirmed |
| Severity | careful |

**What:**
- A `role="status"` element that mounts already holding its text may not be announced; keep it mounted and empty, and write the text into it (`Toast` takes `null` to close).
- Keep the Dismiss button outside the status element, or its name is read with the message.
- On an `ink-primary` inverse surface the global accent focus ring is too faint: use `currentcolor` for the outline.
- An auto-close timer that restores focus to the heading must use `focus({ preventScroll: true })` or it scrolls the page to the top; and pause the timer on hover and focus, tracked per toast id.

**Where:** `components/ui/Toast/`, `features/me/ProfileForm.tsx`

**Don't:** key a new Toast per save to replay the animation; it remounts the live region.
**Related:** [[knowledge/gotchas#^g33|G33]]

## G37 — Test and layout traps found building My Profile ^g37

| Field | Value |
|---|---|
| Discovered | 2026-10-07 |
| REQ | REQ-010 |
| Component | frontend tests, AppShell |
| Status | confirmed |
| Severity | careful |

**What:**
- `import.meta.glob(..., { query: '?raw' })` returns an empty module for a `.css` file under Vitest (it works for `.ts`), so CSS contracts need screenshots, not a test.
- jsdom cannot check that a page's sticky bottom bar clears the shell's tab bar; both share `--tab-bar-height`, but a tab label that wraps makes the bar taller than the variable.
- Base UI Menu focuses the first item, so adding an item above Log out breaks a keyboard test that expected Log out.
- A short lazy-feature name like `me` needs near-miss allow fixtures (`@/features/media`, `../meHelpers`) in `scripts/enforcement.test.ts` and `lazyRoutes.test.ts` to prove the ban matches whole path segments.

**Where:** `app/AppShell/AppShell.module.css`, `scripts/enforcement.test.ts`, `app/lazyRoutes.test.ts`

**Don't:** plan a CSS-text test; take paired screenshots at 390 px instead.

## G38 — Mapping backend error text to form fields ^g38

| Field | Value |
|---|---|
| Discovered | 2026-10-07 |
| REQ | REQ-010 |
| Component | features/me/profileErrors.ts |
| Status | confirmed |
| Severity | careful |

**What:**
- Backend messages start with the API field name ("Bio", "Company", "Job title"), which differs from the UI labels (About, Current role): use an explicit prefix table, "prefix + space", longest first ("Expected graduation year" before "Graduation year").
- `optionalYear` checks the 10-character text limit before the year rules, so a long year says "must be at most 10 characters", not "is not valid": mirror that order.
- `PUT /api/me` clears every omitted optional field, including `photo_url`: always send the stored value back.
- A cross-field message lands on the field its text starts with (REQ-011: "Graduation year can't be before the start year" lands on Graduation year). Keep that field visible at every width; since REQ-013 every /me field is. `mentorship_available` is a boolean sent every time; omitted means false on every full-replace route.

**Where:** `features/me/profileErrors.ts`, `features/me/validation.ts`; `businessLogic/src/validation.ts:31`

**Don't:** match by label text or send a partial body.

## G39 — Migration traps: no runner, `IF NOT EXISTS` hides drift, dumps from newer Postgres ^g39

| Field | Value |
|---|---|
| Discovered | 2026-10-07 |
| REQ | REQ-011 |
| Component | db/migrations |
| Status | confirmed |
| Severity | trap |

**What:**
- There is no migration runner: apply `db/migrations/NNN` BEFORE starting the API version that reads its columns, or `GET /api/me` and the alumni writes answer 500 for everyone. Rolling back means reverting the code and leaving the columns (never `DROP COLUMN`).
- `ADD COLUMN IF NOT EXISTS` silently skips a column that already exists with a different type or default: in a real-database check, read `information_schema.columns` (type, nullable, default), not just presence.
- `db/backups/*.sql` was dumped by a newer Postgres than local 15: strip the `SET transaction_timeout` line (and COPY data blocks) before loading it into a scratch database, or psql stops at line 13.

**Where:** `db/migrations/004_alumni_profile_fields.sql`; CLAUDE.md Environment section.

**Don't:** run the new API against an unmigrated database; test a migration only on a database that already has the columns.
**Related:** [[knowledge/gotchas#^g15|G15]] · [[knowledge/lessons/LESSON-REQ-005-2-mocked-sql-tests-need-one-real-run|L-REQ-005-2]] · [[REQ-011]]

## G40 — Frontend traps found building the profile fields ^g40

| Field | Value |
|---|---|
| Discovered | 2026-10-07 |
| REQ | REQ-011 |
| Component | frontend |
| Status | confirmed |
| Severity | careful |

**What:**
- Base UI `Switch.Root` renders a span and puts `id` on a hidden checkbox: render it with `nativeButton render={<button type="button" />}` so a plain `<label htmlFor>` names and toggles the focusable switch.
- `pg` returns INTEGER columns as numbers, so `/api/me` sends `start_year` and `graduation_year` as numbers although `MyProfile` types them as strings: client code must accept both (the My Profile `text()` helper does).
- Adding a colour token touches four places: `tokens.json`, regenerated `tokens.css`, the design-system README table, and `scripts/generate-tokens.test.ts`, which pins the token count.
- A boolean in a string-keyed form type (`MeField = keyof ProfileValues`) breaks every `values[field].trim()`: keep it out of the string-keyed type.
- Under parallel task agents, attribute a failing `npm test` to the file before blaming your change.

**Where:** `components/ui/Switch/Switch.tsx`, `shared/src/types/alumni.types.ts`, `features/me/validation.ts`, `scripts/generate-tokens.test.ts`

**Don't:** point `htmlFor` at the default Switch id; trust a design that shows only one switch state for the off colours (compute the ratios).
**Related:** [[knowledge/gotchas#^g05|G05]] · [[knowledge/gotchas#^g33|G33]] · [[REQ-011]]

## G41 — Route tests that reach the real validators and owner checks ^g41

| Field | Value |
|---|---|
| Discovered | 2026-10-07 |
| REQ | REQ-011 |
| Component | backend tests |
| Status | confirmed |
| Severity | careful |

**What:** `routes.test.ts` fakes every async Manager method, so a 400 from a validator or a 403 from the owner check never runs there. To test them through HTTP, delegate the faked method to a real manager from `vi.importActual` and `vi.spyOn` its `alumniQuery` / `userQuery`.

**Where:** `packages/backend/src/api/routes/routes.test.ts` (REQ-011 block)

**Don't:** assert 400/403 in that file with the plain mocks; they would pass without exercising the rule.
**Related:** [[knowledge/gotchas#^g13|G13]] · [[architecture/adr-05-backend-tests-vitest-supertest|ADR-05]]
