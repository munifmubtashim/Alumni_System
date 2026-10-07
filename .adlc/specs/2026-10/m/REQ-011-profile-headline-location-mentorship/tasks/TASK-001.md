# TASK-001 — Migration 004

| Field | Value |
|---|---|
| REQ | REQ-011 |
| Tier | 0 |
| Status | pending |
| Repo | alumni-system |
| Depends on | — |
| Blocks | TASK-005 |

## Goal

`db/migrations/004_alumni_profile_fields.sql` adds the five columns and can run twice without error or change (AC1).

## Files to touch

| Path | Action |
|---|---|
| `db/migrations/004_alumni_profile_fields.sql` | create |

## Approach

- Copy 003's header style and usage line.
- `BEGIN; ALTER TABLE alumni ADD COLUMN IF NOT EXISTS headline VARCHAR(120), … location VARCHAR(100), degree VARCHAR(100), start_year INTEGER, mentorship_available BOOLEAN NOT NULL DEFAULT false; COMMIT;`
- Header comment: "Apply this BEFORE starting the API version that reads these columns; rolling back means reverting the code, not dropping the columns."
- No CHECK constraints. Do not run it against the user's main database; the real run happens in TASK-005 on a throwaway database.

## Acceptance

- [ ] File exists, idempotent statements only
- [ ] Header names the prerequisite (003 applied)

## Notes

Applying it is TASK-005's job (throwaway DB), never the dev database without asking: schema changes are on the confirm-out-of-scope list.

## Related

- Architecture: [[specs/2026-10/m/REQ-011-profile-headline-location-mentorship/architecture]]
- Lessons checked: see architecture.md
