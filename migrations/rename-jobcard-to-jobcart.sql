-- Migration: Rename job_cards to job_carts and add new fields
-- Date: 2026-02-17
-- Description: 
--   1. Rename job_cards table to job_carts
--   2. Add ba_no field to entries table
--   3. Add unit field to user_units table
--   4. Add job_cart_id to consume_requests table

BEGIN;

-- Step 1: Rename job_cards table to job_carts
ALTER TABLE IF EXISTS job_cards RENAME TO job_carts;

-- Step 2: Add ba_no field to entries table (Book Authorization Number)
ALTER TABLE entries 
ADD COLUMN IF NOT EXISTS ba_no VARCHAR(255);

-- Step 3: Add unit field to entries table (Battalion/Unit for entry logging)
ALTER TABLE entries 
ADD COLUMN IF NOT EXISTS unit VARCHAR(255);

-- Add index on ba_no for faster lookups
CREATE INDEX IF NOT EXISTS idx_entries_ba_no ON entries(ba_no);

-- Step 4: Add unit field to user_units table (Battalion/Unit info like "149F6 Wscp Coy")
ALTER TABLE user_units 
ADD COLUMN IF NOT EXISTS unit VARCHAR(255);

-- Add index on unit for filtering
CREATE INDEX IF NOT EXISTS idx_user_units_unit ON user_units(unit);

-- Step 5: Add job_cart_id to consume_requests table (to track which job cart needs which parts)
ALTER TABLE consume_requests
ADD COLUMN IF NOT EXISTS job_cart_id UUID;

-- Add foreign key constraint
ALTER TABLE consume_requests
ADD CONSTRAINT fk_consume_requests_job_cart
FOREIGN KEY (job_cart_id) REFERENCES job_carts(id)
ON DELETE SET NULL;

-- Add index for job_cart_id
CREATE INDEX IF NOT EXISTS idx_consume_requests_job_cart ON consume_requests(job_cart_id);

-- Step 6: Add comments for documentation
COMMENT ON COLUMN entries.ba_no IS 'Book Authorization Number for tracking multiple job carts per entry';
COMMENT ON COLUMN entries.unit IS 'Battalion or military unit designation at entry time';
COMMENT ON COLUMN user_units.unit IS 'Battalion or military unit designation (e.g., 149F6 Wscp Coy, 1Fd, CM1)';
COMMENT ON COLUMN consume_requests.job_cart_id IS 'Job cart ID for which spare parts are requested';
COMMENT ON TABLE job_carts IS 'Job carts (renamed from job_cards) for tracking spare part requests and maintenance work';

COMMIT;

-- Verification queries (run these after migration to verify)
-- SELECT COUNT(*) FROM job_carts;
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'entries' AND column_name IN ('ba_no', 'unit');
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'user_units' AND column_name = 'unit';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'consume_requests' AND column_name = 'job_cart_id';
