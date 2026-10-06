# A list that swaps to skeletons on every query change strands keyboard focus ^L-REQ-006-2

| Field | Value |
|---|---|
| ID | LESSON-REQ-006-2 |
| Captured | 2026-10-06 |
| REQ | REQ-006 |
| Component | frontend |
| Tags | frontend, accessibility, focus, pagination |
| Severity | trap |

## The lesson

If a page shows skeletons whenever its query key changes (no `placeholderData`), every control rendered inside the results branch, such as pagination, unmounts while the next page loads, and focus falls to `<body>`. Give a heading that stays mounted `tabIndex={-1}` and focus it in the handler, before the swap, or keep the control mounted. Unit-test it by holding the next request open and asserting where focus is during loading and after.

## Saw it in

- `features/directory/DirectoryPage.tsx` (`goToPage`, the `<h1>`), `DirectoryPage.test.tsx` — [[REQ-006]]
- Missed by the plan and by the implementers; found by the UI reviewer reading the code (UI-001, major).
