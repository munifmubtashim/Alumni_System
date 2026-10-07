
## CAND-001 [review-corr]
**Claim:** When a test comment says "no API calls are made", assert it with a request spy; a missing mock does not fail the test.
**Saw it in:** `packages/frontend/src/app/aboutRoute.test.tsx:15`
**Context:** Guest-page route test relies on an unmocked adapter that fails silently.

## CAND-002 [review-corr]
**Claim:** Public-route tests need a signed-in case too; guard-placement bugs usually show on the other side.
**Saw it in:** `packages/frontend/src/app/aboutRoute.test.tsx:29`
**Context:** All /about tests clear the token.

## CAND-003 [review-corr]
**Claim:** Honest-copy checks by banned-word regex miss overstated claims; review copy against the data model by hand.
**Saw it in:** `packages/frontend/src/features/about/AboutPage.tsx:21`
**Context:** "career history" vs a single current-role profile.

## CAND-001 [review-reflect]
**Claim:** Make the lazy-feature checklist machine-checked: derive the doc lists and `enforcement.test.ts` fixtures from `LAZY_FEATURES` or add a test that fails when a lazy folder is missing from them.
**Saw it in:** `packages/frontend/scripts/enforcement.test.ts:253`
**Context:** REQ-014 is the third REQ in a row where the "six lists" were only partly updated (LESSON-REQ-009-4 is advice, not a check).

## CAND-002 [review-reflect]
**Claim:** A public page inside `AppShell` must live outside `RequireAuth` and make no API call; test it signed out with `routes` and a cleared token.
**Saw it in:** `packages/frontend/src/app/router.tsx:82-114`, `packages/frontend/src/app/aboutRoute.test.tsx:28`
**Context:** First public lazy page; the pattern (sibling of the guarded group, not child) will recur for Privacy/Terms.

## CAND-003 [review-reflect]
**Claim:** Shell-wide additions (footer) change every page's layout; check sticky and fixed bars (`--tab-bar-height`, `/me` save bar) against the new element.
**Saw it in:** `packages/frontend/src/app/AppShell/AppShell.tsx:43`
**Context:** Footer sits between `main` and `BottomTabs`; no test covers the footer with the phone tab bar or save bar.

## CAND-004 [review-reflect]
**Claim:** Copy-honesty tests (no digits, no "hires/direct message") are a reusable guard for marketing pages; keep the banned-promise list tied to features that do not exist.
**Saw it in:** `packages/frontend/src/features/about/AboutPage.test.tsx:55`
**Context:** Enforces REQ-014 AC2; the banned words go stale when messaging or jobs are built.

## Candidate verdicts

| Candidate | Verdict | Why |
|---|---|---|
| corr CAND-001, CAND-002, CAND-003 | discard | One-off test and copy fixes; fixed in this REQ |
| reflect CAND-001 | promote (at wrapup, if you approve) | Third REQ in a row where the lazy-feature lists were only partly updated |
| reflect CAND-002 | demote-to-gotcha | Public page = sibling of RequireAuth group, no API call |
| reflect CAND-003 | discard | Footer checked visually; no fixed bar clashes seen |
| reflect CAND-004 | discard | Covered by README note and the test itself |
