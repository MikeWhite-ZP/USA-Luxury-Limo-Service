-- USA Luxury Limo - Database Verification Script
-- Run this to verify the database is properly installed

\echo '\n=== Database Schema Verification ===\n'

-- Check if all required tables exist
SELECT 
  'Tables Check' as verification,
  CASE 
    WHEN COUNT(*) >= 17 THEN '✓ PASS'
    ELSE '✗ FAIL - Missing tables'
  END as status,
  COUNT(*) as table_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE';

\echo '\n=== Table List ===\n'

-- List all tables with row counts
SELECT 
  table_name,
  (SELECT COUNT(*) 
   FROM information_schema.columns 
   WHERE table_schema = 'public' 
     AND information_schema.columns.table_name = tables.table_name
  ) as column_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

\echo '\n=== Data Verification (if test data loaded) ===\n'

-- Check data counts
SELECT 'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL
SELECT 'drivers', COUNT(*) FROM drivers
UNION ALL
SELECT 'vehicle_types', COUNT(*) FROM vehicle_types
UNION ALL
SELECT 'vehicles', COUNT(*) FROM vehicles
UNION ALL
SELECT 'pricing_rules', COUNT(*) FROM pricing_rules
UNION ALL
SELECT 'bookings', COUNT(*) FROM bookings
UNION ALL
SELECT 'saved_addresses', COUNT(*) FROM saved_addresses
UNION ALL
SELECT 'system_settings', COUNT(*) FROM system_settings
UNION ALL
SELECT 'payment_systems', COUNT(*) FROM payment_systems
UNION ALL
SELECT 'cms_content', COUNT(*) FROM cms_content
ORDER BY table_name;

\echo '\n=== Foreign Key Constraints ===\n'

-- Verify foreign key constraints exist
SELECT 
  'Foreign Keys' as verification,
  CASE 
    WHEN COUNT(*) >= 15 THEN '✓ PASS'
    ELSE '✗ FAIL - Missing constraints'
  END as status,
  COUNT(*) as constraint_count
FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY'
  AND table_schema = 'public';

\echo '\n=== Indexes ===\n'

-- Verify indexes exist
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

\echo '\n=== Schema Version ===\n'

-- Check schema version
SELECT version, applied_at, description 
FROM schema_version 
ORDER BY applied_at DESC 
LIMIT 1;

\echo '\n=== Test User Accounts (if test data loaded) ===\n'

-- List test users
SELECT 
  username,
  email,
  role,
  is_active,
  created_at
FROM users
ORDER BY role, username;

\echo '\n=== Verification Complete ===\n'

SELECT 
  CASE 
    WHEN (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE') >= 17
      AND (SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY' AND table_schema = 'public') >= 15
    THEN '✓ Database installation verified successfully!'
    ELSE '✗ Database installation has issues - review output above'
  END as final_status;
