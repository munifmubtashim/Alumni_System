
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
