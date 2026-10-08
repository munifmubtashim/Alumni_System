# REQ-004-alma-rebrand-auth-shell — Verification

| Field | Value |
|---|---|
| Generated | 2026-10-06 |
| Work path | /Users/munifmubtashim/Alumni_System |
| Isolation | branch |
| Branch | feat/REQ-004-alma-rebrand-auth-shell |
| Files changed | 63 |
| Commits | 1 (c0318e3f) |
| Base | redesign |

Full reviewer narratives: `review-log.md` — not loaded by later phases; open on demand.

## Summary

- **Round 2:** 7 fixes confirmed; one regression found in the browser (fixed toggle over the form at 60–83rem) and fixed; new t3 trivial. Open: M2, m6–m9, t2, t3 (all your call / wrap-up). Frontend 473 tests, build clean.
- **Counts (round 1):** 0 critical · 2 major · 9 minor · 2 trivial groups (after merging 22 reviewer findings). Correctness found nothing (258 tests re-run). No ADR conflict; one ADR is now out of date (M2).
- **Pattern:** the code is sound. What's left is polish (contrast on one icon, touch target size, a sticky toggle) and **vault pages that still describe the old single-shell layout** (ADR-03, session-and-401, frontend component page, context/architecture). Those are wrap-up decisions.
- **UI:** the ui-reviewer ran **static-only**: no browser tools were available to it, so it read the source and left a 10-step manual checklist (in review-log.md). The orchestrator's own Chrome comparisons during implement covered light/dark desktop and light 390px, but not error/loading states, keyboard tooltips or 200% zoom, and they aren't an independent review.
- **Packet:** 186KB (first build 280KB; docs and tests rebuilt with 8 lines of context, favicon listed by name).

## Findings at a glance

| ID | Severity | Finding (one line) | Where | Effort | Fix |
|----|----------|--------------------|-------|--------|-----|
| M1 | major | Show/hide icon `--ink-muted` on the input fill is 2.79:1 in light (controls need 3:1); not in contrast.test | PasswordInput.module.css:15 | trivial | resolved, round 2 |
| M2 | major | ADR-03 (line 59) and concept session-and-401 (line 11) still say SessionBridge mounts in AppShell; it's RootLayout now | .adlc vault | small | your call (vault) |
| m1 | minor | SegmentedControl's new icon + Tooltip branch is tested only through ThemeToggle | SegmentedControl.test.tsx | small | resolved, round 2 |
| m2 | minor | "© 2026" is hard-coded next to a config-driven brand name; it will go stale | AuthLayout.tsx:27 | trivial | resolved, round 2 |
| m3 | minor | Compact toggle segments ~30px; under the 44px touch guideline, 2px apart at the phone's corner | SegmentedControl.module.css (.iconOption) | trivial | resolved, round 2 |
| m4 | minor | Theme toggle scrolls away on the long /register form while the panel stays pinned | AuthShell.module.css (.toggle) | trivial | resolved, round 2 |
| m5 | minor | Redundant `color: inherit` (×2) | Logo.module.css:8,32 | trivial | resolved, round 2 |
| m6 | minor | Icons drawn two ways; stroke CSS copied in PasswordInput and AuthLayout; no convention | ui primitives | small | your call (convention) |
| m7 | minor | frontend component page and context/architecture.md lack RootLayout, AuthShell, config/, Logo, PasswordInput, compact toggle | .adlc vault | small | your call (wrap-up) |
| m8 | minor | config/ leaf and header-less auth pages are decisions recorded only in READMEs + this REQ; maybe ADRs | .adlc/architecture | small | decided: draft ADR-06 + ADR-07 at wrap-up |
| m9 | minor | No concept page for the two-shell route layout (L-REQ-001-7 covers one shell) | .adlc vault | small | your call (wrap-up) |
| t1 | trivial | Tooltip `delay={300}` unexplained; broken doc comment AuthShell.tsx:7-9; duplicate toggle wiring in both shells; AuthLayout reserves top padding only AuthShell needs; index.html title has no drift test (cf. G01) | various | trivial | resolved, round 2 |
| t3 | trivial | AuthLayout's phone padding hard-codes the toggle's 3rem height (coupled to SegmentedControl/AuthShell); config/README says "imports nothing internal" while its test reads ../../index.html; redundant 3:1 contrast row (pair already pinned at 4.5:1); first `:has()` in the app (Vite target covers it) | AuthLayout.module.css, config/, contrast.test.ts | trivial | your call (accept or a `--auth-toggle-clearance` custom property) |
| t2 | trivial | design-tokens concept doesn't note SVG fills via token classes / literal icon sizes | .adlc vault | trivial | your call (wrap-up) |

