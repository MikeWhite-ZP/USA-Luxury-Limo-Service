-- ============================================================================
-- USA Luxury Limo - Tenant Database Schema Updates
-- Version: 1.0.4
-- Date: December 2024
-- Description: Latest migration updates for existing tenant databases
-- Run this script to update existing databases to the latest schema
-- ============================================================================

-- Enable UUID extension (idempotent)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- SESSIONS TABLE (ensure exists for auth)
-- ============================================================================
CREATE TABLE IF NOT EXISTS sessions (
    sid VARCHAR PRIMARY KEY,
    sess JSONB NOT NULL,
    expire TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON sessions(expire);

-- ============================================================================
-- PAYMENT TOKENS TABLE (ensure exists with proper structure)
-- ============================================================================
CREATE TABLE IF NOT EXISTS payment_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id),
    token VARCHAR(64) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- BOOKING CANCELLATIONS TABLE (ensure proper structure)
-- ============================================================================
CREATE TABLE IF NOT EXISTS booking_cancellations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id),
    cancelled_by VARCHAR NOT NULL CHECK (cancelled_by IN ('passenger', 'driver', 'admin', 'system')),
    cancellation_reason TEXT,
    hours_before_pickup DECIMAL(8, 2),
    was_driver_on_the_way BOOLEAN DEFAULT FALSE,
    charge_applied BOOLEAN DEFAULT FALSE,
    charge_amount DECIMAL(10, 2),
    credit_issued BOOLEAN DEFAULT FALSE,
    credit_amount DECIMAL(10, 2),
    refund_status VARCHAR DEFAULT 'none' CHECK (refund_status IN ('none', 'credit_issued', 'charged', 'full_refund')),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- RIDE CREDITS TABLES (ensure exist)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ride_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL UNIQUE REFERENCES users(id),
    balance DECIMAL(10, 2) DEFAULT 0.00 NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ride_credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES users(id),
    booking_id UUID REFERENCES bookings(id),
    transaction_type VARCHAR NOT NULL CHECK (transaction_type IN ('earned', 'spent', 'adjustment', 'expired')),
    amount DECIMAL(10, 2) NOT NULL,
    balance_after DECIMAL(10, 2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- DRIVER MESSAGES TABLE (ensure exists)
-- ============================================================================
CREATE TABLE IF NOT EXISTS driver_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id VARCHAR NOT NULL REFERENCES users(id),
    driver_id VARCHAR REFERENCES users(id),
    message_type VARCHAR DEFAULT 'individual' NOT NULL CHECK (message_type IN ('individual', 'broadcast', 'alert')),
    subject VARCHAR,
    message TEXT NOT NULL,
    priority VARCHAR DEFAULT 'normal' CHECK (priority IN ('normal', 'high', 'urgent')),
    delivery_method VARCHAR DEFAULT 'both' NOT NULL CHECK (delivery_method IN ('sms', 'email', 'both')),
    status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- EMERGENCY INCIDENTS TABLE (ensure exists)
-- ============================================================================
CREATE TABLE IF NOT EXISTS emergency_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id VARCHAR NOT NULL REFERENCES users(id),
    incident_type VARCHAR NOT NULL CHECK (incident_type IN ('accident', 'breakdown', 'medical', 'safety', 'other')),
    severity VARCHAR DEFAULT 'medium' NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    booking_id UUID REFERENCES bookings(id),
    driver_id VARCHAR REFERENCES users(id),
    location VARCHAR,
    location_coordinates VARCHAR,
    description TEXT NOT NULL,
    status VARCHAR DEFAULT 'open' NOT NULL CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    assigned_to VARCHAR REFERENCES users(id),
    resolution_notes TEXT,
    emergency_services_contacted BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- CMS TABLES (ensure exist)
-- ============================================================================
CREATE TABLE IF NOT EXISTS cms_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR NOT NULL UNIQUE,
    value TEXT,
    category VARCHAR NOT NULL CHECK (category IN ('branding', 'colors', 'social', 'contact', 'seo', 'tax')),
    description TEXT,
    updated_by VARCHAR REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cms_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    block_type VARCHAR NOT NULL CHECK (block_type IN ('hero', 'about', 'services', 'contact', 'footer', 'testimonial')),
    identifier VARCHAR NOT NULL,
    title VARCHAR,
    content TEXT,
    metadata JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    updated_by VARCHAR REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cms_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name VARCHAR NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR NOT NULL,
    file_size INTEGER,
    folder VARCHAR DEFAULT 'general' CHECK (folder IN ('logos', 'hero-images', 'favicon', 'vehicles', 'testimonials', 'general')),
    alt_text TEXT,
    description TEXT,
    width INTEGER,
    height INTEGER,
    uploaded_by VARCHAR NOT NULL REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- SERVICES TABLE (ensure exists)
-- ============================================================================
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR NOT NULL UNIQUE,
    title VARCHAR NOT NULL,
    subtitle VARCHAR,
    description TEXT NOT NULL,
    icon VARCHAR NOT NULL CHECK (icon IN ('Plane', 'Briefcase', 'Heart', 'Clock', 'Car', 'Users', 'Star', 'Shield', 'Calendar', 'MapPin')),
    features TEXT[] DEFAULT '{}' NOT NULL,
    image_url VARCHAR,
    image_alt VARCHAR,
    cta_label VARCHAR,
    cta_url VARCHAR,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS services_slug_idx ON services(slug);

-- ============================================================================
-- PASSWORD RESET TOKENS TABLE (ensure exists)
-- ============================================================================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES users(id),
    token VARCHAR NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- BOOKINGS TABLE UPDATES - Additional columns
-- ============================================================================

-- Add surcharges field if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'surcharges') THEN
        ALTER TABLE bookings ADD COLUMN surcharges JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- Add driver payment fields if not exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'driver_payment') THEN
        ALTER TABLE bookings ADD COLUMN driver_payment DECIMAL(10, 2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'driver_payment_paid') THEN
        ALTER TABLE bookings ADD COLUMN driver_payment_paid BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'driver_payment_paid_at') THEN
        ALTER TABLE bookings ADD COLUMN driver_payment_paid_at TIMESTAMP;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'driver_payment_paid_by') THEN
        ALTER TABLE bookings ADD COLUMN driver_payment_paid_by VARCHAR;
    END IF;
