# TASK-005 — Backend queries, route tests and real-DB run

| Field | Value |
|---|---|
| REQ | REQ-011 |
| Tier | 2 |
| Status | done |
| Repo | alumni-system |
| Depends on | TASK-001, TASK-004 |
| Blocks | TASK-008, TASK-009 |

## Goal

The five fields are stored and read everywhere alumni are, proven by route tests and one real Postgres run (AC1, AC2, AC13).

## Files to touch

| Path | Action |
|---|---|
| `packages/backend/src/dal/query/AlumniQuery.ts` + test | edit |
| `packages/backend/src/dal/query/UserQuery.ts` + test | edit |
| `packages/backend/src/api/routes/routes.test.ts` | edit |

## Approach

- AlumniQuery INSERT/UPDATE gain five columns; UserQuery alumni UPDATE too; `MY_PROFILE_SQL` selects them from `a.` with `COALESCE(a.mentorship_available,false)`.
- Route tests: GET alumni/:id, GET alumni list, GET/PUT /api/me, PUT/POST /api/alumni; 400s; guest 401, other user and admin 403.
- Real run: create a throwaway database, apply the schema from `db/backups` (G15) + 001–003, insert a row, apply 004 twice (`psql -v ON_ERROR_STOP=1`), verify `\d alumni`, the old row got false, then exercise the real queries once (script in the scratchpad). Drop the database after. Record commands and output in the task file.

## Acceptance

- [x] AC1 verified twice on a real database, log recorded
- [x] AC2 responses carry the fields; mentorship never null
- [x] tests and typecheck pass (typecheck: known TS1261 only, see Notes)

## Notes

Needs a local Postgres. Create and drop only your own throwaway database; do not touch the dev database. If no Postgres is available, stop and surface it.

Done 2026-10-07.

**Code.** `AlumniQuery.createAlumni` INSERT gains the five columns ($9–$13; text `?? null`, flag `?? false` because the column is NOT NULL). `updateAlumni` and `UserQuery.updateMyProfile`'s alumni UPDATE set them ($8–$12, id/user_id now $13). `MY_PROFILE_SQL` selects `a.headline, a.location, a.degree, a.start_year, COALESCE(a.mentorship_available, false)`. Registration INSERT unchanged (column defaults).

**Tests.** `AlumniQuery.test.ts` and `UserQuery.test.ts` pair every column with its bound parameter (catches order slips). `routes.test.ts` gains a REQ-011 block that sends each faked manager call to a real manager (from `vi.importActual`) with its query object spied: GET alumni/:id, GET alumni list, GET /api/me carry the fields (flag boolean); PUT /api/me, PUT/POST /api/alumni store them; 9 bad values x 3 routes give 400 with nothing written; another alumni, a student and an admin get 403 and a guest 401 on PUT /api/alumni/5; a student's junk alumni fields are ignored. `npm run test:backend`: 474/474 (was 427).

**Typecheck.** `typecheck:backend` still fails only on the known TS1261 (G22/G32). `tsc --noEmit -p src/{api,businessLogic,dal} --forceConsistentCasingInFileNames false`: 0 errors each. `tsc -p tsconfig.test.json --forceConsistentCasingInFileNames false` (run directly, no scratch config needed): 0 errors. businessLogic not edited, so no dist rebuild.

**Real database (Postgres 15.17, socket /tmp:5432, database `alumni_req011_scratch`; the dev database was never touched and `.env` never read).**

1. `createdb alumni_req011_scratch`.
2. Schema from `db/backups/pre_bolt20_20261003_220745.sql` with COPY data blocks, `OWNER TO` and `setval` lines removed (awk, into the scratchpad; no row data read). First load failed at line 13, `unrecognized configuration parameter "transaction_timeout"` (dump is from Postgres 17+); dropped that line, recreated the database, loaded: ok. The dump is already post-003 (table `alumni`, students with details).
3. `psql -v ON_ERROR_STOP=1 -f` 001, 002, 003: all exit 0 (001/002 "already exists, skipping" notices).
4. Seed: users 1 alumni + 2 student, alumni row (user 1, CSE, 2017, job "Dev"), students row.
5. 004 run 1: `BEGIN / ALTER TABLE / COMMIT`, exit 0. information_schema.columns: `headline|character varying|120|YES|`, `location|character varying|100|YES|`, `degree|character varying|100|YES|`, `start_year|integer||YES|`, `mentorship_available|boolean||NO|false`. Old row: CSE / 2017 / Dev kept, four new columns null, flag `f`.
6. 004 run 2: five "column ... already exists, skipping" notices, `COMMIT`, exit 0; the information_schema output is identical to run 1 (`diff` empty); `\d alumni` shows the five columns once, `mentorship_available boolean not null default false`; old row unchanged.
7. `realdb.mts` (scratchpad, `npx tsx`, env DB_* pointed at the scratch database; the script stops unless `current_database()` is the scratch one) through the real managers and queries: 8/8 PASS. createAlumni stored `{"headline":"Product designer" (trimmed),"location":"Oslo","degree":"B.Sc. Product Design","start_year":2013,"mentorship_available":true}`; findAlumniById and searchAlumni carried them (flag boolean on both items); updateOwnAlumni omitting location/degree/flag gave nulls and `false`; getMe on the pre-004 row: fields null, flag false, old data kept; updateMe (alumni) stored all five; updateMe (student with 500-char headline, flag "yes") 200 with headline null, flag false; getMe for an account with no profile row: flag false, not null.
8. `dropdb alumni_req011_scratch`; `pg_database` count for it: 0.

Seen: pg returns `start_year`/`graduation_year` as numbers while `MyProfile` types them as strings (pre-existing for graduation_year; the My Profile `text()` helper already handles numbers). Not changed here (shared types are TASK-002's).

## Related

- Architecture: [[specs/2026-10/m/REQ-011-profile-headline-location-mentorship/architecture]]
- Lessons checked: see architecture.md
