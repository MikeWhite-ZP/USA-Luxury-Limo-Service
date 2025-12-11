-- ============================================================================
-- USA Luxury Limo - Tenant Database Schema
-- Version: 1.0.0
-- Description: Complete database schema for new tenant deployments
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- SESSIONS TABLE (Required for Auth)
-- ============================================================================
CREATE TABLE IF NOT EXISTS sessions (
    sid VARCHAR PRIMARY KEY,
    sess JSONB NOT NULL,
    expire TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON sessions(expire);

-- ============================================================================
-- USERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
    username VARCHAR UNIQUE,
    password VARCHAR,
    oauth_provider VARCHAR DEFAULT 'local' CHECK (oauth_provider IN ('local', 'google', 'apple')),
    oauth_id VARCHAR,
    email VARCHAR UNIQUE,
    first_name VARCHAR,
    last_name VARCHAR,
    profile_image_url VARCHAR,
    phone VARCHAR,
    role VARCHAR DEFAULT 'passenger' CHECK (role IN ('passenger', 'driver', 'dispatcher', 'admin')),
    is_active BOOLEAN DEFAULT TRUE,
    pay_later_enabled BOOLEAN DEFAULT FALSE,
    cash_payment_enabled BOOLEAN DEFAULT FALSE,
    discount_type VARCHAR CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10, 2) DEFAULT 0,
    stripe_customer_id VARCHAR,
    stripe_subscription_id VARCHAR,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    last_location_update TIMESTAMP,
    password_reset_token VARCHAR,
    password_reset_expires TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- DRIVERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES users(id),
    license_number VARCHAR,
    license_expiry TIMESTAMP,
    license_document_url VARCHAR,
    insurance_document_url VARCHAR,
    vehicle_plate VARCHAR,
    driver_credentials VARCHAR,
    background_check_status VARCHAR DEFAULT 'pending' CHECK (background_check_status IN ('pending', 'approved', 'rejected')),
    verification_status VARCHAR DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    rating DECIMAL(3, 2) DEFAULT 0.00,
    total_rides INTEGER DEFAULT 0,
    is_available BOOLEAN DEFAULT FALSE,
    current_location TEXT,
    tax_legal_first_name VARCHAR,
    tax_legal_last_name VARCHAR,
    tax_ssn_encrypted TEXT,
    tax_ssn_last4 VARCHAR(4),
    tax_date_of_birth TIMESTAMP,
    tax_address_street VARCHAR,
    tax_address_city VARCHAR,
    tax_address_state VARCHAR(2),
    tax_address_zip VARCHAR(10),
    tax_classification VARCHAR DEFAULT 'individual' CHECK (tax_classification IN ('individual', 'sole_proprietor', 'llc', 'corporation', 'partnership')),
    tax_info_completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- DRIVER DOCUMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS driver_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES drivers(id),
    document_type VARCHAR NOT NULL CHECK (document_type IN ('driver_license', 'limo_license', 'insurance_certificate', 'vehicle_image', 'profile_photo')),
    document_url TEXT NOT NULL,
    expiration_date TIMESTAMP,
    vehicle_plate VARCHAR,
    status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    whatsapp_number VARCHAR,
    uploaded_at TIMESTAMP DEFAULT NOW(),
    reviewed_at TIMESTAMP,
    reviewed_by VARCHAR REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- VEHICLE TYPES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS vehicle_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    description TEXT,
    passenger_capacity INTEGER NOT NULL,
    luggage_capacity VARCHAR,
    hourly_rate DECIMAL(10, 2),
    per_mile_rate DECIMAL(10, 2),
    minimum_fare DECIMAL(10, 2),
    image_url VARCHAR,
    features JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- PRICING RULES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS pricing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_type VARCHAR NOT NULL CHECK (vehicle_type IN ('business_sedan', 'business_suv', 'first_class_sedan', 'first_class_suv', 'business_van')),
    service_type VARCHAR NOT NULL CHECK (service_type IN ('transfer', 'hourly')),
    base_rate DECIMAL(10, 2),
    per_mile_rate DECIMAL(10, 2),
    hourly_rate DECIMAL(10, 2),
    minimum_hours INTEGER,
    minimum_fare DECIMAL(10, 2),
    gratuity_percent DECIMAL(5, 2) DEFAULT 20.00,
    airport_fees JSONB DEFAULT '[]'::jsonb,
    meet_and_greet JSONB DEFAULT '{"enabled": false, "charge": 0}'::jsonb,
    surge_pricing JSONB DEFAULT '[]'::jsonb,
    distance_tiers JSONB DEFAULT '[]'::jsonb,
    overtime_rate DECIMAL(10, 2),
    effective_start TIMESTAMP,
    effective_end TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (vehicle_type, service_type)
);

