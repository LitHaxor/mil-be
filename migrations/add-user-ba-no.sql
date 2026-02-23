-- Add user_ba_no column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_ba_no INTEGER UNIQUE;
