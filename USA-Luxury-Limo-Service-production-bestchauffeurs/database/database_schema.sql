-- USA Luxury Limo Database Schema
-- Complete database schema including all tables and relationships
-- Generated: 2025-11-17

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- SESSION STORAGE (Replit Auth Required)
-- ============================================

CREATE TABLE IF NOT EXISTS sessions (
  sid VARCHAR PRIMARY KEY,
  sess JSONB NOT NULL,
  expire TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions (expire);

-- ============================================
-- USER MANAGEMENT
-- ============================================

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  
  -- Local authentication
  username VARCHAR UNIQUE,
  password VARCHAR, -- hashed password for local auth
  
  -- OAuth fields
  oauth_provider VARCHAR DEFAULT 'local' CHECK (oauth_provider IN ('local', 'google', 'apple')),
  oauth_id VARCHAR, -- ID from OAuth provider
  
  -- User information
  email VARCHAR UNIQUE,
  first_name VARCHAR,
  last_name VARCHAR,
  profile_image_url VARCHAR,
  phone VARCHAR,
  role VARCHAR DEFAULT 'passenger' CHECK (role IN ('passenger', 'driver', 'dispatcher', 'admin')),
  is_active BOOLEAN DEFAULT true,
  
  -- Payment options
  pay_later_enabled BOOLEAN DEFAULT false,
  cash_payment_enabled BOOLEAN DEFAULT false,
  discount_type VARCHAR CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10, 2) DEFAULT 0,
  
  -- Stripe integration
  stripe_customer_id VARCHAR,
  stripe_subscription_id VARCHAR,
  
  -- GPS tracking for drivers
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  last_location_update TIMESTAMP,
  
  -- Password reset
  password_reset_token VARCHAR,
  password_reset_expires TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- DRIVER INFORMATION
-- ============================================

CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id),
  
  -- License information
  license_number VARCHAR,
  license_expiry TIMESTAMP,
  license_document_url VARCHAR,
  insurance_document_url VARCHAR,
  
  -- Vehicle and credentials
  vehicle_plate VARCHAR,
  driver_credentials VARCHAR,
  
  -- Verification status
  background_check_status VARCHAR DEFAULT 'pending' CHECK (background_check_status IN ('pending', 'approved', 'rejected')),
  verification_status VARCHAR DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  
  -- Performance metrics
  rating DECIMAL(3, 2) DEFAULT 0.00,
  total_rides INTEGER DEFAULT 0,
  
  -- Availability
  is_available BOOLEAN DEFAULT false,
  current_location TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Driver documents for verification
CREATE TABLE IF NOT EXISTS driver_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id),
  document_type VARCHAR NOT NULL CHECK (document_type IN ('driver_license', 'limo_license', 'insurance_certificate', 'vehicle_image', 'profile_photo')),
  document_url TEXT NOT NULL, -- Object storage URL
  expiration_date TIMESTAMP, -- For licenses
  vehicle_plate VARCHAR, -- For vehicle images
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  whatsapp_number VARCHAR, -- Only for driver profile
  uploaded_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  reviewed_by VARCHAR REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- VEHICLE MANAGEMENT
-- ============================================

-- Vehicle types and base information
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
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Advanced pricing rules
CREATE TABLE IF NOT EXISTS pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_type VARCHAR NOT NULL CHECK (vehicle_type IN ('business_sedan', 'business_suv', 'first_class_sedan', 'first_class_suv', 'business_van')),
  service_type VARCHAR NOT NULL CHECK (service_type IN ('transfer', 'hourly')),
  
  -- Transfer pricing
  base_rate DECIMAL(10, 2),
  per_mile_rate DECIMAL(10, 2),
  
  -- Hourly pricing
  hourly_rate DECIMAL(10, 2),
  minimum_hours INTEGER,
  
  -- Common pricing
  minimum_fare DECIMAL(10, 2),
  
  -- Advanced features
  gratuity_percent DECIMAL(5, 2) DEFAULT 20.00,
  airport_fees JSONB DEFAULT '[]'::jsonb, -- [{airportCode, fee, waiverMinutes}]
  meet_and_greet JSONB DEFAULT '{"enabled": false, "charge": 0}'::jsonb,
  surge_pricing JSONB DEFAULT '[]'::jsonb, -- [{dayOfWeek, startTime, endTime, multiplier}]
  distance_tiers JSONB DEFAULT '[]'::jsonb, -- [{miles, ratePerMile, isRemaining}]
  overtime_rate DECIMAL(10, 2),
  
  -- Effective date range
  effective_start TIMESTAMP,
  effective_end TIMESTAMP,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS unique_vehicle_service ON pricing_rules (vehicle_type, service_type);

