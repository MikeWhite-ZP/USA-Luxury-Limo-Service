-- Database Indexes for USA Luxury Limo Service
-- Run these after initial schema creation for optimal performance

-- =====================================================
-- USERS TABLE INDEXES
-- =====================================================

-- Email lookup (for login)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Role filtering (for admin queries)
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Active users lookup
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Composite index for active users by role
CREATE INDEX IF NOT EXISTS idx_users_role_active ON users(role, is_active) WHERE is_active = true;

-- Phone number lookup (for SMS)
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);

-- =====================================================
-- BOOKINGS TABLE INDEXES
-- =====================================================

-- User's bookings lookup
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);

-- Driver's assigned jobs
CREATE INDEX IF NOT EXISTS idx_bookings_driver_id ON bookings(driver_id);

-- Booking status filtering
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- Booking date range queries
CREATE INDEX IF NOT EXISTS idx_bookings_pickup_date ON bookings(pickup_date);

-- Composite index for active bookings by user
CREATE INDEX IF NOT EXISTS idx_bookings_user_status ON bookings(user_id, status);

-- Composite index for driver assignments
CREATE INDEX IF NOT EXISTS idx_bookings_driver_status ON bookings(driver_id, status) 
  WHERE driver_id IS NOT NULL;

-- Booking reference lookup
CREATE INDEX IF NOT EXISTS idx_bookings_reference ON bookings(booking_reference);

-- Pickup location search (for nearby driver matching)
CREATE INDEX IF NOT EXISTS idx_bookings_pickup_location ON bookings 
  USING GIST (pickup_location) WHERE pickup_location IS NOT NULL;

-- Recent bookings for analytics
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);

-- =====================================================
-- VEHICLE TYPES TABLE INDEXES
-- =====================================================

-- Active vehicles only
CREATE INDEX IF NOT EXISTS idx_vehicle_types_is_active ON vehicle_types(is_active) 
  WHERE is_active = true;

-- Capacity filtering
CREATE INDEX IF NOT EXISTS idx_vehicle_types_capacity ON vehicle_types(capacity);

-- =====================================================
-- PRICING RULES TABLE INDEXES
-- =====================================================

-- Active pricing rules
CREATE INDEX IF NOT EXISTS idx_pricing_rules_is_active ON pricing_rules(is_active) 
  WHERE is_active = true;

-- Vehicle type pricing lookup
CREATE INDEX IF NOT EXISTS idx_pricing_rules_vehicle_type ON pricing_rules(vehicle_type_id);

-- Service type filtering
CREATE INDEX IF NOT EXISTS idx_pricing_rules_service_type ON pricing_rules(service_type);

-- =====================================================
-- DRIVER DOCUMENTS TABLE INDEXES
-- =====================================================

-- Driver's documents lookup
CREATE INDEX IF NOT EXISTS idx_driver_docs_driver_id ON driver_documents(driver_id);

-- Document type filtering
CREATE INDEX IF NOT EXISTS idx_driver_docs_type ON driver_documents(document_type);

-- Verification status
CREATE INDEX IF NOT EXISTS idx_driver_docs_verification ON driver_documents(verification_status);

-- Expiring documents (for alerts)
CREATE INDEX IF NOT EXISTS idx_driver_docs_expiry ON driver_documents(expiry_date) 
  WHERE expiry_date IS NOT NULL AND verification_status = 'verified';

-- =====================================================
-- DRIVER LOCATIONS TABLE INDEXES
-- =====================================================

-- Recent location by driver
CREATE INDEX IF NOT EXISTS idx_driver_locations_driver_timestamp 
  ON driver_locations(driver_id, timestamp DESC);

-- Geographic queries (PostGIS)
-- Note: Enable PostGIS extension first: CREATE EXTENSION IF NOT EXISTS postgis;
-- CREATE INDEX IF NOT EXISTS idx_driver_locations_point 
--   ON driver_locations USING GIST(ST_SetSRID(ST_MakePoint(longitude, latitude), 4326));

-- =====================================================
-- INVOICES TABLE INDEXES
-- =====================================================

-- Invoice number lookup (unique)
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);

-- Booking's invoice
CREATE INDEX IF NOT EXISTS idx_invoices_booking_id ON invoices(booking_id);

-- Payment status filtering
CREATE INDEX IF NOT EXISTS idx_invoices_payment_status ON invoices(payment_status);

-- Due date for reminders
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date) 
  WHERE payment_status != 'paid';

-- =====================================================
-- PAYMENTS TABLE INDEXES
-- =====================================================

-- Invoice's payments
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);

-- User's payment history
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);

-- Payment method analytics
CREATE INDEX IF NOT EXISTS idx_payments_method ON payments(payment_method);

-- Transaction reference lookup
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id);

-- Payment date for reports
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);

-- =====================================================
-- SESSIONS TABLE INDEXES
-- =====================================================

-- Session ID lookup (usually primary key, but ensure it's indexed)
CREATE INDEX IF NOT EXISTS idx_session_sid ON session(sid);

-- Expired sessions cleanup
CREATE INDEX IF NOT EXISTS idx_session_expire ON session(expire);

-- =====================================================
-- CMS SETTINGS TABLE INDEXES
-- =====================================================

-- Settings key lookup
CREATE INDEX IF NOT EXISTS idx_cms_settings_key ON cms_settings(setting_key);

-- =====================================================
-- NOTIFICATIONS TABLE (if exists)
-- =====================================================

-- Uncomment if you have a notifications table
-- CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
-- CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
-- CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- =====================================================
-- PARTIAL INDEXES FOR COMMON QUERIES
-- =====================================================

-- Pending bookings only
CREATE INDEX IF NOT EXISTS idx_bookings_pending 
  ON bookings(pickup_date, created_at) 
  WHERE status = 'pending';

-- Confirmed bookings with drivers
CREATE INDEX IF NOT EXISTS idx_bookings_confirmed_drivers 
  ON bookings(driver_id, pickup_date) 
  WHERE status = 'confirmed' AND driver_id IS NOT NULL;

-- Unpaid invoices
CREATE INDEX IF NOT EXISTS idx_invoices_unpaid 
  ON invoices(due_date, created_at) 
  WHERE payment_status IN ('pending', 'overdue');

-- Active drivers only
CREATE INDEX IF NOT EXISTS idx_users_active_drivers 
  ON users(id, first_name, last_name) 
  WHERE role = 'driver' AND is_active = true;

-- =====================================================
-- ANALYZE TABLES
-- =====================================================

-- Update statistics for query planner
ANALYZE users;
ANALYZE bookings;
ANALYZE vehicle_types;
ANALYZE pricing_rules;
ANALYZE driver_documents;
ANALYZE driver_locations;
ANALYZE invoices;
ANALYZE payments;
ANALYZE session;
ANALYZE cms_settings;

-- =====================================================
-- MONITORING QUERY
-- =====================================================

-- Check index usage (run periodically)
/*
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;
*/

-- Find missing indexes (slow queries)
/*
SELECT 
    schemaname,
    tablename,
    seq_scan,
    seq_tup_read,
    idx_scan,
    seq_tup_read / seq_scan as avg_seq_read
FROM pg_stat_user_tables
WHERE seq_scan > 0
ORDER BY seq_tup_read DESC
LIMIT 20;
*/