-- ============================================================================
-- VEHICLES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_type_id UUID NOT NULL REFERENCES vehicle_types(id),
    driver_id UUID REFERENCES drivers(id),
    make VARCHAR NOT NULL,
    model VARCHAR NOT NULL,
    year INTEGER NOT NULL,
    color VARCHAR,
    license_plate VARCHAR,
    vin VARCHAR,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- BOOKINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    passenger_id VARCHAR NOT NULL REFERENCES users(id),
    driver_id UUID REFERENCES drivers(id),
    vehicle_type_id UUID NOT NULL REFERENCES vehicle_types(id),
    vehicle_id UUID REFERENCES vehicles(id),
    booking_type VARCHAR NOT NULL CHECK (booking_type IN ('transfer', 'hourly')),
    status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'pending_driver_acceptance', 'confirmed', 'on_the_way', 'arrived', 'on_board', 'in_progress', 'completed', 'cancelled')),
    
    -- Trip details
    pickup_address TEXT NOT NULL,
    pickup_lat DECIMAL(10, 8),
    pickup_lon DECIMAL(11, 8),
    destination_address TEXT,
    destination_lat DECIMAL(10, 8),
    destination_lon DECIMAL(11, 8),
    via_points JSONB,
    
    -- Scheduling
    scheduled_date_time TIMESTAMP NOT NULL,
    estimated_duration INTEGER,
    estimated_distance DECIMAL(8, 2),
    
    -- Hourly booking specifics
    requested_hours INTEGER,
    
    -- Pricing
    base_fare DECIMAL(10, 2),
    distance_fare DECIMAL(10, 2),
    time_fare DECIMAL(10, 2),
    gratuity_amount DECIMAL(10, 2),
    airport_fee_amount DECIMAL(10, 2),
    surge_pricing_multiplier DECIMAL(5, 2),
    surge_pricing_amount DECIMAL(10, 2),
    surcharges JSONB DEFAULT '[]'::jsonb,
    regular_price DECIMAL(10, 2),
    discount_percentage DECIMAL(5, 2),
    discount_amount DECIMAL(10, 2),
    total_amount DECIMAL(10, 2),
    driver_payment DECIMAL(10, 2),
    driver_payment_paid BOOLEAN DEFAULT FALSE,
    driver_payment_paid_at TIMESTAMP,
    driver_payment_paid_by VARCHAR,
    
    -- Payment
    payment_status VARCHAR DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    payment_intent_id VARCHAR,
    payment_method VARCHAR DEFAULT 'pay_now' CHECK (payment_method IN ('pay_now', 'pay_later', 'cash', 'ride_credit')),
    credit_amount_applied DECIMAL(10, 2),
    
    -- Metadata
    special_instructions TEXT,
    passenger_count INTEGER DEFAULT 1,
    luggage_count INTEGER DEFAULT 0,
    baby_seat BOOLEAN DEFAULT FALSE,
    
    -- Additional passenger information
    booking_for VARCHAR DEFAULT 'self' CHECK (booking_for IN ('self', 'someone_else')),
    passenger_name VARCHAR,
    passenger_phone VARCHAR,
    passenger_email VARCHAR,
    
    -- Flight details
    flight_number VARCHAR,
    flight_name VARCHAR,
    flight_airline VARCHAR,
    flight_departure_airport VARCHAR,
    flight_arrival_airport VARCHAR,
    flight_departure VARCHAR,
    flight_arrival VARCHAR,
    no_flight_info BOOLEAN DEFAULT FALSE,
    
    -- Journey tracking fields
    booked_by VARCHAR CHECK (booked_by IN ('admin', 'passenger')),
    booked_at TIMESTAMP,
    confirmed_at TIMESTAMP,
    assigned_at TIMESTAMP,
    accepted_at TIMESTAMP,
    reminder_sent_at TIMESTAMP,
    on_the_way_at TIMESTAMP,
    arrived_at TIMESTAMP,
    on_board_at TIMESTAMP,
    auto_cancelled_at TIMESTAMP,
    accepted_location JSONB,
    started_at TIMESTAMP,
    started_location JSONB,
    dod_at TIMESTAMP,
    dod_location JSONB,
    pob_at TIMESTAMP,
    pob_location JSONB,
    ended_at TIMESTAMP,
    ended_location JSONB,
    payment_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    cancel_reason TEXT,
    no_show BOOLEAN DEFAULT FALSE,
    refund_invoice_sent BOOLEAN DEFAULT FALSE,
    marked_completed_at TIMESTAMP,
    
    -- Invoice and billing fields
    bill_reference VARCHAR(100),
    actual_pickup_time TIMESTAMP,
    actual_dropoff_time TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- DRIVER RATINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS driver_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id),
    driver_id UUID NOT NULL REFERENCES drivers(id),
    passenger_id VARCHAR NOT NULL REFERENCES users(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- SAVED ADDRESSES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS saved_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES users(id),
    label VARCHAR NOT NULL,
    address TEXT NOT NULL,
    lat DECIMAL(10, 8),
    lon DECIMAL(11, 8),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- SYSTEM SETTINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    is_encrypted BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT NOW(),
    updated_by VARCHAR REFERENCES users(id)
);

