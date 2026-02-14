-- Migration to fix users_role_enum
-- Run this SQL in your PostgreSQL database

BEGIN;

-- Step 1: Update any existing data with old 'inspector' value to new value
UPDATE users SET role = 'inspector_ri&i' WHERE role = 'inspector';

-- Step 2: Drop and recreate the enum type with correct values
ALTER TYPE users_role_enum RENAME TO users_role_enum_old;
CREATE TYPE users_role_enum AS ENUM('admin', 'oc', 'captain', 'inspector_ri&i', 'store_man');
ALTER TABLE users ALTER COLUMN role TYPE users_role_enum USING role::text::users_role_enum;
DROP TYPE users_role_enum_old;

COMMIT;
