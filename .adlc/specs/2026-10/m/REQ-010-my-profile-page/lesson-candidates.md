
## CAND-001 [implement-task]
**Claim:** When adding an item above Log out in the avatar menu, update the keyboard test: Base UI focuses the first item, not Log out.
**Saw it in:** `packages/frontend/src/app/AppShell/AppShell.test.tsx` ("opens the user menu from the keyboard")
**Context:** The test looked up "Log out" and expected focus there only because it was the sole item.

## CAND-002 [implement-task]
**Claim:** config/README.md lists each path constant (feedPath.ts); a new one (mePath.ts) needs a line there too.
**Saw it in:** `packages/frontend/src/config/README.md:7`
**Context:** TASK-003 did not name the README, so the line was left for a task that owns docs.

## CAND-003 [implement-task]
**Claim:** On an ink-primary (inverse) surface, set the focus outline to currentcolor; the global accent ring is too faint there.
**Saw it in:** `packages/frontend/src/components/ui/Toast/Toast.module.css` (.dismiss:focus-visible)
**Context:** global.css draws every focus ring in --accent, which is tuned for light surfaces, not for a dark inverse pill.

## CAND-004 [implement-task]
**Claim:** Keep a toast's dismiss button outside its role="status" element, or the button name is read out with the message.
**Saw it in:** `packages/frontend/src/components/ui/Toast/Toast.tsx`
**Context:** Alert puts role on the whole box, which is fine there because Alert has no buttons.

## CAND-005 [implement-task]
**Claim:** A role="status" region that mounts together with its text may not be announced by every screen reader; check the toast with VoiceOver in TASK-007.
**Saw it in:** `packages/frontend/src/components/ui/Toast/Toast.tsx`
**Context:** The caller renders the Toast conditionally (architecture), so the live region and its text appear in the same commit.

## CAND-006 [implement-task]
**Claim:** Feature validators that share limits with auth copy them, because features/auth exports none of its constants or rules through its index.ts.
**Saw it in:** `packages/frontend/src/features/me/validation.ts:11`
**Context:** No file deep-imports another feature's module; reusing auth's rule would mean widening auth/index.ts. Two client copies of NAME_MAX etc. now exist; a third should move them to config/.

## CAND-007 [implement-task]
**Claim:** Map backend error text to fields with "prefix + space" and longest prefix first; "Expected graduation year" and "Graduation year" overlap otherwise.
**Saw it in:** `packages/frontend/src/features/me/profileErrors.ts:22`
**Context:** Backend messages are "${field} ..." from validation.ts; the UI labels (About, Current role) differ, so a label-based match misses them.

## CAND-008 [implement-task]
**Claim:** The backend's optionalYear runs a 10-character text check before the year check, so a long year gets "must be at most 10 characters", not "is not valid"; mirror the order.
**Saw it in:** `packages/backend/src/businessLogic/src/validation.ts:31`
**Context:** Easy to copy only the regex and range and miss the first message.

## CAND-009 [implement-task]
**Claim:** Don't plan a test that reads a `.css` file with `import.meta.glob(..., { query: '?raw' })`: under Vitest it returns an empty module, not the text.
**Saw it in:** `packages/frontend/vite.config.ts:40`
**Context:** The trick works for `.ts` sources (`app/lazyRoutes.test.ts`); CSS goes through Vitest's css pipeline instead. `src/` tests have no `fs`, so CSS contracts need screenshots.

## CAND-010 [implement-task]
**Claim:** When a blocked navigation's reason goes away (the save settled clean), call `blocker.reset()` in an effect, or the leave prompt stays up with nothing to protect.
**Saw it in:** `packages/frontend/src/features/me/ProfileForm.tsx:95`
**Context:** The guard blocks while a save is in flight (ADV-008); a successful save leaves the form clean but the blocker still 'blocked'.

## CAND-011 [implement-task]
**Claim:** A page's fixed bottom bar and the shell's sticky tab bar must share one height variable, used as the tab bar's `min-block-size`, so they cannot drift apart.
**Saw it in:** `packages/frontend/src/app/AppShell/AppShell.module.css:16`
**Context:** jsdom cannot check the overlap; a tab label that wraps to two lines still makes the tab bar taller than the variable.

## CAND-012 [implement-task]
**Claim:** A `role="status"` region that mounts already holding its text may not be read out by some screen readers; keep the live region mounted and change its text.
**Saw it in:** `packages/frontend/src/components/ui/Toast/Toast.tsx:28`
**Context:** ProfileForm mounts a new Toast (keyed) per save. Tests pass with getByRole('status'); a real screen reader may stay silent. Worth a check in TASK-007.

## CAND-013 [implement-task]
**Claim:** After `findByText` for a post-save toast, wait (`waitFor`) for state that an effect resets, such as a blocker's `reset()`; it can land a tick later.
**Saw it in:** `packages/frontend/src/features/me/ProfileForm.test.tsx:402`
**Context:** The in-flight leave-guard test failed 1 run in 5 under the full suite; the prompt was still there right after the toast appeared.

## CAND-014 [implement-task]
**Claim:** A short lazy feature name like `me` needs "near-miss" allow fixtures (`@/features/media`, `../meHelpers`) to prove the ban matches whole path segments only.
**Saw it in:** `packages/frontend/scripts/enforcement.test.ts`, `packages/frontend/src/app/lazyRoutes.test.ts`
**Context:** The ESLint group `../me` and the test's `isInside` both had to be checked against prefixes of other names.

## CAND-015 [implement-task]
**Claim:** Gate UI that depends on `blocker.state === 'blocked'` on the current reason to block too; `blocker.reset()` lands a render later.
**Saw it in:** `packages/frontend/src/features/me/ProfileForm.tsx:253`
**Context:** RouterProvider applies router state in `startTransition`, so a reset from an effect left the leave prompt on screen beside the save toast.

## CAND-016 [implement-task]
**Claim:** Pin a "never on screen together" rule with a MutationObserver, not a check after `findBy`; a one-commit glitch only fails that way every run.
**Saw it in:** `packages/frontend/src/features/me/ProfileForm.test.tsx:400`
**Context:** The after-the-fact assertion failed about 1 in 5 under suite load; the observer version failed 3 of 3 on the old code.

## CAND-017 [implement-task]
**Claim:** A page under RequireAuth that reads ['me'] never shows its own loading or error view on first load; the guard shows its own first.
**Saw it in:** `packages/frontend/src/features/auth/guards.tsx:38`, `packages/frontend/src/features/me/MePage.tsx:35`
**Context:** MePage's skeleton and error-with-Retry were only reachable when mounted without the guard; check what the real route shows before speccing page states.

## CAND-018 [implement-task]
**Claim:** When adding a lazy feature, also update the "Not another lazy feature" line in every other lazy feature's README.
**Saw it in:** `packages/frontend/src/features/feed/README.md:17`
**Context:** feed and profile READMEs still name only the older lazy features after `me` joined `LAZY_FEATURES`; LESSON-REQ-009-4's six lists do not include them.
