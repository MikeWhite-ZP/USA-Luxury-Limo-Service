-- ===================================
-- MIGRATION: Add Partner Feature
-- Run this on existing tenant databases
-- Version: 1.0.0
-- Date: 2026-01-02
-- ===================================

-- 1. Add Partner fields to users table
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS is_partner BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS partner_company_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS partner_commission_rate DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS partner_notes TEXT;

-- 2. Add Partner source tracking to bookings table
ALTER TABLE bookings 
  ADD COLUMN IF NOT EXISTS source_partner_id VARCHAR REFERENCES users(id);

-- 3. Create indexes for efficient Partner queries
CREATE INDEX IF NOT EXISTS idx_users_is_partner ON users(is_partner) WHERE is_partner = TRUE;
CREATE INDEX IF NOT EXISTS idx_bookings_source_partner ON bookings(source_partner_id) WHERE source_partner_id IS NOT NULL;

-- 4. (Optional) View for Partner statistics - Uncomment if needed
-- CREATE OR REPLACE VIEW partner_statistics AS
-- SELECT 
--   u.id AS partner_id,
--   u.partner_company_name,
--   u.partner_commission_rate,
--   COUNT(b.id) AS total_bookings,
--   SUM(CAST(b.total_amount AS DECIMAL)) AS total_revenue,
--   SUM(CAST(b.total_amount AS DECIMAL) * u.partner_commission_rate / 100) AS commission_owed
-- FROM users u
-- LEFT JOIN bookings b ON b.source_partner_id = u.id AND b.status = 'completed'
-- WHERE u.is_partner = TRUE
-- GROUP BY u.id, u.partner_company_name, u.partner_commission_rate;

-- Verify the migration
SELECT 
  'Users table - Partner fields added' AS check_type,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'is_partner'
  ) THEN 'SUCCESS' ELSE 'FAILED' END AS status;

SELECT 
  'Bookings table - source_partner_id added' AS check_type,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'source_partner_id'
  ) THEN 'SUCCESS' ELSE 'FAILED' END AS status;
