-- ============================================================================
-- USA Luxury Limo - Complete Database Schema Migration
-- Version: 1.0.4
-- Date: December 2024
-- Description: Comprehensive migration to bring all tenant databases to parity
--              with shared/schema.ts. Safe to run multiple times (idempotent).
-- ============================================================================

-- Enable UUID extension (idempotent)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- SESSIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS sessions (
    sid VARCHAR PRIMARY KEY,
    sess JSONB NOT NULL,
    expire TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON sessions(expire);

-- ============================================================================
-- USERS TABLE - Add all columns
-- ============================================================================
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'username') THEN
        ALTER TABLE users ADD COLUMN username VARCHAR UNIQUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password') THEN
        ALTER TABLE users ADD COLUMN password VARCHAR;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'oauth_provider') THEN
        ALTER TABLE users ADD COLUMN oauth_provider VARCHAR DEFAULT 'local';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'oauth_id') THEN
        ALTER TABLE users ADD COLUMN oauth_id VARCHAR;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email') THEN
        ALTER TABLE users ADD COLUMN email VARCHAR UNIQUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'first_name') THEN
        ALTER TABLE users ADD COLUMN first_name VARCHAR;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_name') THEN
        ALTER TABLE users ADD COLUMN last_name VARCHAR;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'profile_image_url') THEN
        ALTER TABLE users ADD COLUMN profile_image_url VARCHAR;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'phone') THEN
        ALTER TABLE users ADD COLUMN phone VARCHAR;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role') THEN
        ALTER TABLE users ADD COLUMN role VARCHAR DEFAULT 'passenger';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_active') THEN
        ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'pay_later_enabled') THEN
        ALTER TABLE users ADD COLUMN pay_later_enabled BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'cash_payment_enabled') THEN
        ALTER TABLE users ADD COLUMN cash_payment_enabled BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'discount_type') THEN
        ALTER TABLE users ADD COLUMN discount_type VARCHAR;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'discount_value') THEN
        ALTER TABLE users ADD COLUMN discount_value DECIMAL(10, 2) DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'stripe_customer_id') THEN
        ALTER TABLE users ADD COLUMN stripe_customer_id VARCHAR;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'stripe_subscription_id') THEN
        ALTER TABLE users ADD COLUMN stripe_subscription_id VARCHAR;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'latitude') THEN
        ALTER TABLE users ADD COLUMN latitude DECIMAL(10, 8);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'longitude') THEN
        ALTER TABLE users ADD COLUMN longitude DECIMAL(11, 8);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_location_update') THEN
        ALTER TABLE users ADD COLUMN last_location_update TIMESTAMP;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password_reset_token') THEN
        ALTER TABLE users ADD COLUMN password_reset_token VARCHAR;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password_reset_expires') THEN
        ALTER TABLE users ADD COLUMN password_reset_expires TIMESTAMP;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'created_at') THEN
        ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'updated_at') THEN
        ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
    END IF;
END $$;

