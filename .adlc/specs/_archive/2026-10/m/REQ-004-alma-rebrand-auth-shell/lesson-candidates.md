
## CAND-001 [implement-task]
**Claim:** Don't use `queryByText(...)` to prove text is hidden from assistive tech; it ignores `aria-hidden`. Use role queries or check the hidden ancestor.
**Saw it in:** `packages/frontend/src/components/ui/Logo/Logo.test.tsx:27`
**Context:** The decorative Logo's wordmark is under an `aria-hidden` root, but `queryByText` still found it.

## CAND-002 [implement-task]
**Claim:** When adding a lint boundary, delete the new block once and run the enforcement test to prove the fixtures fail without it.
**Saw it in:** `packages/frontend/eslint.config.js` (config/ block), `packages/frontend/scripts/enforcement.test.ts`
**Context:** Removing the config/ block turned 10 fixtures red; that is how "fails if the ban is removed" was checked.

## CAND-003 [implement-task]
**Claim:** In Vitest, CSS Module classes resolve to their plain names, so tests can assert layout hooks with `toHaveClass('control')`.
**Saw it in:** `packages/frontend/src/components/ui/PasswordInput/PasswordInput.test.tsx:62`
**Context:** Used to prove password and email fields share the same width wrapper, since jsdom has no layout to measure.

## CAND-004 [implement-task]
**Claim:** To keep focus in an input when clicking a button inside it, `preventDefault()` on the button's mousedown; keyboard activation is unaffected.
**Saw it in:** `packages/frontend/src/components/ui/PasswordInput/PasswordInput.tsx:26`
**Context:** user-event honours the prevented mousedown, so the focus-stays test is meaningful in jsdom.

## CAND-005 [implement-task]
**Claim:** When asserting "no nav links" in the header, allow for HeaderAuth's guest `<nav aria-label="Account">`; asserting zero navigation landmarks fails for guests.
**Saw it in:** `packages/frontend/src/app/AppShell/HeaderAuth.tsx:24`
**Context:** TASK-004's approach said "no navigation landmark inside the banner"; the guest auth links already sit in a nav.

## CAND-006 [implement-task]
**Claim:** Never set `display` on an element toggled with the `hidden` attribute; a CSS Modules rule beats the UA `[hidden]` style and the element shows anyway.
**Saw it in:** `packages/frontend/src/features/auth/ForgotPasswordHelp.module.css:18`
**Context:** The disclosure message keeps `hidden` so `aria-controls` always points at a real element; jsdom tests would not catch a CSS override.

## CAND-007 [implement-task]
**Claim:** To count a form's submit buttons, filter `getAllByRole('button')` by `type="submit"`; disclosure and show/hide toggles are buttons too.
**Saw it in:** `packages/frontend/src/features/auth/LoginPage.test.tsx:147`
**Context:** Adding PasswordInput and ForgotPasswordHelp broke two "exactly one button" assertions.

## CAND-008 [implement-task]
**Claim:** Check a design's muted text colour against the real token pair before using it; `ink-muted` on `surface-sunken` is 2.79:1 in light.
**Saw it in:** `packages/frontend/src/features/auth/AuthLayout.module.css` (.copyright)
**Context:** The architecture named `--ink-muted` for the © caption; it fails WCAG text contrast, so `--ink-secondary` was used.

## CAND-009 [implement-task]
**Claim:** Tests that use a guest route (`/login`) just to see the app header break when that route moves shells; use an unknown path for "guest sees the header".
**Saw it in:** `packages/frontend/src/app/AppShell/AppShell.test.tsx:135`
**Context:** Four header tests rendered `/login`; moving auth pages to AuthShell removed their banner.

## CAND-010 [implement-task]
**Claim:** To put a Base UI Tooltip on a Base UI Radio, render the radio through the trigger: `<Tooltip.Trigger render={<Radio.Root aria-label=… />}>`; arrow-key focus moves then open each tooltip.
**Saw it in:** `packages/frontend/src/components/ui/SegmentedControl/SegmentedControl.tsx:69`
**Context:** Base UI 1.8; the radio keeps role, name and keyboard model, and the tooltip opens on focus in jsdom too.

## CAND-A01 [review-arch]
**Claim:** When a component moves between layout layers, grep ADRs and context/architecture.md for its old location in the same change.
**Saw it in:** `.adlc/architecture/adr-03-frontend-session-and-401-handling.md:59`
**Context:** SessionBridge moved from AppShell to RootLayout; the ADR constraint still names AppShell.

## CAND-A02 [review-arch]
**Claim:** A new src layer needs its lint block, a README, a ban fixture, an allow fixture and a package sub-path fixture before it counts as done.
**Saw it in:** `packages/frontend/scripts/enforcement.test.ts:159`
**Context:** config/ followed all of these, which is why docs and lint agree.