END $$;

-- Add journey tracking fields if not exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'reminder_sent_at') THEN
        ALTER TABLE bookings ADD COLUMN reminder_sent_at TIMESTAMP;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'on_the_way_at') THEN
        ALTER TABLE bookings ADD COLUMN on_the_way_at TIMESTAMP;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'arrived_at') THEN
        ALTER TABLE bookings ADD COLUMN arrived_at TIMESTAMP;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'on_board_at') THEN
        ALTER TABLE bookings ADD COLUMN on_board_at TIMESTAMP;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'auto_cancelled_at') THEN
        ALTER TABLE bookings ADD COLUMN auto_cancelled_at TIMESTAMP;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'no_show') THEN
        ALTER TABLE bookings ADD COLUMN no_show BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'refund_invoice_sent') THEN
        ALTER TABLE bookings ADD COLUMN refund_invoice_sent BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'marked_completed_at') THEN
        ALTER TABLE bookings ADD COLUMN marked_completed_at TIMESTAMP;
    END IF;
END $$;

-- Add invoice and billing fields if not exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'bill_reference') THEN
        ALTER TABLE bookings ADD COLUMN bill_reference VARCHAR(100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'actual_pickup_time') THEN
        ALTER TABLE bookings ADD COLUMN actual_pickup_time TIMESTAMP;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'actual_dropoff_time') THEN
        ALTER TABLE bookings ADD COLUMN actual_dropoff_time TIMESTAMP;
    END IF;
