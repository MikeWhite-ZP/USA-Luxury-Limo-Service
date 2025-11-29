-- USA Luxury Limo - Drop All Tables
-- ⚠️ WARNING: This will delete ALL data and tables!
-- Use only for clean reinstallation

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS schema_version CASCADE;
DROP TABLE IF EXISTS cms_content CASCADE;
DROP TABLE IF EXISTS contact_submissions CASCADE;
DROP TABLE IF EXISTS payment_tokens CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS payment_systems CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS saved_addresses CASCADE;
DROP TABLE IF EXISTS driver_ratings CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS pricing_rules CASCADE;
DROP TABLE IF EXISTS vehicle_types CASCADE;
DROP TABLE IF EXISTS driver_documents CASCADE;
DROP TABLE IF EXISTS drivers CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;

-- Confirm deletion
SELECT 'All tables have been dropped!' as message;
SELECT COUNT(*) as remaining_tables 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE';
