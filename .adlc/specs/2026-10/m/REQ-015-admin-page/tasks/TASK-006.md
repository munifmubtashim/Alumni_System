# TASK-006 — Frontend: add/edit alumni drawer

| Field | Value |
|---|---|
| REQ | REQ-015 |
| Tier | 3 |
| Status | pending |
| Repo | alumni-system |
| Depends on | TASK-005 |
| Blocks | TASK-007 |

## Goal

The Add alumni button and each Edit button open the S6 drawer; the form validates per ADR-04, creates or partially updates through the admin API, shows toasts, refreshes stats/table/directory, and confirms before discarding typed input.

## Files to touch

| Path | Action |
|---|---|
| `packages/frontend/src/features/admin/AlumniDrawer.tsx (+css, test)` | create |
| `packages/frontend/src/features/admin/AlumniForm.tsx (+css)` | create |
| `packages/frontend/src/features/admin/validation.ts (+test)` | create |
| `packages/frontend/src/features/admin/adminErrors.ts (+test)` | create |
| `packages/frontend/src/features/admin/mutations.ts` | create (useCreateAlumni, useUpdateAlumni) |
| `packages/frontend/src/features/admin/AdminPage.tsx` | edit (wire drawer) |
| `packages/frontend/src/features/admin/README.md` | edit |

## Approach

- Fields (S6 order): Full name, Email, University + Graduation year (2 columns from 48rem), Department, Current role + Company (2 columns), Temporary password (PasswordInput). Edit mode hides Email and Temporary password, prefills from the row, footer button "Save changes"; add mode footer "Add alumni"; both have Cancel.
- validation.ts messages and limits mirror backend validation.ts (copy with comment, L-REQ-006-3); errors on blur and submit; focus first invalid. adminErrors maps 409 → email, field-named 400 messages → that field (G38), else a form-level Alert.
- Mutations: not optimistic; onSuccess invalidate ['admin'] and ['alumni']; close drawer; toast "<name> added" / "Changes saved". Edit 404 → toast "This alumni no longer exists", close, invalidate. Dirty close (×, Cancel, Escape, backdrop) shows an inline confirm in the footer ("Discard this new alumni?" / "Discard changes?": Keep editing / Discard). Focus returns to the opener.

## Acceptance

- [ ] Tests: required/format errors and focus; 409 shows on Email; success toast + both caches invalidated; edit prefill and request body contains only the editable fields; 404 path; dirty-close confirm both choices; clean close closes at once
- [ ] A double click on Add/Save sends one request (submit disabled while pending) — no false 409 (ADV-004)
- [ ] While a save is in flight, Escape, backdrop and × are ignored (drawer stays open, controls disabled); while the inline Discard confirm shows, Escape cancels the confirm (back to editing), it never closes the drawer (ADV-004)
- [ ] After a successful edit, focus returns to the row's Edit button if that row is still on the page, else to the table heading (ADV-004)
- [ ] Lint, typecheck, format, tests green

## Notes

User decision 2026-10-08: the admin page runs full width like S6 (no 72rem cap; side padding --space-6 on desktop, --space-4 on phones). Remove the cap in AdminPage.module.css and drop that line from the README's S6-deviation list.


ADR-04 notes ~8 fields as the revisit line: this form is 8 flat fields; record "no library needed" in the README. Toast per G36.

### Implementation notes (2026-10-08)

- Extra files inside features/admin (in scope): `useAdminToast.tsx` (the /me toast pattern as a hook, so TASK-007's delete can reuse it); `testKit.ts` gained optional write responders and `api.bodies`, and `fail(status, message)`.
- Full width: the shell's `main` already pads space-4 phone / space-6 desktop, so only the 72rem cap was removed.
- Return focus: the Drawer's `finalFocus` gets a ref whose `current` is a getter (opener if connected, else the "Alumni" h2 by id), decided as Base UI closes. TanStack notifies observers on a setTimeout, so the removed row can render in the same commit as the close. AdminPage also watches the next new `rows`: if the opener is gone and focus fell to body, it focuses the heading.
- Saves wait for the `['admin']` refetch (the hook returns the invalidate promise), so the drawer closes on fresh rows.
- Deviation: an edit also marks `['posts']` and `['feed']` stale (both show author names), beyond the architecture's `['admin']` + `['alumni']`.
- While the discard question shows, × and the backdrop keep it up; only Escape (back to editing), Keep editing and Discard act. Keep editing returns focus where it was.
- Edit title is "Edit alumni" (S6 draws only Add). The h1 now has tabIndex -1 (toast focus fallback).
- Gates: `npm test` (102 files, 1511 tests), typecheck, lint, format:check, build (AdminPage chunk) all green.

## Related

- Architecture: [[specs/2026-10/m/REQ-015-admin-page/architecture]]
- Lessons checked: L-REQ-002-7, L-REQ-006-3, L-REQ-010-1, L-REQ-010-3, G36, G37, G38, G40
