-- Bolt 14: university on every account + a students table (one row per student user).
-- Idempotent: safe to run more than once.
--   psql -h <host> -p <port> -U <user> -d <db> -v ON_ERROR_STOP=1 -f db/migrations/001_university_and_students.sql
BEGIN;

ALTER TABLE users ADD COLUMN IF NOT EXISTS university VARCHAR(150);

CREATE TABLE IF NOT EXISTS students (
    id                       SERIAL PRIMARY KEY,
    user_id                  INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    department               VARCHAR(100),
    expected_graduation_year VARCHAR(10),
    created_at               TIMESTAMP DEFAULT NOW(),
    updated_at               TIMESTAMP DEFAULT NOW()
);

COMMIT;
