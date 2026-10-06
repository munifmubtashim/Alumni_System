# REQ-004-alma-rebrand-auth-shell — Review log

Full reviewer narratives. The consolidated verdict lives in `verification.md`.

## Correctness findings

Written by: correctness-reviewer (tier: balanced)

**Summary:** Reviewed the router/shell change, SessionBridge placement, PasswordInput, the Base UI Tooltip-on-radio, ForgotPasswordHelp and the auth page diffs. 0 findings (0 critical, 0 major, 0 minor). I also ran the frontend suites for app, features/auth and components/ui: 20 files, 258 tests, all pass.
- Router and RootLayout: checked, nothing. SessionBridge mounts once above both shells, so it is not remounted when moving between login and home. Its 401, expiry and cache-clear paths run on /login and /register (session.test.tsx drives /login through the real `routes`). Each shell has its own inner error layer, with the "/" layer as the outer one. GuestOnly and RequireAuth are unchanged, so redirect-back through `state.from` and `resolveFrom` is intact.
- No auth logic changed: LoginPage and RegisterPage only swap in PasswordInput, add placeholders, and change the copy and layout.
- PasswordInput: checked, nothing. Focus stays in the input on mouse click because of `preventDefault` on mousedown. The button is keyboard-operable and its name flips between Show and Hide. Flipping `type` keeps the same DOM node, so the ref, value and caret survive.
- Tooltip on radios: checked, nothing. ThemeToggle tests cover the tooltip opening on keyboard focus (including arrow-key moves) and on hover. The accessible name comes from `aria-label`, so the tooltip is not the only source of it.
- ForgotPasswordHelp mailto: checked, nothing. The subject goes through `encodeURIComponent`, and the address matches AC5. `hidden` is not overridden, because the CSS never sets `display` on `.message`.

## Quality findings

Written by: quality-reviewer (tier: balanced)

**Summary:** Checked 63 files (about 40 source/test) against conventions.md Frontend, Linting and Testing. 0 critical, 0 major, 4 minor, 2 trivial. Tokens-only CSS, CSS Modules naming, primitive folder shape (Logo, PasswordInput have all four files), README coverage (config/, app/, ui/, features/, package README, CLAUDE.md) and removed-code leftovers (`labelAction`, `app/brand.ts`, compact-logo plan) all checked, nothing found; the brand literal rule holds (no `Alma`/`alma.app` in non-test `src`). Biggest: the new icon-only branch in `SegmentedControl` has no test in its own test file.

### QUAL-001: Icon-only option and tooltip not tested in SegmentedControl.test.tsx

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/frontend/src/components/ui/SegmentedControl/SegmentedControl.tsx:62` |
| Category | test-coverage |
| Rule | conventions.md Testing > Frontend (co-located tests, one per primitive) |

**What:** `IconOption` (aria-label, tooltip, `iconOption` class) is exercised only through ThemeToggle.test.tsx; `SegmentedControl.test.tsx` has no change in this diff.
**Why it matters:** Another caller using `icon` would lose coverage if ThemeToggle is changed or removed. It also lets a regression in the mixed case (some options with `icon`, some without) pass.
**Recommendation:** Add 2-3 tests in SegmentedControl.test.tsx: icon option is named by `label` and shows no text, tooltip on focus, mixed icon and text options still arrow-key through.

### QUAL-002: Hard-coded copyright year

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/frontend/src/features/auth/AuthLayout.tsx:27` |
| Category | convention |
| Rule | conventions.md Frontend > Config/brand constants (brand text lives in `config/brand.ts`) |

**What:** `© 2026` is a literal inside AuthLayout, while the brand name beside it comes from `config/`.
**Why it matters:** The year goes stale in January with no test or lint to notice; the README rule says brand text has one home.
**Recommendation:** Compute `new Date().getFullYear()` at render, or add a `COPYRIGHT_NOTICE` export to `config/brand.ts`. No test pins the string today, so add one.

### QUAL-003: Three different ways to draw an icon

| Field | Value |
|---|---|
| Severity | minor |
| Effort | medium |
| File | `ThemeToggle.tsx:56`, `PasswordInput.tsx:35`, `AuthLayout.tsx:78` (all under `packages/frontend/src/`) |
| Category | duplication |
| Rule | none documented (convention-gap) |