-- Individual vehicles
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
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- BOOKING SYSTEM
-- ============================================

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
  
  -- Hourly booking
  requested_hours INTEGER,
  
  -- Pricing breakdown
  base_fare DECIMAL(10, 2),
  distance_fare DECIMAL(10, 2),
  time_fare DECIMAL(10, 2),
  gratuity_amount DECIMAL(10, 2),
  airport_fee_amount DECIMAL(10, 2),
  surge_pricing_multiplier DECIMAL(5, 2),
  surge_pricing_amount DECIMAL(10, 2),
  surcharges JSONB DEFAULT '[]'::jsonb, -- [{description, amount, addedBy, addedAt}]
  regular_price DECIMAL(10, 2),
  discount_percentage DECIMAL(5, 2),
  discount_amount DECIMAL(10, 2),
  total_amount DECIMAL(10, 2),
  driver_payment DECIMAL(10, 2),
  
  -- Payment
  payment_status VARCHAR DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_intent_id VARCHAR,
  
  -- Metadata
  special_instructions TEXT,
  passenger_count INTEGER DEFAULT 1,
  luggage_count INTEGER DEFAULT 0,
  baby_seat BOOLEAN DEFAULT false,
  
  -- Alternative passenger info
  booking_for VARCHAR DEFAULT 'self' CHECK (booking_for IN ('self', 'someone_else')),
  passenger_name VARCHAR,
  passenger_phone VARCHAR,
  passenger_email VARCHAR,
  
  -- Flight information
  flight_number VARCHAR,
  flight_name VARCHAR,
  flight_airline VARCHAR,
  flight_departure_airport VARCHAR,
  flight_arrival_airport VARCHAR,
  flight_departure VARCHAR,
  flight_arrival VARCHAR,
  no_flight_info BOOLEAN DEFAULT false,
  
  -- Journey tracking
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
  accepted_location JSONB, -- {lat, lng, timestamp}
  started_at TIMESTAMP,
  started_location JSONB,
  dod_at TIMESTAMP, -- Driver On Destination
  dod_location JSONB,
  pob_at TIMESTAMP, -- Passenger On Board
  pob_location JSONB,
  ended_at TIMESTAMP,
  ended_location JSONB,
  payment_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  cancel_reason TEXT,
  no_show BOOLEAN DEFAULT false,
  refund_invoice_sent BOOLEAN DEFAULT false,
  marked_completed_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Driver ratings
CREATE TABLE IF NOT EXISTS driver_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  driver_id UUID NOT NULL REFERENCES drivers(id),
  passenger_id VARCHAR NOT NULL REFERENCES users(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- USER PREFERENCES
-- ============================================

CREATE TABLE IF NOT EXISTS saved_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id),
  label VARCHAR NOT NULL,
  address TEXT NOT NULL,
  lat DECIMAL(10, 8),
  lon DECIMAL(11, 8),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- SYSTEM CONFIGURATION
-- ============================================

CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  is_encrypted BOOLEAN DEFAULT false,
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by VARCHAR REFERENCES users(id)
);

