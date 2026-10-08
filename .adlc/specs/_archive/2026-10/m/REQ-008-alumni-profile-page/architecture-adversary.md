# Architecture adversary — REQ-008-alumni-profile-page

Written by: architecture-adversary (tier: balanced), dispatched sub-agent.

| Field | Value |
|---|---|
| Generated | 2026-10-07 |
| Trigger | ui-surface |
| Verdict | found problems |

## Summary

Checked 15 ACs, 8 tasks, the handover, lazy guard, posts endpoint, S3 desktop and phone files (light; dark differs only in colours), tokens and stylelint. 6 findings: 0 critical, 2 major, 3 minor, 1 trivial. Biggest: on phone the shell's own top bar stays, so the S3 "Profile" bar would stack under it, and nothing in the plan says what happens. Dispatch hints: handover (exploration was wrong, the card passes no state today; the plan's config helper fixes that, checked, nothing more); posts endpoint (takes `users.id`, which is `Alumni.user_id`; behind `authMiddleware`; ordered newest first, so `slice(0,5)` is safe, checked, nothing); S3 elements (mentorship badge, location, "Profile" tab, post-card-as-link are all accounted for; the phone bar is not, see ADV-001); token coverage (ADV-003, ADV-004).

## Findings

### ADV-001: Phone shows two top bars; plan only mentions the S3 one

| Field | Value |
|---|---|
| Severity | major |
| Confidence | high |
| Lens | ux-consistency |
| Where | `architecture.md` §Back link layout; TASK-006 BackLink; `AppShell.module.css:1-4` |

**What:** `AppShell` already renders a phone top bar (logo, theme toggle, avatar) above `<main>`. S3 Phone has only the "arrow + Profile" bar and no logo bar. The plan puts the arrow bar inside the page, so phone gets logo bar then Profile bar, and no S3 side-by-side can match.
**Why it matters:** TASK-008 will find a large, unfixable difference late. The design's phone frame and the shell contradict each other, and the plan never says which wins. S1 phone has the logo bar, so S3 is likely a design shortcut.
**Refutation tried:** maybe the Profile bar replaces the shell bar. No task touches AppShell and the blast radius lists no shell file, so it does not.
**Recommendation:** decide at the gate. Option A (cheap): keep the shell bar, make the Profile row a slim in-page row, list it as a deliberate difference. Option B: add an AppShell change (route-aware phone bar), add the file to the blast radius, and a task.

### ADV-002: AC12 cannot be met as written; deliberate-difference classes disagree

| Field | Value |
|---|---|
| Severity | major |
| Confidence | high |
| Lens | contradiction |
| Where | spec AC12 vs `architecture.md` §Known gaps vs TASK-008 acceptance |

**What:** AC12 says every difference is fixed or is an AC5 omission. The architecture and TASK-008 add more deliberate classes: accent colour, 14px vs 12px radius, type sizes, missing Profile tab.
**Why it matters:** `/review` and the human read AC12 literally and mark it failed, or the implementer hard-codes values to satisfy it (which AC13 forbids).
**Refutation tried:** TASK-008 lists "deliberate" classes. But it is a task, and the spec AC is the gate. They disagree.
**Recommendation:** amend AC12 to name the allowed deliberate classes (AC5 omissions, token-versus-design colour and radius, nearest type token, shell tab bar). Resolve the open 24/19px token question before implement, or the difference list will be long.

### ADV-003: Spacing and size gaps are missing from the "known gaps" list

| Field | Value |
|---|---|
| Severity | minor |
| Confidence | high |
| Lens | omission |
| Where | `architecture.md` §Layout and tokens; stylelint config (strict-value on padding, margin, gap, font-size) |