END $$;

-- Add location tracking JSONB fields if not exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'accepted_location') THEN
        ALTER TABLE bookings ADD COLUMN accepted_location JSONB;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'started_location') THEN
        ALTER TABLE bookings ADD COLUMN started_location JSONB;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'dod_at') THEN
        ALTER TABLE bookings ADD COLUMN dod_at TIMESTAMP;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'dod_location') THEN
        ALTER TABLE bookings ADD COLUMN dod_location JSONB;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'pob_at') THEN
        ALTER TABLE bookings ADD COLUMN pob_at TIMESTAMP;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'pob_location') THEN
        ALTER TABLE bookings ADD COLUMN pob_location JSONB;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'ended_location') THEN
        ALTER TABLE bookings ADD COLUMN ended_location JSONB;
    END IF;
END $$;

-- Add pricing breakdown fields if not exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'gratuity_amount') THEN
        ALTER TABLE bookings ADD COLUMN gratuity_amount DECIMAL(10, 2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'airport_fee_amount') THEN
        ALTER TABLE bookings ADD COLUMN airport_fee_amount DECIMAL(10, 2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'surge_pricing_multiplier') THEN
        ALTER TABLE bookings ADD COLUMN surge_pricing_multiplier DECIMAL(5, 2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'surge_pricing_amount') THEN
        ALTER TABLE bookings ADD COLUMN surge_pricing_amount DECIMAL(10, 2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'regular_price') THEN
        ALTER TABLE bookings ADD COLUMN regular_price DECIMAL(10, 2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'discount_percentage') THEN
        ALTER TABLE bookings ADD COLUMN discount_percentage DECIMAL(5, 2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'discount_amount') THEN
        ALTER TABLE bookings ADD COLUMN discount_amount DECIMAL(10, 2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'credit_amount_applied') THEN
        ALTER TABLE bookings ADD COLUMN credit_amount_applied DECIMAL(10, 2);
    END IF;
END $$;

-- ============================================================================
-- DRIVERS TABLE UPDATES
-- ============================================================================

-- Add 1099 Tax Information fields if not exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'tax_legal_first_name') THEN
        ALTER TABLE drivers ADD COLUMN tax_legal_first_name VARCHAR;
        ALTER TABLE drivers ADD COLUMN tax_legal_last_name VARCHAR;
        ALTER TABLE drivers ADD COLUMN tax_ssn_encrypted TEXT;
        ALTER TABLE drivers ADD COLUMN tax_ssn_last4 VARCHAR(4);
        ALTER TABLE drivers ADD COLUMN tax_date_of_birth TIMESTAMP;
        ALTER TABLE drivers ADD COLUMN tax_address_street VARCHAR;
        ALTER TABLE drivers ADD COLUMN tax_address_city VARCHAR;
        ALTER TABLE drivers ADD COLUMN tax_address_state VARCHAR(2);
        ALTER TABLE drivers ADD COLUMN tax_address_zip VARCHAR(10);
        ALTER TABLE drivers ADD COLUMN tax_classification VARCHAR DEFAULT 'individual' CHECK (tax_classification IN ('individual', 'sole_proprietor', 'llc', 'corporation', 'partnership'));
        ALTER TABLE drivers ADD COLUMN tax_info_completed_at TIMESTAMP;
    END IF;
END $$;

-- Add driver credentials and vehicle plate if not exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'vehicle_plate') THEN
        ALTER TABLE drivers ADD COLUMN vehicle_plate VARCHAR;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'driver_credentials') THEN
        ALTER TABLE drivers ADD COLUMN driver_credentials VARCHAR;
    END IF;
END $$;

-- ============================================================================
-- USERS TABLE UPDATES
-- ============================================================================

