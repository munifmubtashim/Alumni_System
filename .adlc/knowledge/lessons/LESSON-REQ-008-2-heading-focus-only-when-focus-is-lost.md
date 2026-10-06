# Move focus to a page heading only when focus is on the body or on a node that left the page ^L-REQ-008-2

| Field | Value |
|---|---|
| ID | LESSON-REQ-008-2 |
| Captured | 2026-10-07 |
| REQ | REQ-008 |
| Component | frontend |
| Tags | frontend, accessibility, focus, routing |
| Severity | trap |

## The lesson

A page whose states each own an `h1` should focus the current `h1` from one effect keyed on `[routeParam, viewState]` with a shared ref, not from per-state effects. Guard it: move focus only when `document.activeElement` is the body or a node that is no longer in the DOM (a clicked card, a skeleton heading, a Retry button that unmounted). An unconditional focus steals it from a user who already tabbed to a control (the Back link while the profile was loading). A repeat error keeps focus on Retry. This refines [[knowledge/lessons/LESSON-REQ-006-2-list-skeletons-strand-focus|L-REQ-006-2]], which is about not stranding focus; this one is about not stealing it.

## Saw it in

- `features/profile/ProfilePage.tsx` (the focus effect), test "leaves focus on the Back link" — [[REQ-008]] (CAND-010, CAND-019, CAND-028; review finding CORR-002)

- Related: [[knowledge/concepts/detail-page-pattern]]
