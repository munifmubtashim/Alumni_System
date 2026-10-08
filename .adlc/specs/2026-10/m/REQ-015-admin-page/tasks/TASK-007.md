# TASK-007 — Frontend: delete alumni dialog

| Field | Value |
|---|---|
| REQ | REQ-015 |
| Tier | 4 |
| Status | done |
| Repo | alumni-system |
| Depends on | TASK-006 |
| Blocks | TASK-008 |

## Goal

Each Delete button opens the S6 confirm dialog; confirming deletes through the admin API with a loading state, shows a toast and refreshes, or keeps the dialog open with the error.

## Files to touch

| Path | Action |
|---|---|
| `packages/frontend/src/features/admin/DeleteAlumniDialog.tsx (+css, test)` | create |
| `packages/frontend/src/features/admin/mutations.ts` | edit (useDeleteAlumni) |
| `packages/frontend/src/features/admin/AdminPage.tsx` | edit (wire dialog) |
| `packages/frontend/src/features/admin/README.md` | edit |

## Approach

- ConfirmDialog with trash icon (danger tone), title "Delete <name>?", text "This permanently removes their profile, posts, and comments from {BRAND_NAME}. This action can't be undone.", Cancel + danger "Delete alumni".
- useDeleteAlumni: onSuccess invalidate ['admin'], ['alumni'], ['posts']; toast "<name> deleted"; if the current page is now past the end, step back a page. Error → Alert in dialog, stays open.
- Focus: Cancel first; on cancel return to that row's Delete button; after success move focus to the table heading (G35). Hide Delete on a row whose user_id equals the signed-in user's id.

## Acceptance

- [x] Tests: text includes brand name; loading disables confirm; error stays open with message; success toast + invalidations + focus to heading; cancel returns focus
- [x] Lint, typecheck, format, tests green

## Notes

Server refuses self-delete with 403 anyway; the UI hide is a convenience.

Implementation notes (2026-10-08):
- Scope: hiding Delete on the admin's own row needed a `canDelete` prop on `RowActions` and a `canDelete(row)` predicate on `AlumniTable` / `AlumniCardList` (files from TASK-005, not named here). Small pass-throughs; flagged to the orchestrator.
- No `DeleteAlumniDialog.module.css`: the Alert and the ConfirmDialog primitive need no extra styling.
- Errors: new pure `deleteErrors.ts` (`mapDeleteError`). 404 means already gone: close with "This alumni no longer exists" and refetch, like the drawer's edit 404 (a dialog asking to delete a missing row is pointless). 401 shows nothing (SessionBridge).
- Focus: `finalFocus` is a getter ref; it returns the list heading when this open's target was deleted (`goneRef.current === target`), else the trigger if still connected, else the heading. `onClose` also hands the opener to AdminPage's existing focus watch, so a later refetch that removes the row after a Cancel still lands on the heading.
- Step back after emptying the last page reuses AdminPage's `pastEnd` effect; tested.
- On a failed delete the Alert gets focus (the busy button was disabled, so focus may have dropped), the drawer's pattern.

## Related

- Architecture: [[specs/2026-10/m/REQ-015-admin-page/architecture]]
- Lessons checked: L-REQ-009-2, G35, G36
