# Build the student validator from a shared part, never by spreading the alumni validator and deleting keys ^L-REQ-011-1

| Field | Value |
|---|---|
| ID | LESSON-REQ-011-1 |
| Captured | 2026-10-07 |
| REQ | REQ-011 |
| Component | backend |
| Tags | backend, validation, students |
| Severity | guideline |

## The lesson

When two roles share some profile fields, split the validator into a shared-details helper plus the role-only part. Spreading one role's validator and dropping keys makes every new role-only field validate (and 400) for the other role, even though the query never stores it.

## Saw it in

- `validateStudentFields` in `businessLogic/src/validation.ts`: the old destructure-and-drop only removed department/graduation_year (CAND-005, found by the architecture adversary as ADV-003); fixed with `validateSharedDetails`.