**What:** ThemeToggle builds icons with a shared `ICON_PROPS` object and inline `stroke="currentColor"`. PasswordInput and AuthLayout each repeat `viewBox`, `aria-hidden`, `focusable=false` and set stroke through their own CSS module (`.icon` and `.check` carry the same five stroke rules).
**Why it matters:** Each new icon will pick a pattern at random, and the same stroke CSS is copied. Not worth a shared `Icon` primitive yet, but worth a decision.
**Recommendation:** Either keep as is and note it in ui/README.md, or add a small `Icon` primitive when a fourth icon appears. User decides whether to codify.

### QUAL-004: Redundant `color: inherit` in Logo.module.css

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/frontend/src/components/ui/Logo/Logo.module.css:8,32` |
| Category | dead-code |
| Rule | n/a |

**What:** `color` is inherited by default, so `.logo { color: inherit }` and `.wordmark { color: inherit }` change nothing.
**Why it matters:** Reads as if something overrides color; it makes the next editor hunt for the cause.
**Recommendation:** Delete both declarations.

### QUAL-005: Magic tooltip delay with no comment

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `packages/frontend/src/components/ui/SegmentedControl/SegmentedControl.tsx:76` |
| Category | naming |
| Rule | n/a |

**What:** `delay={300}` is unexplained, while the neighbouring `sideOffset={4}` has a comment.
**Recommendation:** Hoist to `const TOOLTIP_DELAY_MS = 300` or add a one-line comment.

### QUAL-006: Awkward line break in AuthShell doc comment

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `packages/frontend/src/app/AuthShell/AuthShell.tsx:7-9` |
| Category | documentation |
| Rule | n/a |

**What:** The doc comment breaks mid-sentence after "(icon-only) theme toggle", a leftover from an edit to the old compact-logo wording.
**Recommendation:** Re-wrap the paragraph.

### Round 2 re-review

- QUAL-001: resolved. SegmentedControl.test.tsx adds icon-only naming, mixed icon/text order and click, and tooltip on keyboard focus (`findByText('Grid')` visible).
- QUAL-002: resolved. AuthLayout.tsx uses `new Date().getFullYear()`; the page tests compute the year too.
- QUAL-003: still open (pending decision m6); the diff does not touch icon drawing.
- QUAL-004: resolved. `color: inherit` is gone from both Logo rules.
- QUAL-005/006: resolved. The delay now has a comment, and the AuthShell comment is re-wrapped. The new `index.html` title test in brand.test.ts also covers ARCH-004's drift risk.
- NEW QUAL-007 (trivial): AuthLayout.module.css `.panel` hard-codes `3rem` as the toggle height (`calc(var(--space-4) + 3rem + var(--space-3))`). It is really 2.5rem segments plus track padding and border, computed in SegmentedControl.module.css. If either changes, the logo can touch the toggle again with no test failing. The comment explains it, so this is acceptable, but a shared token or a comment in SegmentedControl.module.css would make it safer.
- No regressions found.

## Architecture findings

Written by: architecture-reviewer (tier: balanced)

**Summary:** Checked 63 files (frontend + docs). 0 critical, 0 major, 2 minor, 2 trivial. The `config/` leaf, its lint block, docs (CLAUDE.md, frontend README, three folder READMEs) and enforcement fixtures all agree, so L-REQ-001-4 is met. `components/ui` stays prop-driven. Router shape follows L-REQ-001-7 and ADR-03 (one SessionBridge). Biggest: the accepted ADR-03 still says SessionBridge lives in `AppShell`.
Dispatch answers: config boundary vs docs vs fixtures: checked, nothing. ui prop-driven (Logo, PasswordInput, SegmentedControl+Tooltip, ThemeToggle variant): checked, nothing (Tooltip is Base UI, within ADR-01). Router/error layers: checked, nothing new (a shell crash still drops RootLayout, as before). ADR-01/02/04: aligned. ADR candidates: see ARCH-002.

### ARCH-001: ADR-03 and context/architecture.md still describe the old shell

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `.adlc/architecture/adr-03-frontend-session-and-401-handling.md:59`, `.adlc/context/architecture.md:36` |
| Category | contract |
| Rule broken | ADR-03 constraint table; vault docs must match code |

**What:** ADR-03 says SessionBridge is "mounted inside the router (in `AppShell`)". It now lives in `RootLayout` (`src/app/RootLayout.tsx:11`), because AuthShell has no header. `context/architecture.md` still lists only `AppShell`, and the ui list omits Logo and PasswordInput.
**Why it matters:** An accepted ADR now contradicts the code. A later reader may move the bridge back into a shell and lose it on auth pages.
**Recommendation:** Amend the ADR-03 line to "inside the router, in `RootLayout` (above both shells)". Refresh the `context/architecture.md` row (RootLayout, AuthShell, config/, Logo, PasswordInput).
**References:** [[architecture/adr-03-frontend-session-and-401-handling]]

### ARCH-002: Two decisions may deserve an ADR

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/frontend/eslint.config.js:90`, `src/app/router.tsx:57` |
| Category | pattern |
| Rule broken | ETHOS principle 4 (decisions are recorded) |

