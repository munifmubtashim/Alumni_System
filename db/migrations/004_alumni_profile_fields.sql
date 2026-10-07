-- REQ-011: alumni profiles get a headline, location, degree, start year and a
-- "open to mentoring" switch. No CHECK constraints: the API owns the rules, as for every other column.
-- Adding a NOT NULL column with a constant default is metadata-only, so existing rows are not rewritten.
-- Apply this BEFORE starting the API version that reads these columns; rolling back means
-- reverting the code, not dropping the columns.
-- Idempotent: safe to run more than once. Requires 003_alumni_profile_to_alumni.sql (the table must be `alumni`).
--   psql -h <host> -p <port> -U <user> -d <db> -v ON_ERROR_STOP=1 -f db/migrations/004_alumni_profile_fields.sql
BEGIN;

ALTER TABLE alumni
    ADD COLUMN IF NOT EXISTS headline             VARCHAR(120),
    ADD COLUMN IF NOT EXISTS location             VARCHAR(100),
    ADD COLUMN IF NOT EXISTS degree               VARCHAR(100),
    ADD COLUMN IF NOT EXISTS start_year           INTEGER,
    ADD COLUMN IF NOT EXISTS mentorship_available BOOLEAN NOT NULL DEFAULT false;

COMMIT;