-- ============================================================================
-- PAYMENT SYSTEMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS payment_systems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider VARCHAR UNIQUE NOT NULL CHECK (provider IN ('stripe', 'paypal', 'square')),
    is_active BOOLEAN DEFAULT FALSE,
    public_key TEXT,
    secret_key TEXT,
    webhook_secret TEXT,
    config JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- PAYMENT OPTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS payment_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    option_type VARCHAR UNIQUE NOT NULL CHECK (option_type IN ('credit_card', 'pay_later', 'cash', 'ride_credit')),
    display_name VARCHAR NOT NULL,
    description TEXT,
    is_enabled BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- INVOICES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id),
    invoice_number VARCHAR UNIQUE NOT NULL,
    base_fare DECIMAL(10, 2),
    gratuity_amount DECIMAL(10, 2),
    airport_fee_amount DECIMAL(10, 2),
    surge_pricing_multiplier DECIMAL(5, 2),
    surge_pricing_amount DECIMAL(10, 2),
    subtotal DECIMAL(10, 2) NOT NULL,
    discount_percentage DECIMAL(5, 2),
    discount_amount DECIMAL(10, 2),
    tax_amount DECIMAL(10, 2) DEFAULT 0.00,
    total_amount DECIMAL(10, 2) NOT NULL,
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- PAYMENT TOKENS TABLE
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
-- CONTACT SUBMISSIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS contact_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR NOT NULL,
    last_name VARCHAR NOT NULL,
    email VARCHAR NOT NULL,
    phone VARCHAR,
    service_type VARCHAR,
    message TEXT NOT NULL,
    status VARCHAR DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'resolved')),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- RIDE CREDITS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS ride_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL UNIQUE REFERENCES users(id),
    balance DECIMAL(10, 2) DEFAULT 0.00 NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- RIDE CREDIT TRANSACTIONS TABLE
-- ============================================================================
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
-- BOOKING CANCELLATIONS TABLE
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
-- CMS SETTINGS TABLE
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

-- ============================================================================
-- CMS CONTENT TABLE
-- ============================================================================
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

-- ============================================================================
-- CMS MEDIA TABLE
-- ============================================================================
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
-- SERVICES TABLE
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
-- PASSWORD RESET TOKENS TABLE
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
-- DRIVER MESSAGES TABLE
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
-- EMERGENCY INCIDENTS TABLE
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
-- PERFORMANCE INDEXES
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
CREATE INDEX IF NOT EXISTS idx_invoices_booking_id ON invoices(booking_id);
CREATE INDEX IF NOT EXISTS idx_ride_credits_user_id ON ride_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_ride_credit_transactions_user_id ON ride_credit_transactions(user_id);

-- ============================================================================
-- DEFAULT DATA
-- ============================================================================

-- Insert default payment options
INSERT INTO payment_options (option_type, display_name, description, is_enabled, sort_order) VALUES
('credit_card', 'Credit Card', 'Pay securely with your credit or debit card', true, 1),
('pay_later', 'Pay Later', 'Pay after your ride is completed', false, 2),
('cash', 'Cash', 'Pay in cash to the driver', false, 3),
('ride_credit', 'Ride Credit', 'Use your ride credit balance', true, 4)
ON CONFLICT (option_type) DO NOTHING;

-- Insert default vehicle types
INSERT INTO vehicle_types (name, description, passenger_capacity, luggage_capacity, hourly_rate, per_mile_rate, minimum_fare, is_active) VALUES
('Business Sedan', 'Comfortable sedan for business travel', 3, '2 large, 2 small', 75.00, 3.50, 75.00, true),
('Business SUV', 'Spacious SUV for groups', 6, '4 large, 4 small', 95.00, 4.50, 95.00, true),
('First Class Sedan', 'Premium luxury sedan', 3, '2 large, 2 small', 125.00, 5.50, 125.00, true),
('First Class SUV', 'Premium luxury SUV', 6, '4 large, 4 small', 150.00, 6.50, 150.00, true),
('Business Van', 'Large capacity van', 10, '10 large, 10 small', 175.00, 7.50, 175.00, true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- GRANT PERMISSIONS (if using separate app user)
-- ============================================================================
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO app_user;

SELECT 'Schema creation completed successfully!' AS status;