-- Add GPS tracking fields for drivers if not exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'latitude') THEN
        ALTER TABLE users ADD COLUMN latitude DECIMAL(10, 8);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'longitude') THEN
        ALTER TABLE users ADD COLUMN longitude DECIMAL(11, 8);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_location_update') THEN
        ALTER TABLE users ADD COLUMN last_location_update TIMESTAMP;
    END IF;
END $$;

-- Add password reset fields if not exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password_reset_token') THEN
        ALTER TABLE users ADD COLUMN password_reset_token VARCHAR;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password_reset_expires') THEN
        ALTER TABLE users ADD COLUMN password_reset_expires TIMESTAMP;
    END IF;
END $$;

-- Add discount fields if not exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'discount_type') THEN
        ALTER TABLE users ADD COLUMN discount_type VARCHAR CHECK (discount_type IN ('percentage', 'fixed'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'discount_value') THEN
        ALTER TABLE users ADD COLUMN discount_value DECIMAL(10, 2) DEFAULT 0;
    END IF;
END $$;

-- Add Stripe fields if not exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'stripe_customer_id') THEN
        ALTER TABLE users ADD COLUMN stripe_customer_id VARCHAR;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'stripe_subscription_id') THEN
        ALTER TABLE users ADD COLUMN stripe_subscription_id VARCHAR;
    END IF;
END $$;

-- ============================================================================
-- INVOICES TABLE UPDATES
-- ============================================================================

-- Add pricing breakdown fields to invoices if not exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'base_fare') THEN
        ALTER TABLE invoices ADD COLUMN base_fare DECIMAL(10, 2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'gratuity_amount') THEN
        ALTER TABLE invoices ADD COLUMN gratuity_amount DECIMAL(10, 2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'airport_fee_amount') THEN
        ALTER TABLE invoices ADD COLUMN airport_fee_amount DECIMAL(10, 2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'surge_pricing_multiplier') THEN
        ALTER TABLE invoices ADD COLUMN surge_pricing_multiplier DECIMAL(5, 2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'surge_pricing_amount') THEN
        ALTER TABLE invoices ADD COLUMN surge_pricing_amount DECIMAL(10, 2);
    END IF;
END $$;

-- ============================================================================
-- PRICING RULES TABLE UPDATES
-- ============================================================================

-- Add advanced pricing fields if not exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pricing_rules' AND column_name = 'gratuity_percent') THEN
        ALTER TABLE pricing_rules ADD COLUMN gratuity_percent DECIMAL(5, 2) DEFAULT 20.00;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pricing_rules' AND column_name = 'airport_fees') THEN
        ALTER TABLE pricing_rules ADD COLUMN airport_fees JSONB DEFAULT '[]'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pricing_rules' AND column_name = 'meet_and_greet') THEN
        ALTER TABLE pricing_rules ADD COLUMN meet_and_greet JSONB DEFAULT '{"enabled": false, "charge": 0}'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pricing_rules' AND column_name = 'surge_pricing') THEN
        ALTER TABLE pricing_rules ADD COLUMN surge_pricing JSONB DEFAULT '[]'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pricing_rules' AND column_name = 'distance_tiers') THEN
        ALTER TABLE pricing_rules ADD COLUMN distance_tiers JSONB DEFAULT '[]'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pricing_rules' AND column_name = 'overtime_rate') THEN
        ALTER TABLE pricing_rules ADD COLUMN overtime_rate DECIMAL(10, 2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pricing_rules' AND column_name = 'effective_start') THEN
        ALTER TABLE pricing_rules ADD COLUMN effective_start TIMESTAMP;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pricing_rules' AND column_name = 'effective_end') THEN
        ALTER TABLE pricing_rules ADD COLUMN effective_end TIMESTAMP;
    END IF;
END $$;

-- ============================================================================
-- DRIVER DOCUMENTS TABLE UPDATES
-- ============================================================================

-- Add whatsapp_number field if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'driver_documents' AND column_name = 'whatsapp_number') THEN
        ALTER TABLE driver_documents ADD COLUMN whatsapp_number VARCHAR;
    END IF;
