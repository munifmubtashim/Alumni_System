## CAND-001 [implement-task]
**Claim:** Before planning a label change, grep the work branch for every constant the spec names; specs can cite code that lives only on an unmerged sibling branch.
**Saw it in:** `.adlc/specs/2026-10/m/REQ-012-account-settings-nav-labels/requirement.md:33` (`HIDDEN_FIELD_HINT` exists only on feat/REQ-011)
**Context:** REQ-012 was cut from main without REQ-011, so the hint text must be renamed when REQ-011 merges.

## CAND-002 [implement-task]
**Claim:** When the header nav and tab bar must list different pages, give each its own list rather than filtering one shared list; tests that asserted "tabs equal header nav" must change to "tabs = header + extras".
**Saw it in:** `packages/frontend/src/app/AppShell/navItems.tsx:19`
**Context:** One shared NAV_ITEMS made "same pages in both navs" an implicit rule that a test pinned.

## CAND-003 [implement-task]
**Claim:** A tab named "Account" shares its accessible name with the guest's `<nav aria-label="Account">`; scope link queries with `within(tabs())` so they never collide.
**Saw it in:** `packages/frontend/src/app/AppShell/HeaderAuth.tsx:22`
**Context:** Guests never see the tab bar today, so no clash yet, but a screen-wide query would be ambiguous if both render.

## CAND-004 [review-reflect]
**Claim:** When code deliberately departs from a design screen, record the deviation on one vault page (concept or component) at the same time, so later design-compare reviews cite it instead of re-flagging it.
**Saw it in:** `packages/frontend/src/app/README.md:12`
**Context:** REQ-012 deviates from S1/S2/S3/S5 (nav and tab labels); only READMEs and CLAUDE.md say so, while `docs/design/` still shows "My Profile".

## Candidate verdicts

Dedup basis: origin/redesign as of 5 hours ago (45 lessons) plus this branch; skip line: no overlap found with LESSON-REQ-010-5 (README list sweep) or LESSON-REQ-008-3.

| Candidate | Verdict | Where |
|---|---|---|
| CAND-001 | promote | LESSON-REQ-012-1 |
| CAND-002 | discard | one-off test detail, covered by the new tests |
| CAND-003 | discard | no clash today (guests never see the tab bar); a test already scopes with `within(tabs())` |
| CAND-004 | promote | LESSON-REQ-012-2 (also written to `concepts/route-layout.md`) |