**What:** (a) `config/` is a new src layer with its own lint rules, and ui is banned from it; (b) auth pages render in a header-less AuthShell under a shared RootLayout. Both are lasting structure rules that live only in READMEs and the architecture revisions.
**Why it matters:** Revision notes are archived with the REQ. Later work will ask why ui cannot read `BRAND_NAME` and why login has no header. This needs an ADR if the user wants it recorded; I do not propose its content.
**Recommendation:** Offer one ADR ("frontend layer map: config leaf, root/auth/app layouts"), or record both as a concept page.
**References:** [[concepts]] (none yet), L-REQ-001-4

### ARCH-003: Theme-toggle wiring is copied in two shells, and AuthLayout depends on the toggle's position

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `src/app/AuthShell/AuthShell.tsx:15`, `src/features/auth/AuthLayout.module.css:17` |
| Category | separation |
| Rule broken | features/ and app/ separation (app/README.md) |

**What:** AppShell and AuthShell each call `useAtom(themePreferenceAtom)` and wire ThemeToggle. Separately, AuthLayout's narrow CSS reserves top padding "to clear the theme toggle", which only AuthShell draws, so a feature layout depends on a shell detail.
**Why it matters:** A third shell would copy the wiring again. Moving the toggle breaks the auth page spacing quietly.
**Recommendation:** If a third shell appears, extract an `app/ThemeSwitch`. Keep the padding comment pointing at AuthShell.
**References:** `src/app/README.md`

### ARCH-004: Tab title is a second source of the brand name

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `packages/frontend/index.html:7` |
| Category | pattern |
| Rule broken | README: nothing else hardcodes the brand (`README.md:127`) |

**What:** `<title>Alma</title>` is static, so it can drift from `BRAND_NAME`. The theme storage key in the same file has a test; the title has none.
**Recommendation:** Add a one-line test in `src/config/brand.test.ts` that reads `index.html` and checks the title, as the theme-key test does. Or set `document.title` from `BRAND_NAME`.
**References:** `packages/frontend/README.md:127`

### Round 2 re-review

Written by: architecture-reviewer (round 2)

**Summary:** Re-checked the round-2 diff. 0 critical, 0 major, 0 new blocking; 2 trivial notes. ARCH-001/002 stay wrap-up decisions (ADR-06/07).
- ARCH-003: accepted. Duplicate toggle wiring kept on purpose; the padding comment now names AuthShell and gives the arithmetic. Closed.
- ARCH-004: fixed. `config/brand.test.ts` pins `<title>` to `BRAND_NAME`. Closed.
- NEW-A (trivial): the title test sits in `config/` and imports `../../index.html?raw`, outside `src/`. The leaf rule covers internal layers only, so it is not a violation, but the README says "imports nothing internal"; add one line saying tests may read repo-root files.
- NEW-B (trivial): `.panel` padding `calc(--space-4 + 3rem + --space-3)` hard-codes the toggle's height (2.5rem segments plus offset) from another component. It is documented, but nothing fails if `.iconOption` size changes. Optional: expose a `--auth-toggle-clearance` custom property set in AuthShell.module.css and consume it here.

## Reflection findings

Written by: reflector (tier: balanced)

