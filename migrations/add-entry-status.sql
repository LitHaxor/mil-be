-- Add status column to entries table
-- This ensures entries have an explicit status (active/exited) instead of relying on exit relationship

-- Create enum type for entry status
CREATE TYPE entry_status AS ENUM ('active', 'exited');

-- Add status column with default value 'active'
ALTER TABLE entries 
ADD COLUMN status entry_status NOT NULL DEFAULT 'active';

-- Update existing entries: set status to 'exited' if they have an exit record
UPDATE entries e
SET status = 'exited'
FROM exits ex
WHERE ex.entry_id = e.id;

-- Create index on status for better query performance
CREATE INDEX idx_entries_status ON entries(status);

-- Add comment to explain the column
COMMENT ON COLUMN entries.status IS 'Entry status: active (in workshop) or exited (left workshop)';
