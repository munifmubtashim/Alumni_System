-- Older databases were created with an `alumni_profile` table; the code reads `alumni`.
-- Renames it (and `graduation_yr` → `graduation_year`) and makes department/job_title optional,
-- since self-registration doesn't require them. Also normalises role casing.
-- Idempotent: safe to run more than once.
--   psql -h <host> -p <port> -U <user> -d <db> -v ON_ERROR_STOP=1 -f db/migrations/003_alumni_profile_to_alumni.sql
BEGIN;

DO $$
BEGIN
    IF to_regclass('public.alumni') IS NULL AND to_regclass('public.alumni_profile') IS NOT NULL THEN
        ALTER TABLE alumni_profile RENAME TO alumni;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public' AND table_name = 'alumni' AND column_name = 'graduation_yr') THEN
        ALTER TABLE alumni RENAME COLUMN graduation_yr TO graduation_year;
    END IF;
END $$;

ALTER TABLE alumni ALTER COLUMN department DROP NOT NULL;
ALTER TABLE alumni ALTER COLUMN job_title DROP NOT NULL;

UPDATE users SET role = lower(role) WHERE role <> lower(role);

COMMIT;