**Summary:** Checked 21 lessons (0 superseded), 16 gotchas, 5 ADRs, 2 concepts, 1 component page, plus the user-facing docs you named (CLAUDE.md, frontend README, folder READMEs, conventions.md). Docs are clean: all describe RootLayout/AuthShell/config/compact toggle correctly. 5 findings: 0 critical, 1 major, 4 minor. Biggest: the password show/hide icon is ~2.8:1 in light mode and is not pinned in the contrast test (the same trap L-REQ-001-6 describes). Nothing found on G05, G08, G09, G12, ADR-01/02/04. The inline-SVG Stylelint exemption was not needed; Logo uses CSS classes, correct.

### REFL-001: PasswordInput toggle icon is under 3:1 and not pinned

| Field | Value |
|---|---|
| Severity | major |
| Effort | small |
| File | `packages/frontend/src/components/ui/PasswordInput/PasswordInput.module.css:15` |
| Category | repeated-mistake |
| Vault reference | [[knowledge/lessons/LESSON-REQ-001-6-contrast-changes-sweep-all-uses|L-REQ-001-6]] |

**What:** The toggle uses `ink-muted` on the Input's `surface-sunken` fill: 2.79:1 light (#948c84 on #f0ebe3), 4.40:1 dark. Icon buttons need 3:1 (non-text). No such pair is in `contrast.test.ts`.
**Why it matters:** `AuthLayout.module.css:95` already says ink-muted on sunken fails, so the team knew. The only control that reveals the password is faint in light mode.
**Recommendation:** Use `ink-secondary` for the icon (already pinned on sunken at 4.5:1), or add the pair to `PAIRS` or `EXCEPTIONS` with a recorded floor. Hover (`ink-secondary`) is then the only change cue; check it is still visible.

### REFL-002: Vault says SessionBridge is mounted in AppShell (now RootLayout)

| Field | Value |
|---|---|
| Severity | major |
| Effort | small |
| File | `.adlc/knowledge/concepts/session-and-401.md:11`, `.adlc/architecture/adr-03-frontend-session-and-401-handling.md:59` |
| Category | vault-stale |
| Vault reference | [[architecture/adr-03-frontend-session-and-401-handling|ADR-03]], [[knowledge/concepts/session-and-401]] |

**What:** Both pages say SessionBridge lives "in AppShell". The code moved it to `app/RootLayout.tsx`, above both shells, so auth pages (no header) still get the 401 notice and expiry drop. Code is right; vault is wrong.
**Why it matters:** Someone reading ADR-03 may move it back into a shell, and the auth pages lose session handling.
**Recommendation:** At /wrapup, edit the ADR-03 constraint row to "mounted once in RootLayout, above AuthShell and AppShell", and the concept line 11 the same. Also line 20 (`AppShell.test.tsx` pins the single redirect) is still true; leave it. Needs a decision: edit the accepted ADR in place, or add a short "Update (REQ-004)" note.

### REFL-003: Component page and architecture.md describe the pre-REQ-004 frontend

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `.adlc/knowledge/components/frontend.md:13-15`, `.adlc/context/architecture.md:36` |
| Category | vault-stale |
| Vault reference | [[knowledge/components/frontend]] |

**What:** frontend.md lists `AppShell (+ HeaderAuth, mounts SessionBridge)`, `GuestOnly/RequireAuth layouts`, and ui primitives without Logo, PasswordInput, `Input endAdornment`, or ThemeToggle `variant="compact"` (icons plus Tooltip). It has no `config/` folder. architecture.md:36 lists only `AppShell` and says "Renders only the shell so far".
**Recommendation:** At /wrapup, add RootLayout/AuthShell/`config/brand.ts`, the three new primitives and compact toggle to frontend.md; fix the architecture.md row.