Round 2 (2026-10-06): M1, m1–m5 and t1 confirmed resolved by quality, reflector, architecture and ui (ui static-only again). New: t3 (trivial). **Orchestrator browser check** (Chrome, light): phone 390/360px, toggle segments 40×40, 12px gap to the logo, no sideways scroll. At 1100px wide the round-2 fixed toggle **covered the password field** when sign-up scrolled; fixed by pinning it only from 84rem (it scrolls away below that), then re-checked at 1100 and 1400px with no overlap at any scroll position.

Reviewed by: correctness (balanced) · quality (balanced) · architecture (balanced) · reflector (balanced) · ui (balanced, static-only). All five reports carry a `Written by` line.

## Consolidated by severity

### Major (2)

#### PasswordInput.module.css:15 — M1 toggle icon contrast
- **Source:** reflector (REFL-001, repeats L-REQ-001-6); checked by orchestrator: #948c84 on #f0ebe3 = 2.79:1 (light), 4.40:1 (dark); `--ink-secondary` gives 4.84 / 8.46.
- **Recommendation:** icon `--ink-secondary` (hover `--ink-primary`), and add the pair to `contrast.test.ts` at NON_TEXT.

#### vault — M2 ADR-03 and session-and-401 out of date · needs decision
- **Source:** reflector (REFL-002), architecture (ARCH-001). The code is right; the vault must change at /wrapup: edit the accepted ADR in place with a dated note, or add a superseding ADR.

### Minor (9)

- **m1** (quality QUAL-001): 2–3 SegmentedControl tests (icon option, mixed icon/text options, tooltip on focus).
- **m2** (quality QUAL-002): `© {new Date().getFullYear()} {BRAND_NAME}`, or a `COPYRIGHT_YEAR` in config/brand.ts.
- **m3** (ui UI-001): `.iconOption` padding `--space-2` (≥ 2.5rem target) and a `--space-1` gap between segments.
- **m4** (ui UI-002): `.toggle` `position: fixed` from 60rem (desktop), so it stays with the pinned panel; phones keep it absolute.
- **m5** (quality QUAL-004): delete the two `color: inherit` lines.
- **m6** (quality QUAL-003), **needs decision**: pick one icon pattern (inline SVG component with a shared `icon` class) and write it into conventions.md, or accept as is.
- **m7, m9** (reflector REFL-003/004, architecture ARCH-001), **wrap-up**: update the frontend component page and context/architecture.md; write a concept page for the root layout → two shells.
- **m8** (architecture ARCH-002), **needs decision**: draft ADR-06 (config/ leaf layer, ui banned) and/or ADR-07 (auth pages without the app header, RootLayout owns app-wide effects), or leave them in READMEs.

### Trivial
- **t1** (quality QUAL-005/006, architecture ARCH-003/004): comment the 300ms delay; fix the AuthShell doc comment; a tiny `useThemeToggleProps` hook or keep the duplication; drop AuthLayout's toggle padding (AuthShell owns it); a test that `index.html`'s `<title>` equals `BRAND_NAME`.
- **t2** (reflector REFL-005), **wrap-up**: one line in the design-tokens concept.

## Acceptance criteria check

- [✓] AC1 — "Alma" in title, favicon, header and panel; BRAND_NAME from config/brand.ts (t1: title drift test suggested)
- [✓] AC2 — layouts follow the designs with tokens only (lint + Stylelint green); intentional deviations documented; M1 contrast miss on one icon
- [✓] AC3 — neutral copy, no counts, no "Remember me"
- [✓] AC4 — no logic diff; only the user-approved test edits
- [✓] AC5 — Forgot password message + mailto (encoded subject), constant in config
- [✓] AC6 — show/hide with flipping name, keyboard, focus kept
- [✓] AC7 — header without nav links (guest keeps the "Account" nav)
- [✓] AC8 — full-page auth layout, compact toggle top-right, panel space-between, 380px form, heading + prompt
- [⚠] UI not independently verified in a browser (ui-reviewer static-only): manual checklist in review-log.md