-- ============================================================================
-- DRIVERS TABLE - Add all columns (nullable for existing data safety)
-- Note: Core columns like user_id should already exist from initial schema.
-- This migration adds newer columns that may be missing.
-- ============================================================================
DO $$ BEGIN
    -- user_id is a core column that should exist from initial schema
    -- If somehow missing, add as nullable to avoid breaking existing rows
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'user_id') THEN
        ALTER TABLE drivers ADD COLUMN user_id VARCHAR REFERENCES users(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'license_number') THEN
        ALTER TABLE drivers ADD COLUMN license_number VARCHAR;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'license_expiry') THEN
        ALTER TABLE drivers ADD COLUMN license_expiry TIMESTAMP;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'license_document_url') THEN
        ALTER TABLE drivers ADD COLUMN license_document_url VARCHAR;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'insurance_document_url') THEN
        ALTER TABLE drivers ADD COLUMN insurance_document_url VARCHAR;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'vehicle_plate') THEN
        ALTER TABLE drivers ADD COLUMN vehicle_plate VARCHAR;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'driver_credentials') THEN
        ALTER TABLE drivers ADD COLUMN driver_credentials VARCHAR;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'background_check_status') THEN
        ALTER TABLE drivers ADD COLUMN background_check_status VARCHAR DEFAULT 'pending';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'verification_status') THEN
        ALTER TABLE drivers ADD COLUMN verification_status VARCHAR DEFAULT 'pending';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'rating') THEN
        ALTER TABLE drivers ADD COLUMN rating DECIMAL(3, 2) DEFAULT 0.00;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'total_rides') THEN
        ALTER TABLE drivers ADD COLUMN total_rides INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'is_available') THEN
        ALTER TABLE drivers ADD COLUMN is_available BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'current_location') THEN
        ALTER TABLE drivers ADD COLUMN current_location TEXT;
    END IF;
    -- Tax information fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'tax_legal_first_name') THEN
        ALTER TABLE drivers ADD COLUMN tax_legal_first_name VARCHAR;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'tax_legal_last_name') THEN
        ALTER TABLE drivers ADD COLUMN tax_legal_last_name VARCHAR;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'tax_ssn_encrypted') THEN
        ALTER TABLE drivers ADD COLUMN tax_ssn_encrypted TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'tax_ssn_last4') THEN
        ALTER TABLE drivers ADD COLUMN tax_ssn_last4 VARCHAR(4);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'tax_date_of_birth') THEN
        ALTER TABLE drivers ADD COLUMN tax_date_of_birth TIMESTAMP;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'tax_address_street') THEN
        ALTER TABLE drivers ADD COLUMN tax_address_street VARCHAR;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'tax_address_city') THEN
        ALTER TABLE drivers ADD COLUMN tax_address_city VARCHAR;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'tax_address_state') THEN
        ALTER TABLE drivers ADD COLUMN tax_address_state VARCHAR(2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'tax_address_zip') THEN
        ALTER TABLE drivers ADD COLUMN tax_address_zip VARCHAR(10);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'tax_classification') THEN
        ALTER TABLE drivers ADD COLUMN tax_classification VARCHAR DEFAULT 'individual';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'tax_info_completed_at') THEN
        ALTER TABLE drivers ADD COLUMN tax_info_completed_at TIMESTAMP;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'created_at') THEN
        ALTER TABLE drivers ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'updated_at') THEN
        ALTER TABLE drivers ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
    END IF;
END $$;

-- ============================================================================
-- DRIVER_DOCUMENTS TABLE - Add all columns
-- ============================================================================
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'driver_documents' AND column_name = 'whatsapp_number') THEN
        ALTER TABLE driver_documents ADD COLUMN whatsapp_number VARCHAR;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'driver_documents' AND column_name = 'vehicle_plate') THEN
        ALTER TABLE driver_documents ADD COLUMN vehicle_plate VARCHAR;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'driver_documents' AND column_name = 'reviewed_at') THEN
        ALTER TABLE driver_documents ADD COLUMN reviewed_at TIMESTAMP;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'driver_documents' AND column_name = 'reviewed_by') THEN
        ALTER TABLE driver_documents ADD COLUMN reviewed_by VARCHAR REFERENCES users(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'driver_documents' AND column_name = 'created_at') THEN
        ALTER TABLE driver_documents ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'driver_documents' AND column_name = 'updated_at') THEN
        ALTER TABLE driver_documents ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
    END IF;
END $$;

-- ============================================================================
-- VEHICLE_TYPES TABLE - Add all columns
-- ============================================================================
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicle_types' AND column_name = 'features') THEN
        ALTER TABLE vehicle_types ADD COLUMN features JSONB;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicle_types' AND column_name = 'image_url') THEN
        ALTER TABLE vehicle_types ADD COLUMN image_url VARCHAR;
    END IF;
END $$;

-- ============================================================================
-- PRICING_RULES TABLE - Add all columns
-- ============================================================================
DO $$ BEGIN
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
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pricing_rules' AND column_name = 'updated_at') THEN
        ALTER TABLE pricing_rules ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
    END IF;
END $$;