**What:** S3 uses 28px section gaps, 10px, 14px, 18px/20px paddings, 9/10px dots, 860px max width, 72/84px avatar, 24px phone initials. Stylelint rejects raw values in padding, margin, gap and font-size, and no token fits. Only type and colour gaps are listed. AppShell's own CSS solves this with `calc()` of tokens (header comment), but the plan does not mention it.
**Why it matters:** the implementer hits lint failures in TASK-005/006 and may guess. 24px phone initials has no token or calc (20 or 28 only).
**Refutation tried:** "nearest token" covers type. It does not cover spacing; the plan says tokens for gaps but names no 28px answer.
**Recommendation:** add a line: off-scale spacing uses `calc()` of `--space-*` (as AppShell does); sizes (860px, dot, avatar) use rem literals in `inline-size`/`block-size` (not linted, as Avatar does); phone initials use the nearest type token and are listed.

### ADV-004: Avatar phone override will lose on specificity

| Field | Value |
|---|---|
| Severity | minor |
| Confidence | medium |
| Lens | hidden-coupling |
| Where | TASK-003 notes; TASK-006 header CSS; `Avatar.module.css` |

**What:** Avatar sizes are `.avatar[data-size='lg']` (specificity 0,2,0). TASK-006 shrinks it to 72px with a profile "scoped rule" passed through `className`, which is 0,1,0 and loses, even in a media query.
**Why it matters:** the avatar stays 84px on phone and the failure is only a visual difference at TASK-008.
**Refutation tried:** `Avatar` accepts `className`, so it can be overridden. True, but only with a selector at least as specific, for example `.header .avatar[data-size='lg']`. The plan does not say so.
**Recommendation:** in TASK-006 say the override must use `[data-size='lg']` too, or make TASK-003 add the phone size inside Avatar's own CSS.

### ADV-005: Not-found and error states have no h1, no focus target, no title

| Field | Value |
|---|---|
| Severity | minor |
| Confidence | high |
| Lens | omission |
| Where | `architecture.md` §Page states; TASK-006; AC14 |

**What:** focus and `<title>` are planned for the success state only. A card click unmounts the focused link; on skeleton, not-found and error states focus falls to `body`. AC14 "one h1" and "title names the person" have nothing for these states (a not-found page has no person and no h1; the tab title stays "Alma" from `index.html`).
**Why it matters:** a keyboard or screen-reader user lands on a blank-focus page and hears nothing for the failure states, the exact bug L-REQ-006-2 describes.
**Refutation tried:** `role="status"` announces loading. It does not cover not-found or error, and the Alert is `aria-live` only when it appears after mount, which is true here (so partly covered). Focus and h1 stay unplanned.
**Recommendation:** give NotFound and LoadError an `h1` (for example "Profile not found") that takes focus on show, and set `<title>` for them too. Add the assertion to TASK-006 tests.

### ADV-006: Lazy guard generalisation can hide profile-to-directory imports

| Field | Value |
|---|---|
| Severity | minor |
| Confidence | medium |
| Lens | testability |
| Where | TASK-007; `lazyRoutes.test.ts:11-14`; `eslint.config.js:196-201` |

**What:** `lazyRoutes.test.ts` leaves out the lazy feature's own folder from the scanned sources. With a list `['directory','profile']`, if both folders are left out of one scan, a static import from `features/profile` into `features/directory` is never checked. The same goes for one shared ESLint block with `ignores` for both folders. The architecture states neither feature imports the other, but nothing enforces it.
**Why it matters:** low blast (both are lazy, so no entry-chunk leak), but it breaks the stated rule and ADR-08.
**Refutation tried:** the entry chunk is safe either way (both features are lazy). Only the stated cross-feature rule is unenforced.
**Recommendation:** in TASK-007 keep one ESLint block and one scan per feature, each leaving out only its own folder, so each feature is checked against the other. Add a test case for it.

## Coverage

- **Lenses run:** omissions, failure modes, hidden coupling, rollback (trivially none: frontend-only, no schema; the route can be removed), contradiction and testability, UX and design consistency.
- **Lenses skipped:** cross-repo (single repo).
- **Acceptance-criteria coverage:** AC1 to AC15 all checked. AC10 and AC12 produced findings (ADV-001, ADV-002); AC14 produced ADV-005; AC13 produced ADV-003. AC2 mapped to TASK-007 and AC3 to TASK-001/005/006 with no gap.
