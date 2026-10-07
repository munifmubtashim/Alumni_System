# REQ-010-my-profile-page — Verification

| Field | Value |
|---|---|
| Generated | 2026-10-07 |
| Work path | /Users/munifmubtashim/Alumni_System |
| Isolation | branch |
| Branch | feat/REQ-010-my-profile-page |
| Files changed | 112 (55 code files under packages/) |
| Commits | 6 |
| Base | 7e88dcbf (merged REQ-009 tip; the branch was cut from it) |

Full reviewer narratives: `review-log.md` — not loaded by later phases; open on demand.

## Summary

Packet 165KB (target 120KB, ceiling 250KB; test files left out of the diff to stay under it). Round 2 (fixes re-reviewed by correctness and ui): 0 critical, 1 major open (M2, your call), 6 minor open (m1 your call; m6 accepted; m7 to m10 follow-ups), 5 findings resolved this round (M1, m2, m3, m4, m5) plus one new minor fixed on the spot (timer focus no longer scrolls the page). Round 1 was 0 critical, 2 major, 10 minor, 3 trivial. Reviewed by: correctness (balanced) · quality (balanced) · architecture (balanced) · reflector (balanced) · ui (balanced, static tier: no browser tool in the subagent, so a 15-step manual checklist is in the log).
- One real bug, found independently by three reviewers: saving a profile refreshes `['posts']` but the feed uses `['feed',...]` keys, so feed cards keep the old name or photo for up to 30 s (M1). The test only spies on the call, so it could not catch it.
- One decision: ADR-04 said to revisit the no-form-library rule when a form passes ~8 fields "likely My Profile"; /me has up to 12 and the plan recorded "no deviation" (M2, your call).
- The sign-in guard waits for the same `['me']` request, so MePage's own loading and error views never show on a first visit, and a failed background refetch would drop unsaved edits (m1, your call).
- The browser pass I ran earlier is still partial (desktop toast, 360 px, 200% zoom, system theme, S5 phone-light not shot).

## Findings at a glance

| ID | Severity | Finding (one line) | Where | Effort | Fix |
|----|----------|--------------------|-------|--------|-----|
| M1 | major | feed cache not refreshed after save (`['feed']` missing); test can't catch it | features/me/useUpdateProfile.ts:27 | small | resolved, round 2 (['feed'] invalidated; real-cache test fails without it) |
| M2 | major | ADR-04 "~8 fields" revisit point reached; decision made implicitly | ADR-04, README:151, CLAUDE.md | small | your call |
| m1 | minor | guard owns `['me']` loading/error: MePage's views are dead on first visit; failed refetch drops edits | features/auth/guards.tsx:37-58 | small | your call |
| m2 | minor | toast auto-closes in 4 s with no pause; focus drops if on Dismiss | ProfileForm.tsx | small | resolved, round 2 |
| m3 | minor | toast status region mounted with its text: some screen readers stay silent | components/ui/Toast | small | resolved, round 2 |
| m4 | minor | leave prompt ignores Escape | features/me/LeavePrompt.tsx | small | resolved, round 2 |
| m5 | minor | stale docs: frontend README (authApi list, header, ui map, no My Profile), app README, feed and profile READMEs, components/frontend.md intro | several | small | resolved, round 2 (docs updated) |
| m6 | minor | stale baseline: edits in another tab within 30 s get overwritten by an unrelated save | ProfileForm.tsx:73 | medium | accept |
| m7 | minor | validation helpers copied a third time (already drifted: NUL check only in me) | features/me/validation.ts | medium | follow-up |
| m8 | minor | "focus lost" check written four times; /login constant repeated | me/*, profile | small | follow-up |
| m9 | minor | ProfileForm is a 317-line orchestrator | ProfileForm.tsx | medium | follow-up |
| m10 | minor | no convention for where shared query-key prefixes and field rules live (cause of M1) | conventions | — | your call |

Trivial (3): `--tab-bar-height` is a hand-summed calc; Textarea near-copies Input; contrast pairs not named by use.

Round 2 new: CORR-R2-001 minor (auto-close focus scrolled the page: fixed with preventScroll); nits: a repeated identical toast isn't re-announced; a toast replaced under the pointer isn't paused (rare, accepted); UI-004/005 trivial.

## Consolidated by severity

### Major (2)

#### features/me/useUpdateProfile.ts:27 — feed cache keys not invalidated (M1) — RESOLVED, round 2
- **Source:** correctness (CORR-001), quality (QUAL-001), architecture (ARCH-001)
- **What:** onSuccess invalidates `['alumni']` and `['posts']`; the feed's keys are `['feed','posts']` and `['feed','comments',id]` (`features/feed/constants.ts`). After a rename or new photo, feed cards stay stale until the 30 s stale time ends. `useUpdateProfile.test.tsx:91` spies on the same wrong literal, so it passes with no effect.
- **Recommendation:** add `['feed']` (string literal with a comment, since features cannot import each other); test against a real cache holding a feed query.

#### ADR-04 / README:151 / CLAUDE.md — form-library revisit point (M2)
- **Source:** reflector (REFL-001, adr-conflict, needs-decision)
- **What:** ADR-04 says revisit the no-form-library decision when a form passes ~8 fields, "likely My Profile". /me has up to 12 fields; architecture said "Deviation: none".
- **Recommendation:** record the decision (stay with controlled state: the form is held together by pure `validation.ts` and `planSave`, and tests pass) as a Consequences row in ADR-04 or a short ADR-10, and update the "revisit" lines. Your call: keep no library, or plan a form library.

### Minor (10)
m1 to m10 as in the table; details in `review-log.md` (ARCH-002, UI-001..003, REFL-002, CORR-002, QUAL-002..003, ARCH-003, QUAL-005).

## Acceptance criteria check

- [✓] Lazy `/me` route in AppShell, guest sent to /login, own chunk (MePage-*.js 17 kB)
- [⚠] Loading skeleton / error with Retry: met through the guard's plainer views; MePage's own are unreachable on first visit (m1)
- [✓] Sections Personal, Education, Career, Password; Mentorship omitted by decision; role-dependent fields (alumni, student, none)
- [✓] Inline validation matches backend (checked by correctness reviewer)
- [✓] Sticky save bar only when dirty; Discard; padding keeps last field clear (seen in browser, desktop and phone)
- [✓] Leave warning: in-app (useBlocker) and reload/close (seen: browser blocked navigation)
- [✓] Save sends PUT /me then password PUT if needed; toast; partial failure handled; server errors mapped
- [✓] `/alumni/:id` shows new data after save, and feed cards refresh (M1 fixed)
- [✓] Avatar menu View profile / My Profile, header nav, tab bar, Home card
- [⚠] Layout follows S5, tokens only, 360 px / 200% zoom / light, dark, system: S5 differences listed (ui-evidence); 360 px, 200% zoom, system theme, desktop toast not yet checked in a browser
- [✓] Tests: 1217 pass; typecheck, lint, format, tokens:check, build pass
- [⚠] Screenshot comparison list: written, partial coverage (see Summary)