-- ============================================================================
-- BOOKINGS TABLE - Add ALL columns
-- ============================================================================
DO $$ BEGIN
    -- Trip details
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'via_points') THEN
        ALTER TABLE bookings ADD COLUMN via_points JSONB;
    END IF;
    
    -- Pricing columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'base_fare') THEN
        ALTER TABLE bookings ADD COLUMN base_fare DECIMAL(10, 2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'distance_fare') THEN
        ALTER TABLE bookings ADD COLUMN distance_fare DECIMAL(10, 2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'time_fare') THEN
        ALTER TABLE bookings ADD COLUMN time_fare DECIMAL(10, 2);
    END IF;
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
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'surcharges') THEN
        ALTER TABLE bookings ADD COLUMN surcharges JSONB DEFAULT '[]'::jsonb;
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
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'total_amount') THEN
        ALTER TABLE bookings ADD COLUMN total_amount DECIMAL(10, 2);
    END IF;
    
    -- Driver payment columns
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
    
    -- Payment columns (no CHECK constraints to avoid breaking existing data)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'payment_status') THEN
        ALTER TABLE bookings ADD COLUMN payment_status VARCHAR DEFAULT 'pending';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'payment_intent_id') THEN
        ALTER TABLE bookings ADD COLUMN payment_intent_id VARCHAR;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'payment_method') THEN
        ALTER TABLE bookings ADD COLUMN payment_method VARCHAR DEFAULT 'pay_now';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'credit_amount_applied') THEN
        ALTER TABLE bookings ADD COLUMN credit_amount_applied DECIMAL(10, 2);
    END IF;
    
    -- Passenger metadata
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'passenger_count') THEN
        ALTER TABLE bookings ADD COLUMN passenger_count INTEGER DEFAULT 1;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'luggage_count') THEN
        ALTER TABLE bookings ADD COLUMN luggage_count INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'baby_seat') THEN
        ALTER TABLE bookings ADD COLUMN baby_seat BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'special_instructions') THEN
        ALTER TABLE bookings ADD COLUMN special_instructions TEXT;
    END IF;
    
    -- Additional passenger info (no CHECK constraints to avoid breaking existing data)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'booking_for') THEN
        ALTER TABLE bookings ADD COLUMN booking_for VARCHAR DEFAULT 'self';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'passenger_name') THEN
        ALTER TABLE bookings ADD COLUMN passenger_name VARCHAR;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'passenger_phone') THEN
        ALTER TABLE bookings ADD COLUMN passenger_phone VARCHAR;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'passenger_email') THEN
        ALTER TABLE bookings ADD COLUMN passenger_email VARCHAR;
    END IF;
    
    -- Flight details
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'flight_number') THEN
        ALTER TABLE bookings ADD COLUMN flight_number VARCHAR;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'flight_name') THEN
        ALTER TABLE bookings ADD COLUMN flight_name VARCHAR;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'flight_airline') THEN
        ALTER TABLE bookings ADD COLUMN flight_airline VARCHAR;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'flight_departure_airport') THEN
        ALTER TABLE bookings ADD COLUMN flight_departure_airport VARCHAR;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'flight_arrival_airport') THEN
        ALTER TABLE bookings ADD COLUMN flight_arrival_airport VARCHAR;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'flight_departure') THEN
        ALTER TABLE bookings ADD COLUMN flight_departure VARCHAR;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'flight_arrival') THEN
        ALTER TABLE bookings ADD COLUMN flight_arrival VARCHAR;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'no_flight_info') THEN
        ALTER TABLE bookings ADD COLUMN no_flight_info BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Journey tracking fields (no CHECK constraints to avoid breaking existing data)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'booked_by') THEN
        ALTER TABLE bookings ADD COLUMN booked_by VARCHAR;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'booked_at') THEN
        ALTER TABLE bookings ADD COLUMN booked_at TIMESTAMP;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'confirmed_at') THEN
        ALTER TABLE bookings ADD COLUMN confirmed_at TIMESTAMP;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'assigned_at') THEN
        ALTER TABLE bookings ADD COLUMN assigned_at TIMESTAMP;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'accepted_at') THEN
        ALTER TABLE bookings ADD COLUMN accepted_at TIMESTAMP;
    END IF;
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
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'accepted_location') THEN
        ALTER TABLE bookings ADD COLUMN accepted_location JSONB;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'started_at') THEN
        ALTER TABLE bookings ADD COLUMN started_at TIMESTAMP;
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
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'ended_at') THEN
        ALTER TABLE bookings ADD COLUMN ended_at TIMESTAMP;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'ended_location') THEN
        ALTER TABLE bookings ADD COLUMN ended_location JSONB;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'payment_at') THEN
        ALTER TABLE bookings ADD COLUMN payment_at TIMESTAMP;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'cancelled_at') THEN
        ALTER TABLE bookings ADD COLUMN cancelled_at TIMESTAMP;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'cancel_reason') THEN
        ALTER TABLE bookings ADD COLUMN cancel_reason TEXT;
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
    
    -- Invoice and billing fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'bill_reference') THEN
        ALTER TABLE bookings ADD COLUMN bill_reference VARCHAR(100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'actual_pickup_time') THEN
        ALTER TABLE bookings ADD COLUMN actual_pickup_time TIMESTAMP;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'actual_dropoff_time') THEN
        ALTER TABLE bookings ADD COLUMN actual_dropoff_time TIMESTAMP;
    END IF;
    
    -- Timestamps
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'created_at') THEN
        ALTER TABLE bookings ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'updated_at') THEN
        ALTER TABLE bookings ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
    END IF;
