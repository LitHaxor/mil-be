-- Update user_units table to support workshop tracking and simplified status

-- 1. Add active_workshop_id column (currently active workshop)
ALTER TABLE user_units 
ADD COLUMN IF NOT EXISTS active_workshop_id uuid REFERENCES workshops(id) ON DELETE SET NULL;

-- 2. Add workshop_history JSONB column to track workshop visits
ALTER TABLE user_units 
ADD COLUMN IF NOT EXISTS workshop_history jsonb DEFAULT '[]'::jsonb;

-- 3. Update unit_status enum to add 'available' status
ALTER TYPE unit_status ADD VALUE IF NOT EXISTS 'available';

-- 4. Update existing user_units: set active_workshop_id from workshop_id if they're in workshop status
UPDATE user_units
SET active_workshop_id = workshop_id
WHERE status IN ('in_workshop', 'under_maintenance', 'completed');

-- 5. Update existing user_units: set status to 'available' if currently 'exited' or no status
UPDATE user_units
SET status = 'available'
WHERE status = 'exited' OR status IS NULL;

-- 6. Remove entry status column if it exists (we decided status only lives in user_units)
ALTER TABLE entries 
DROP COLUMN IF EXISTS status;

-- 7. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_units_active_workshop_id ON user_units(active_workshop_id);
CREATE INDEX IF NOT EXISTS idx_user_units_ba_regt_no ON user_units(ba_regt_no);
CREATE INDEX IF NOT EXISTS idx_entries_ba_no ON entries(ba_no);

-- 8. Add comments to explain columns
COMMENT ON COLUMN user_units.workshop_id IS 'Root/assigned workshop (permanent assignment)';
COMMENT ON COLUMN user_units.active_workshop_id IS 'Currently active workshop where vehicle is now (NULL when not in any workshop)';
COMMENT ON COLUMN user_units.workshop_history IS 'Array of workshop visits: [{workshop_id, workshop_name, entry_id, ba_no, entered_at, exited_at}]';
COMMENT ON COLUMN user_units.status IS 'Vehicle status: available, in_workshop, under_maintenance, completed, exited';
