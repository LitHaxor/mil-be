-- Add cme_id column to workshops table and update user role enum

-- add new enum value if not already present (for Postgres you need to ALTER TYPE)
-- NOTE: this script assumes you are using the same enum type defined in fix-user-role-enum.sql

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE t.typname = 'users_role_enum' AND e.enumlabel = 'cme'
    ) THEN
        ALTER TYPE users_role_enum ADD VALUE 'cme';
    END IF;
END$$;

-- add cme_id column for workshop assignments
ALTER TABLE workshops
    ADD COLUMN IF NOT EXISTS cme_id uuid;

-- optional: add foreign key constraint linking to users.id
ALTER TABLE workshops
    ADD CONSTRAINT IF NOT EXISTS fk_workshops_cme_id
    FOREIGN KEY (cme_id) REFERENCES users(id) ON DELETE SET NULL;
