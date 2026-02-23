-- Migration: Stock Update Requests + Consume Request Serial Numbers
-- Purpose:
--   1. Store Man can request inventory stock increases; OC must approve before stock updates.
--   2. Consume requests (inspector → store man approval) now track part serial numbers.
--   3. Fix: link job_cart_id on auto-created consume requests.

BEGIN;

-- ─── 1. Add part_serial_numbers to consume_requests ────────────────────────
ALTER TABLE consume_requests
  ADD COLUMN IF NOT EXISTS part_serial_numbers TEXT;

COMMENT ON COLUMN consume_requests.part_serial_numbers IS
  'Serial numbers of parts dispensed when store man approves the consume request';

-- ─── 2. Create stock_update_requests table ──────────────────────────────────
CREATE TABLE IF NOT EXISTS stock_update_requests (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  inventory_id   UUID        NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
  spare_part_id  UUID        NOT NULL REFERENCES spare_part_templates(id),
  workshop_id    UUID        NOT NULL REFERENCES workshops(id),
  quantity_to_add INT        NOT NULL CHECK (quantity_to_add > 0),
  reason         TEXT,
  status         VARCHAR(20) NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending','approved','rejected')),
  requested_by_id UUID       NOT NULL REFERENCES users(id),
  approved_by_id  UUID                REFERENCES users(id),
  rejection_reason TEXT,
  approved_at    TIMESTAMP,
  created_at     TIMESTAMP   NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sур_inventory  ON stock_update_requests (inventory_id);
CREATE INDEX IF NOT EXISTS idx_sur_workshop   ON stock_update_requests (workshop_id);
CREATE INDEX IF NOT EXISTS idx_sur_status     ON stock_update_requests (status);
CREATE INDEX IF NOT EXISTS idx_sur_requested  ON stock_update_requests (requested_by_id);

COMMENT ON TABLE stock_update_requests IS
  'Inventory stock increase requests created by store_man; must be approved by OC before stock is updated';

COMMIT;