### REFL-004: No concept page for the two-shell route layout

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/frontend/src/app/router.tsx:48-66` |
| Category | missing-vault-page |
| Vault reference | [[knowledge/lessons/LESSON-REQ-001-7-route-errors-pathless-layout|L-REQ-001-7]] |

**What:** The RootLayout, AuthShell and AppShell tree, with an `errorElement` on the root plus one pathless inner route per shell, is now a pattern three docs restate (CLAUDE.md, frontend README, app README). L-REQ-001-7 covers only the single-shell version.
**Recommendation:** Fold into a short concept `routing-and-shells` (what lives in the root layout, why, where test pages go), or add a line to L-REQ-001-7 saying it holds per shell.

### REFL-005: Design-tokens concept status and Logo hex-to-token rule not recorded

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `.adlc/knowledge/concepts/design-tokens.md:5` |
| Category | concept-drift |
| Vault reference | [[knowledge/concepts/design-tokens]] |

**What:** Status says "current as of REQ-001". REQ-004 adds the rule that brand SVG fills become CSS classes on tokens (`Logo.module.css`), and that icon sizes stay literal rem. The page's literal-sizes list omits these.
**Recommendation:** One bullet at /wrapup: inline SVG takes colour from `fill`/`stroke` token classes, never the file's hex, so no lint exemption is needed.

(0 trivials not listed)

### Round 2 re-review

**Summary:** REFL-001 fixed. REFL-002..005 still accurate (round 2 touches none of those vault pages). 2 new trivials, 0 new lessons.

- REFL-001 (M1): fixed. `PasswordInput.module.css:12` is now `ink-secondary` (hover `ink-primary`), and `contrast.test.ts:67` pins the pair. `ink-secondary` on `surface-sunken` is already held at 4.5 (TEXT) at lines 49-50, so the new 3:1 row is redundant but harmless; hover `ink-primary` on sunken is pinned at TEXT too.
- REFL-002..005: unchanged and still true; wrap-up items.
- NEW REFL-006 (trivial, concept-drift, [[knowledge/concepts/design-tokens]]): `AuthLayout.module.css:658` hard-codes `3rem` as the toggle height. It is right today (2.5rem segment + 2x3px padding + 2px border = 48px) but it is a second copy of a number that lives in `SegmentedControl.module.css`/`AuthShell`. Extends ARCH-003; fold into the same wrap-up note, no code change needed.
- NEW REFL-007 (trivial, vault-stale): the `:has(.iconOption)` gap rule is the first `:has()` in the app CSS. Checked: no browserslist or support target in `package.json` or the vault, Vite's default target already covers `:has()` (baseline since late 2023), so no finding on support. Wrap-up could add one line to `design-tokens.md` that `:has()` is allowed.
- Docs sweep of the round-2 diff: `ui/README.md:17`, `CLAUDE.md:90-91` name the compact toggle but give no size, and "©" without a year; nothing stale. Neither mentions the fixed-from-60rem toggle; optional one line in `app/AuthShell` README.

## UI/UX findings

Written by: ui-reviewer (tier: balanced)

**Summary:** No browser was available (no Chrome tools, no Playwright, no Chrome install), so this is a source-only review of the auth shell, AuthLayout, LoginPage, ForgotPasswordHelp, PasswordInput, compact ThemeToggle and AppShell CSS/TSX. Nothing was started, so no dev server needed tearing down. 0 critical, 0 major, 1 minor, 1 trivial. Nothing in source contradicts AC1-AC8. The orchestrator's earlier browser check in TASK-007 already covered light mode at 1440px and 390px, so the manual checklist below targets what that check did not: dark mode, error/loading states, keyboard and 200% zoom.

### UI-001: Compact theme toggle segments are small touch targets

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| Route / flow | `/login`, `/register` at phone width |
| Lens | a11y |
| Evidence | static: `SegmentedControl.module.css` `.iconOption` (padding `--space-1`, 1.25rem icon, 1px border) gives about 30px square segments |

**What:** Each icon segment is about 30x30px, in the top-right corner of a phone screen.
**Why it matters:** It passes WCAG 2.2 minimum size (24px) but is under the 44px touch guideline, and the three segments sit side by side with a 2px gap, so thumb mis-taps are likely.
**Recommendation:** If you want it larger, raise `.iconOption` padding to `--space-2` (about 38px). Optional; the desktop design is compact on purpose.

### UI-002: Auth toggle scrolls away on a long sign-up form

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| Route / flow | `/register`, wide screens (60rem and up) |
| Lens | design-match |
| Evidence | static: `AuthShell.module.css` `.toggle` is `position: absolute`, while the brand panel in `AuthLayout.module.css` is `sticky` |

**What:** The panel stays pinned while the form scrolls, but the theme toggle scrolls off with the page.
**Why it matters:** Only cosmetic. The design may do the same; check against `signup/Desktop-Light-Empty.dc.html`. Ignore if it matches.
**Recommendation:** None unless the design shows a pinned toggle.

Dispatch questions: header without nav links (AC6), Forgot password markup and mailto (AC5; `hidden` attribute is not overridden by CSS, `aria-expanded` and `aria-controls` present), show/hide password (aria-label flips, focus kept on mouse click), no skip link and one `h1` on auth pages: checked in source, nothing. Tooltip on keyboard focus, 200% zoom and dark mode could not be seen: see the checklist.

**UI review tier:** static-only — `/login` and `/register` (source), signed-in header (source); 0 screenshots; 0 critical / 0 major / 1 minor (1 trivial).

### Round 2 re-review

Written by: ui-reviewer (tier: balanced). Trigger: direct-ui-change.

**Summary:** Browser still unavailable (no Chrome tools, no Playwright/Puppeteer, no Chrome install), so this is source-only; no dev server started, nothing to tear down. Both round-1 findings are resolved in source. 0 new findings.

- UI-001 (small touch targets): resolved. `SegmentedControl.module.css:76-80` gives `.iconOption` min 2.5rem square, and `:72` sets a `--space-1` gap for icon tracks only. Pill height works out to exactly 3rem (2.5rem + 2 x (0.25rem - 1px) padding + 2px border).
- UI-002 (toggle scrolls away on desktop): resolved. `AuthShell.module.css:38-42` sets `position: fixed` from 60rem, matching the sticky brand panel. Phones stay `absolute` and scroll away with the page.
- Phone top padding: `AuthLayout.module.css` `.panel` reserves 1rem + 3rem + 0.75rem = 4.75rem, matching the toggle's top offset and height at under 48rem, so no overlap. At 48-60rem the toggle sits at 1.5rem, so it ends at 4.5rem and the logo starts at 4.75rem: clears by 0.25rem (tight but not overlapping, and the logo is centred, so only the narrow-phone case could collide).
- Checked, nothing: on desktop a fixed, opaque pill floats over the form column while the form scrolls under it. That is normal for a pinned control and the right column has top padding at rest.

**UI review tier:** static-only — `/login` and `/register` (source, CSS arithmetic); 0 screenshots; 0 critical / 0 major / 0 minor. Not seen in a browser: real 390px render, scrolled sign-up at desktop. Checklist items 2 and 8 below still apply; for item 2 also measure each toggle segment (at least 40px) and the gap between toggle and logo (at least 0). For item 8 confirm the toggle stays put while scrolling at 1440px.

## UI manual-verification checklist

Start with `cd packages/frontend && npx vite --port 5173 --strictPort`. No API is needed for guest pages.

1. `/login` light and dark at 1440px: brand panel left (sunken surface, logo, headline "Welcome back to your alumni network.", 3 neutral points, "© 2026 Alma"), form right, compact icon toggle top-right. Compare with `docs/design/screens/login/Desktop-*.dc.html`. Expect no "Remember me", no counts.
2. `/login` at 390px (use a 390px iframe) in both themes: panel is only the centred logo, no overlap with the toggle, no horizontal scroll.
3. Submit empty: both field errors show, focus lands on Email. Fill only email, submit: focus lands on Password.
4. Submit valid values with the API down: the button shows busy and is disabled, then an error Alert shows and focus goes to the alert. Clicking twice sends one request.
5. Show/hide password: click the eye (focus stays in the input), then Tab to it and press Space. The name flips Show/Hide and text shows or hides.
6. Forgot password: Tab to it, press Enter and then Space. The message opens, the mailto link has the reset subject, and the button toggles closed again. The focus ring must be visible.
7. Keyboard on the theme toggle: Tab into it, then arrow keys. The tooltip (Light/Dark/System) shows on focus, the choice applies and persists after reload. The checked segment is clearly visible in dark mode.
8. `/register`: same checks as 1-2, 3 and 5 in both themes, plus both password fields if present. A long form should scroll with the panel pinned.
9. 200% zoom (and 400% if feasible) on both pages: no clipped text, no toggle/logo overlap, form still reachable.
10. `/does-not-exist` (or `/` signed in): header shows logo plus "Alma", the labelled Light/Dark/System toggle, Log in / Sign up (or user menu), and no nav links. Skip link appears on first Tab.

