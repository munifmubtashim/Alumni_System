# Architecture adversary — REQ-004-alma-rebrand-auth-shell

Written by: architecture-adversary (tier: balanced), dispatched sub-agent.

| Field | Value |
|---|---|
| Generated | 2026-10-06 |
| Trigger | ui-surface + large-blast-radius |
| Verdict | found problems |

## Summary

I read the spec, architecture, 5 tasks, the exploration report, the five auth/shell test files, `Input`, `eslint.config.js`, the brand SVGs, the tokens and the designs. I found 8 problems: 1 critical, 2 major, 5 minor. The biggest: two existing tests assert `getAllByRole('button')` has length 1, so adding the show/hide and "Forgot password?" buttons breaks them. That makes the "existing tests pass unedited" claim (AC4, TASK-003) false.

Dispatch questions, one line each:
- (1) Existing tests unedited: no, see ADV-001. Other asserts are safe: `region` by name, `getByLabelText('Password')` (exact match, so "Show password" does not collide), headings, and banner text.
- (2) PasswordInput: see ADV-003 (aria-pressed with a changing label, Input wrapper width). Autofill and `autoComplete` are safe because `name` and `autocomplete` are forwarded unchanged.
- (3) eslint `config/` block: checked, nothing wrong with the glob or the last-match-wins rule. The one gap is ADV-007. `store` needs no change.
- (4) Logo: checked, nothing. No hex literal, `currentColor` is fine, and the mark colour is already the brand file's `#975c43`. Accent on sunken is about 4.5:1 in light and far higher in dark. The link name is just "Alma".
- (5) ForgotPasswordHelp: see ADV-004. `encodeURIComponent` gives `%20`, which matches the test.
- (6) AuthLayout: see ADV-005 and ADV-006. At 200% zoom the 60rem breakpoint is in rem, so a 1280px screen drops to one column. Checked, nothing.
- (7) Design states: see ADV-008.
- (8) Task conflicts: ADV-002. TASK-004 never touches `contrast.test.ts`, so there is no TASK-003/004 overlap.

## Findings

### ADV-001: Two existing tests count buttons and will fail

| Field | Value |
|---|---|
| Severity | critical |
| Confidence | high |
| Lens | contradiction |
| Where | spec AC4; `tasks/TASK-003.md` Acceptance; `architecture.md` Test strategy |

**What:** `LoginPage.test.tsx:147` and `RegisterPage.test.tsx:166` assert `getAllByRole('button')).toHaveLength(1)`. The plan adds the show/hide toggle (both pages) and the "Forgot password?" button (login). Login then has 3 buttons and sign-up has 2.
**Why it matters:** TASK-003's gate says "existing tests pass without edits", and AC4 allows only brand-text edits. An implementer cannot meet both and the new buttons the spec asks for. They will either weaken the test silently or drop a feature.
**Refutation tried:** Maybe the toggle is not a "button" role. It is a `<button>`, so it counts. Maybe the tests render a different tree. They render only the page. Not saved.
**Recommendation:** Say plainly in AC4, TASK-003 and the test strategy that these two assertions change. Make them `getByRole('button', {name:'Log in'})` plus a count scoped to the form's submit buttons. Keep it as one named, reviewed edit.

### ADV-002: TASK-001 turns the shell tests red before TASK-004 fixes them

| Field | Value |
|---|---|
| Severity | major |
| Confidence | high |
| Lens | testability |
| Where | `tasks/TASK-001.md` (Files, Notes, Acceptance); `tasks/TASK-004.md` |

**What:** TASK-001 deletes `app/brand.ts`, re-points AppShell to `config/brand.ts` and sets `BRAND_NAME = 'Alma'`. `AppShell.test.tsx:138,173,183` still expect "Alumni Network" until TASK-004.
**Why it matters:** TASK-001's own acceptance says "`npm test` pass". It fails at the end of Tier 0, and the Tier 0/1 split makes that a real red gate.
**Refutation tried:** The acceptance says "except tests TASK-004 updates", but only for the grep line. The `npm test` line has no such exception. Not saved.
**Recommendation:** Move the 3 brand-text assertion edits from TASK-004 into TASK-001. TASK-004 keeps only the "no nav" case.

### ADV-003: PasswordInput a11y and the Input wrapper

| Field | Value |
|---|---|
| Severity | major |
| Confidence | medium |
| Lens | ux-consistency |
| Where | `architecture.md` §PasswordInput; `tasks/TASK-002.md` Approach |

**What:**
1. The toggle sets both `aria-pressed` and a label that flips between Show and Hide. That is the known anti-pattern: a screen reader says "Hide password, toggle button, pressed", which reads as the opposite of the state. Use a flipping name alone, or a fixed name with `aria-pressed`, never both.
2. The new `.control` div wraps the input. Today `.input` stretches because `.field` is a flex column. Inside a block div it becomes inline-block at its intrinsic width. Neither the architecture nor TASK-002 states `width:100%` and `box-sizing:border-box`, so password fields would render narrower than email fields.
3. The `onMouseDown` preventDefault only keeps focus if the input was already focused. A user who clicks the toggle first leaves focus on the body. The test "input keeps focus" must focus the input first, and the plan should say so.
**Refutation tried:** AC6 literally demands a state-reflecting name, so the label flip is required. That kills "drop the label flip", not the finding. The fix is to drop `aria-pressed`. The wrapper-width point is not refuted by "Input tests stay valid": no existing test checks layout.
**Recommendation:** Drop `aria-pressed` (the Show/Hide name satisfies AC6) and adjust the planned test. Add `.control { position: relative }` and `.input { width: 100%; box-sizing: border-box }` to TASK-002's CSS notes. Make the focus test focus the input first.