-- Payment systems configuration
CREATE TABLE IF NOT EXISTS payment_systems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR UNIQUE NOT NULL CHECK (provider IN ('stripe', 'paypal', 'square')),
  is_active BOOLEAN DEFAULT false,
  public_key TEXT,
  secret_key TEXT,
  webhook_secret TEXT,
  config JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- INVOICING
-- ============================================

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

-- Payment tokens for secure invoice links
CREATE TABLE IF NOT EXISTS payment_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id),
  token VARCHAR(64) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT false,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- CONTACT & SUPPORT
-- ============================================

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

-- ============================================
-- CMS - CONTENT MANAGEMENT SYSTEM
-- ============================================

-- CMS Settings (branding, colors, social, etc.)
CREATE TABLE IF NOT EXISTS cms_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR NOT NULL UNIQUE,
  value TEXT,
  category VARCHAR NOT NULL CHECK (category IN ('branding', 'colors', 'social', 'contact', 'seo')),
  description TEXT,
  updated_by VARCHAR REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- CMS Content Blocks
CREATE TABLE IF NOT EXISTS cms_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_type VARCHAR NOT NULL CHECK (block_type IN ('hero', 'about', 'services', 'contact', 'footer', 'testimonial')),
  identifier VARCHAR NOT NULL,
  title VARCHAR,
  content TEXT,
  metadata JSONB,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  updated_by VARCHAR REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- CMS Media Library
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

-- Services (homepage service cards)
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
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS services_slug_idx ON services (slug);

-- ============================================
-- SECURITY
-- ============================================

-- Password reset tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id),
  token VARCHAR NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- DRIVER COMMUNICATIONS
-- ============================================

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

-- ============================================
-- EMERGENCY MANAGEMENT
-- ============================================

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
  emergency_services_contacted BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- User indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_oauth ON users(oauth_provider, oauth_id);

-- Booking indexes
CREATE INDEX IF NOT EXISTS idx_bookings_passenger ON bookings(passenger_id);
CREATE INDEX IF NOT EXISTS idx_bookings_driver ON bookings(driver_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_scheduled ON bookings(scheduled_date_time);

-- Driver indexes
CREATE INDEX IF NOT EXISTS idx_drivers_user ON drivers(user_id);
CREATE INDEX IF NOT EXISTS idx_drivers_available ON drivers(is_available);

-- Invoice indexes
CREATE INDEX IF NOT EXISTS idx_invoices_booking ON invoices(booking_id);

-- Message indexes
CREATE INDEX IF NOT EXISTS idx_messages_driver ON driver_messages(driver_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON driver_messages(sender_id);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE sessions IS 'Session storage for Replit Auth (required)';
COMMENT ON TABLE users IS 'User accounts with multi-role support (passenger, driver, dispatcher, admin)';
COMMENT ON TABLE drivers IS 'Driver-specific information and verification status';
COMMENT ON TABLE driver_documents IS 'Driver document uploads for verification (license, insurance, photos, etc.)';
COMMENT ON TABLE vehicle_types IS 'Vehicle type catalog with base pricing';
COMMENT ON TABLE pricing_rules IS 'Advanced pricing rules with surge pricing, airport fees, distance tiers, etc.';
COMMENT ON TABLE bookings IS 'Booking records with complete journey tracking and pricing breakdown';
COMMENT ON TABLE cms_settings IS 'CMS settings for branding, colors, and site configuration';
COMMENT ON TABLE cms_content IS 'CMS content blocks for hero, about, services, etc.';
COMMENT ON TABLE cms_media IS 'Media library for uploaded images and files';
COMMENT ON TABLE services IS 'Service cards displayed on homepage';
COMMENT ON TABLE system_settings IS 'System-wide configuration settings (API keys, database URLs, etc.)';
COMMENT ON TABLE payment_systems IS 'Payment provider configurations (Stripe, PayPal, Square)';
COMMENT ON TABLE driver_messages IS 'Communication system for sending messages to drivers';
COMMENT ON TABLE emergency_incidents IS 'Emergency incident reporting and management';

-- ============================================
-- END OF SCHEMA
-- ============================================