## CAND-A03 [review-arch]
**Claim:** Keep a single-source constant that must also appear in static HTML under a test, as with the theme storage key.
**Saw it in:** `packages/frontend/index.html:7`
**Context:** The `<title>` duplicates `BRAND_NAME` with no drift test.

## CAND-011 [review-qual]
**Claim:** Test a primitive's new prop branch in the primitive's own test file, not only through a wrapper that uses it.
**Saw it in:** `packages/frontend/src/components/ui/SegmentedControl/SegmentedControl.tsx:62`
**Context:** Icon-only option is covered only by ThemeToggle.test.tsx.

## CAND-012 [review-qual]
**Claim:** Decide on one icon pattern (shared Icon primitive or one CSS convention) before the third inline SVG lands.
**Saw it in:** `packages/frontend/src/components/ui/ThemeToggle/ThemeToggle.tsx:56`, `PasswordInput.tsx:35`, `features/auth/AuthLayout.tsx:78`
**Context:** Three icons, two styling approaches, stroke CSS duplicated.

## CAND-013 [review-qual]
**Claim:** Content literals that go stale (copyright year) belong in config or computed, not inline in a component.
**Saw it in:** `packages/frontend/src/features/auth/AuthLayout.tsx:27`
**Context:** `© 2026` hard-coded next to a config-sourced brand name.

## CAND-C01 [review-corr]
**Claim:** Mount app-wide session/401 handlers in a path-less root layout route above every shell, not in one shell.
**Saw it in:** `packages/frontend/src/app/RootLayout.tsx:1`
**Context:** A second shell (AuthShell, no header) would otherwise lose SessionBridge on /login.

## CAND-C02 [review-corr]
**Claim:** When wrapping a Base UI primitive in Tooltip.Trigger via `render`, cover keyboard-focus and hover tooltip opening with tests.
**Saw it in:** `packages/frontend/src/components/ui/ThemeToggle/ThemeToggle.test.tsx:130`
**Context:** Radio.Root merged into Tooltip.Trigger; the behavior is only proven by those tests.

## CAND-007 [review-reflect]
**Claim:** Mount app-wide session and theme effects in a path-less root layout above every shell, not inside one shell.
**Saw it in:** `packages/frontend/src/app/RootLayout.tsx:11`
**Context:** AuthShell has no header, so SessionBridge in AppShell would have left auth pages without 401 handling; ADR-03 still says "in AppShell".

## CAND-008 [review-reflect]
**Claim:** Check any new icon or control colour on the Input fill against the contrast test before using `ink-muted`; it is under 3:1 on `surface-sunken` in light mode.
**Saw it in:** `packages/frontend/src/components/ui/PasswordInput/PasswordInput.module.css:15`
**Context:** AuthLayout already documents the failure; PasswordInput repeated it (2.79:1) and nothing pinned it.

## CAND-009 [review-reflect]
**Claim:** A Base UI Radio can be a Tooltip trigger through the `render` prop; the radio keeps its role and the name must come from `aria-label` when the child is an icon.
**Saw it in:** `packages/frontend/src/components/ui/SegmentedControl/SegmentedControl.tsx:68`
**Context:** Extends G05 (name from text content); icon-only options break that, so a gotcha note is needed.

## Candidate verdicts

Dedup basis: `origin/redesign` lessons as of 11 hours ago (21 lessons, none from REQ-004).

| Candidate | Verdict | Target / Reason |
|---|---|---|
| CAND-001 | demote-to-gotcha | ^g19 (queryByText ignores aria-hidden) |
| CAND-002 | discard | covered by L-REQ-001-4 (boundary fixtures) |
| CAND-003 | discard | already in conventions.md (non-scoped class names) |
| CAND-004 | discard | local to PasswordInput, commented there |
| CAND-005 | demote-to-gotcha | ^g19 (guest Account nav) |
| CAND-006 | demote-to-gotcha | ^g18 (`hidden` vs `display`) |
| CAND-007 | demote-to-gotcha | ^g19 (count submit buttons) |
| CAND-008 | promote | LESSON-REQ-004-2 |
| CAND-009 | demote-to-gotcha | ^g19 (header tests off /login) |
| CAND-010 | demote-to-gotcha | ^g17 (Tooltip on Radio) |
| CAND-A01 | promote | LESSON-REQ-004-3 |
| CAND-A02 | discard | duplicate of L-REQ-001-4 |
| CAND-A03 | demote-to-gotcha | ^g20 (index.html copies under test) |
| CAND-011 | discard | general testing habit, not project-specific |
| CAND-012 | discard | open decision (review m6), tracked as a follow-up |
| CAND-013 | discard | trivial; fixed in code |
| CAND-C01 | promote | LESSON-REQ-004-1 |
| CAND-C02 | demote-to-gotcha | merged into ^g17 |
| CAND-007 [reflect] | promote | merged into LESSON-REQ-004-1 |
| CAND-008 [reflect] | promote | merged into LESSON-REQ-004-2 |
| CAND-009 [reflect] | demote-to-gotcha | merged into ^g17 |