### ADV-004: "Forgot password?" has no place to live

| Field | Value |
|---|---|
| Severity | major |
| Confidence | medium |
| Lens | omission |
| Where | `tasks/TASK-003.md` ForgotPasswordHelp ("beside the password label row"); `tasks/TASK-002.md` |

**What:** The design puts "Forgot password?" on the label row, right-aligned. `Input` owns its label markup and only gains `endAdornment`, so a page cannot put a button on the label row. Nothing in the blast radius adds a label slot.
**Why it matters:** The implementer will either add an unplanned `Input` prop (a second Input edit, not in the risk table) or absolute-position the button over the label (breaks at 200% zoom and long labels). The disclosure message also needs a spot: inside `.field` it would sit between the input and its error text and change the `aria-describedby` order.
**Refutation tried:** It could simply go below the field. That is possible but contradicts the task text and the design, and the choice is left to a guess. Not saved.
**Recommendation:** Pick one in the architecture. Either add `labelAction?: ReactNode` to `Input` (and `PasswordInput`), or put the button below the field and record it as a design deviation. Also: the AC5 sentence is split by the `<a>`, so the test must compare the paragraph's `textContent`, not `getByText` of the full sentence.

### ADV-005: `<aside>` inside `<main>` is an a11y landmark violation

| Field | Value |
|---|---|
| Severity | minor |
| Confidence | medium |
| Lens | ux-consistency |
| Where | `architecture.md` §Auth frame; `tasks/TASK-003.md` AuthLayout |

**What:** `AuthLayout` renders inside AppShell's `<main>`. An `<aside>` there is a complementary landmark nested in another landmark, which axe flags (`landmark-complementary-is-top-level`). The aside also comes before the form in DOM order, so reading order starts with marketing copy.
**Refutation tried:** Nothing in jsdom tests would catch it, and that is the problem. The panel is decorative copy, not complementary content. Not saved.
**Recommendation:** Use a plain `<div>` for the panel (a `<ul>` for the three points). Put it after the form `<section>` in DOM and place it first visually with grid `order`. Add one test that the auth page has no `complementary` role.

### ADV-006: The brand appears two or three times on every screen

| Field | Value |
|---|---|
| Severity | minor |
| Confidence | medium |
| Lens | ux-consistency |
| Where | `architecture.md` §Auth frame, §Convention alignment, Open questions |

**What:** Auth stays inside the shell. Desktop shows the header Logo plus the panel Logo. Phone shows the header Logo plus the compact Logo above the h1. The designs show it once. In jsdom, CSS modules are not applied, so the hidden compact Logo and the panel Logo are both in the accessibility tree: any new `getByText('Alma')` or `getByRole('img', {name:'Alma'})` finds several.
**Refutation tried:** The architecture admits the full-bleed deviation (and AC2 says "match"). It does not list the duplicated logo as a consequence. The decision stands but its cost is unstated.
**Recommendation:** Drop the compact phone Logo (the header already carries it). Let `Logo` take an optional decorative mode (`label` omitted gives `aria-hidden`) for the panel. Say in AC2's notes that the 45/55 panel inside the 72rem padded `<main>` will look boxed, not full-bleed.

### ADV-007: `config/` boundary docs and lint do not match

| Field | Value |
|---|---|
| Severity | minor |
| Confidence | high |
| Lens | contradiction |
| Where | `architecture.md` §Brand constants; `tasks/TASK-001.md` Lint; `tasks/TASK-002.md` Notes; `eslint.config.js` (ui block) |

**What:** The design says `components/ui` must not import `config/` (it stays prop-driven), and TASK-002 repeats it. TASK-001 only adds a ban on `config/` importing others. Nothing forbids ui from importing `config/`. Also "imports nothing internal" is broader than the ban list (app, features, components, store, services): `styles/` and `test/` are not covered.
**Refutation tried:** The new `src/config/**` glob does not overlap any existing block, and `store` needs nothing. So the eslint mechanics are fine. The mismatch is real. That is exactly what L-REQ-001-4 warns about.
**Recommendation:** Add `layerBan('config', …)` to the ui block's patterns, with an enforcement fixture. Either add `styles`/`test` to the `config/` ban or word the README as "imports no layer folder".

### ADV-008: Design states and copy the pages will not carry are not listed as deviations

| Field | Value |
|---|---|
| Severity | minor |
| Confidence | medium |
| Lens | ux-consistency |
| Where | spec AC2; `architecture.md` §Convention alignment (Deviations list) |

**What:** The designs show a sign-up summary banner ("Fix the 3 fields above before creating your account."), a tinted error input background, a "Logging in…" button label, and the headings "Create your account". The pages keep a heading "Sign up" and "Log in" (tests key on the region names) and have no summary or tint. The loading label cannot change either: the busy test finds the button by name "Log in" while `aria-busy` is set.
**Refutation tried:** Pages already render an error Alert and a busy state, so the states exist. The gap is only that AC2 says "match" while these differ silently. Narrow.
**Recommendation:** Add these four to the Deviations list so the reviewer does not file them as bugs.

## Coverage

- **Lenses run:** omission, failure-mode, hidden-coupling, contradiction, testability, UX and design consistency.
- **Lenses skipped:** rollback and reversibility (frontend-only, no data or schema, revert is one commit); cross-repo (single repo).
- **Acceptance-criteria coverage:** AC1 checked (TASK-001; the grep and favicon are covered). AC2 checked (ADV-006, ADV-008). AC3 checked. AC4 checked (ADV-001, ADV-002). AC5 checked (ADV-004). AC6 checked (ADV-003). AC7 checked. No AC is without a task.