END $$;

-- ============================================================================
-- UPDATE BOOKING STATUS CONSTRAINT
-- ============================================================================
DO $$
BEGIN
    ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
    ALTER TABLE bookings ADD CONSTRAINT bookings_status_check 
        CHECK (status IN ('pending', 'pending_driver_acceptance', 'confirmed', 'on_the_way', 'arrived', 'on_board', 'in_progress', 'completed', 'cancelled'));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- CREATE PERFORMANCE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_drivers_user_id ON drivers(user_id);
CREATE INDEX IF NOT EXISTS idx_drivers_verification_status ON drivers(verification_status);
CREATE INDEX IF NOT EXISTS idx_bookings_passenger_id ON bookings(passenger_id);
CREATE INDEX IF NOT EXISTS idx_bookings_driver_id ON bookings(driver_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_scheduled_date ON bookings(scheduled_date_time);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_invoices_booking_id ON invoices(booking_id);
CREATE INDEX IF NOT EXISTS idx_payment_tokens_invoice_id ON payment_tokens(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_tokens_token ON payment_tokens(token);
CREATE INDEX IF NOT EXISTS idx_ride_credits_user_id ON ride_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_ride_credit_transactions_user_id ON ride_credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_booking_cancellations_booking_id ON booking_cancellations(booking_id);
CREATE INDEX IF NOT EXISTS idx_driver_ratings_booking_id ON driver_ratings(booking_id);
CREATE INDEX IF NOT EXISTS idx_driver_ratings_driver_id ON driver_ratings(driver_id);
CREATE INDEX IF NOT EXISTS idx_emergency_incidents_booking_id ON emergency_incidents(booking_id);
CREATE INDEX IF NOT EXISTS idx_cms_settings_key ON cms_settings(key);
CREATE INDEX IF NOT EXISTS idx_cms_media_folder ON cms_media(folder);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);

-- ============================================================================
-- ENSURE DEFAULT PAYMENT OPTIONS EXIST
-- ============================================================================
INSERT INTO payment_options (option_type, display_name, description, is_enabled, sort_order) VALUES
('credit_card', 'Credit Card', 'Pay securely with your credit or debit card', true, 1),
('pay_later', 'Pay Later', 'Pay after your ride is completed', false, 2),
('cash', 'Cash', 'Pay in cash to the driver', false, 3),
('ride_credit', 'Ride Credit', 'Use your ride credit balance', true, 4)
ON CONFLICT (option_type) DO NOTHING;

-- ============================================================================
-- SCHEMA VERIFICATION
-- ============================================================================
DO $$
DECLARE
    missing_tables TEXT[] := '{}';
    required_tables TEXT[] := ARRAY[
        'users', 'drivers', 'driver_documents', 'vehicle_types', 'pricing_rules',
        'vehicles', 'bookings', 'driver_ratings', 'saved_addresses', 'system_settings',
        'payment_systems', 'payment_options', 'invoices', 'payment_tokens',
        'contact_submissions', 'ride_credits', 'ride_credit_transactions',
        'booking_cancellations', 'cms_settings', 'cms_content', 'cms_media',
        'services', 'password_reset_tokens', 'driver_messages', 'emergency_incidents'
    ];
    tbl TEXT;
BEGIN
    FOREACH tbl IN ARRAY required_tables LOOP
        IF NOT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = tbl
        ) THEN
            missing_tables := array_append(missing_tables, tbl);
        END IF;
    END LOOP;
    
    IF array_length(missing_tables, 1) > 0 THEN
        RAISE WARNING 'Missing tables: %', missing_tables;
    ELSE
        RAISE NOTICE 'All required tables exist.';
    END IF;
END $$;

SELECT 'Schema update v1.0.4 completed successfully!' AS status;
