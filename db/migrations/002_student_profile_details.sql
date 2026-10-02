-- Bolt 14.1: students get the same profile details as alumni (company, job title, LinkedIn, bio, experience).
-- Idempotent: safe to run more than once. Requires 001_university_and_students.sql.
--   psql -h <host> -p <port> -U <user> -d <db> -v ON_ERROR_STOP=1 -f db/migrations/002_student_profile_details.sql
BEGIN;

ALTER TABLE students
    ADD COLUMN IF NOT EXISTS current_company VARCHAR(100),
    ADD COLUMN IF NOT EXISTS job_title       VARCHAR(100),
    ADD COLUMN IF NOT EXISTS experience      TEXT,
    ADD COLUMN IF NOT EXISTS bio             TEXT,
    ADD COLUMN IF NOT EXISTS linkedin_url    VARCHAR(255);

COMMIT;
