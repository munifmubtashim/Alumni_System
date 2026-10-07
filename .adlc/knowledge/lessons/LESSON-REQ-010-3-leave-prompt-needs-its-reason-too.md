# Gate a leave prompt on the blocker state and on the current reason to block, because `blocker.reset()` lands a render later ^L-REQ-010-3

| Field | Value |
|---|---|
| ID | LESSON-REQ-010-3 |
| Captured | 2026-10-07 |
| REQ | REQ-010 |
| Component | frontend, react-router |
| Tags | frontend, react-router, forms, tests |
| Severity | trap |

## The lesson

`useBlocker` stays `blocked` for one more render after the reason goes away (a save settling clean): show the prompt only while `blocker.state === 'blocked' && guarding`, call `blocker.reset()` in an effect, and pin "never on screen together" rules with a MutationObserver test, not an assertion after `findBy` (flaky 1 in 5, observer failed 3 of 3 on the old code).

## Saw it in

- `features/me/ProfileForm.tsx` (leave prompt) and `ProfileForm.test.tsx` (observer test); found as a flaky test in TASK-005, fixed in TASK-006 (CAND-010/013/015/016)