END $$;

-- Update booking status constraint
DO $$ BEGIN
    ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
    ALTER TABLE bookings ADD CONSTRAINT bookings_status_check 
        CHECK (status IN ('pending', 'pending_driver_acceptance', 'confirmed', 'on_the_way', 'arrived', 'on_board', 'in_progress', 'completed', 'cancelled'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- INVOICES TABLE - Add all columns
-- ============================================================================
DO $$ BEGIN
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
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'subtotal') THEN
        ALTER TABLE invoices ADD COLUMN subtotal DECIMAL(10, 2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'discount_percentage') THEN
        ALTER TABLE invoices ADD COLUMN discount_percentage DECIMAL(5, 2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'discount_amount') THEN
        ALTER TABLE invoices ADD COLUMN discount_amount DECIMAL(10, 2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'tax_amount') THEN
        ALTER TABLE invoices ADD COLUMN tax_amount DECIMAL(10, 2) DEFAULT 0.00;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'total_amount') THEN
        ALTER TABLE invoices ADD COLUMN total_amount DECIMAL(10, 2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'paid_at') THEN
        ALTER TABLE invoices ADD COLUMN paid_at TIMESTAMP;
    END IF;
END $$;

-- ============================================================================
-- CREATE TABLES IF NOT EXISTS
-- ============================================================================

-- Payment Tokens
CREATE TABLE IF NOT EXISTS payment_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id),
    token VARCHAR(64) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Ride Credits
CREATE TABLE IF NOT EXISTS ride_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL UNIQUE REFERENCES users(id),
    balance DECIMAL(10, 2) DEFAULT 0.00 NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Ride Credit Transactions
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

-- Booking Cancellations
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

-- CMS Settings
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

-- CMS Content
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

-- CMS Media
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

-- Services
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

-- Password Reset Tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES users(id),
    token VARCHAR NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Driver Messages
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

-- Emergency Incidents
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
-- CREATE ALL PERFORMANCE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_drivers_user_id ON drivers(user_id);
CREATE INDEX IF NOT EXISTS idx_drivers_verification_status ON drivers(verification_status);
CREATE INDEX IF NOT EXISTS idx_driver_documents_driver_id ON driver_documents(driver_id);
CREATE INDEX IF NOT EXISTS idx_bookings_passenger_id ON bookings(passenger_id);
CREATE INDEX IF NOT EXISTS idx_bookings_driver_id ON bookings(driver_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_scheduled_date ON bookings(scheduled_date_time);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_invoices_booking_id ON invoices(booking_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_payment_tokens_invoice_id ON payment_tokens(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_tokens_token ON payment_tokens(token);
CREATE INDEX IF NOT EXISTS idx_ride_credits_user_id ON ride_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_ride_credit_transactions_user_id ON ride_credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_ride_credit_transactions_booking_id ON ride_credit_transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_cancellations_booking_id ON booking_cancellations(booking_id);
CREATE INDEX IF NOT EXISTS idx_driver_ratings_booking_id ON driver_ratings(booking_id);
CREATE INDEX IF NOT EXISTS idx_driver_ratings_driver_id ON driver_ratings(driver_id);
CREATE INDEX IF NOT EXISTS idx_emergency_incidents_booking_id ON emergency_incidents(booking_id);
CREATE INDEX IF NOT EXISTS idx_emergency_incidents_status ON emergency_incidents(status);
CREATE INDEX IF NOT EXISTS idx_cms_settings_key ON cms_settings(key);
CREATE INDEX IF NOT EXISTS idx_cms_settings_category ON cms_settings(category);
CREATE INDEX IF NOT EXISTS idx_cms_media_folder ON cms_media(folder);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_saved_addresses_user_id ON saved_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_driver_id ON vehicles(driver_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_vehicle_type_id ON vehicles(vehicle_type_id);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_vehicle_service ON pricing_rules(vehicle_type, service_type);

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
        'sessions', 'users', 'drivers', 'driver_documents', 'vehicle_types', 
        'pricing_rules', 'vehicles', 'bookings', 'driver_ratings', 'saved_addresses', 
        'system_settings', 'payment_systems', 'payment_options', 'invoices', 
        'payment_tokens', 'contact_submissions', 'ride_credits', 'ride_credit_transactions',
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
        RAISE NOTICE 'All 26 required tables exist.';
    END IF;
END $$;

SELECT 'Schema migration v1.0.4 completed successfully!' AS status;
