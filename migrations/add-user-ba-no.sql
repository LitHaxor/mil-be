-- Add user_ba_no column to users table (use BIGINT to support large BA numbers)
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_ba_no BIGINT UNIQUE;
