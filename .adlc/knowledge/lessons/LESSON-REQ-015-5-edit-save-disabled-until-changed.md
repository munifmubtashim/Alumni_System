# An edit form's Save stays disabled until a value differs from what was loaded ^L-REQ-015-5

| Field | Value |
|---|---|
| ID | LESSON-REQ-015-5 |
| Captured | 2026-10-08 |
| REQ | REQ-015 |
| Component | frontend |
| Tags | frontend, forms, ux |
| Severity | guideline |

## The lesson

Compare the trimmed form values with the loaded record and disable Save (and return early in submit, so Enter cannot bypass it) while nothing changed. Otherwise an untouched form sends a write, refetches, and shows "Changes saved" for a save that did nothing.

## Saw it in

- `packages/frontend/src/features/admin/AlumniDrawer.tsx` (edit mode) — UI-001, fixed in REQ-015 review round 1
