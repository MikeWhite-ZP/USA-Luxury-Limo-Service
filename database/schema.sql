-- USA Luxury Limo Database Schema
-- Manual Installation Script
-- PostgreSQL 14+

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- SESSION STORAGE (Required for Replit Auth and Express Sessions)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS sessions (
  sid VARCHAR PRIMARY KEY,
  sess JSONB NOT NULL,
  expire TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON sessions (expire);

-- ==============================================================================
-- USERS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  -- Local auth fields
  username VARCHAR UNIQUE,
  password VARCHAR,
  -- OAuth fields
  oauth_provider VARCHAR DEFAULT 'local' CHECK (oauth_provider IN ('local', 'google', 'apple')),
  oauth_id VARCHAR,
  -- User info
  email VARCHAR UNIQUE,
  first_name VARCHAR,
  last_name VARCHAR,
  profile_image_url VARCHAR,
  phone VARCHAR,
  role VARCHAR DEFAULT 'passenger' CHECK (role IN ('passenger', 'driver', 'dispatcher', 'admin')),
  is_active BOOLEAN DEFAULT true,
  pay_later_enabled BOOLEAN DEFAULT false,
  cash_payment_enabled BOOLEAN DEFAULT false,
  discount_type VARCHAR CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10, 2) DEFAULT 0,
  stripe_customer_id VARCHAR,
  stripe_subscription_id VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ==============================================================================
-- DRIVERS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
  is_available BOOLEAN DEFAULT false,
  current_location TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ==============================================================================
-- DRIVER DOCUMENTS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS driver_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
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

-- ==============================================================================
-- VEHICLE TYPES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS vehicle_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  description TEXT,
  passenger_capacity INTEGER NOT NULL,
  luggage_capacity VARCHAR,
  hourly_rate DECIMAL(10, 2) NOT NULL,
  per_mile_rate DECIMAL(10, 2),
  minimum_fare DECIMAL(10, 2),
  image_url VARCHAR,
  features JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ==============================================================================
-- PRICING RULES
-- ==============================================================================

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
  -- Common
  minimum_fare DECIMAL(10, 2),
  -- Advanced pricing
  gratuity_percent DECIMAL(5, 2) DEFAULT 20.00,
  airport_fees JSONB DEFAULT '[]'::jsonb,
  meet_and_greet JSONB DEFAULT '{"enabled": false, "charge": 0}'::jsonb,
  surge_pricing JSONB DEFAULT '[]'::jsonb,
  distance_tiers JSONB DEFAULT '[]'::jsonb,
  overtime_rate DECIMAL(10, 2),
  effective_start TIMESTAMP,
  effective_end TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS unique_vehicle_service ON pricing_rules (vehicle_type, service_type);

-- ==============================================================================
-- VEHICLES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_type_id UUID NOT NULL REFERENCES vehicle_types(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  make VARCHAR NOT NULL,
  model VARCHAR NOT NULL,
  year INTEGER NOT NULL,
  color VARCHAR,
  license_plate VARCHAR,
  vin VARCHAR,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ==============================================================================
-- BOOKINGS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  passenger_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  vehicle_type_id UUID NOT NULL REFERENCES vehicle_types(id),
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
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
  
  -- Payment
  payment_status VARCHAR DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_intent_id VARCHAR,
  
  -- Metadata
  special_instructions TEXT,
  passenger_count INTEGER DEFAULT 1,
  luggage_count INTEGER DEFAULT 0,
  baby_seat BOOLEAN DEFAULT false,
  
  -- Additional passenger info
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
  no_show BOOLEAN DEFAULT false,
  refund_invoice_sent BOOLEAN DEFAULT false,
  marked_completed_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ==============================================================================
-- DRIVER RATINGS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS driver_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  passenger_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ==============================================================================
-- SAVED ADDRESSES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS saved_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label VARCHAR NOT NULL,
  address TEXT NOT NULL,
  lat DECIMAL(10, 8),
  lon DECIMAL(11, 8),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ==============================================================================
-- SYSTEM SETTINGS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  is_encrypted BOOLEAN DEFAULT false,
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by VARCHAR REFERENCES users(id)
);

-- ==============================================================================
-- PAYMENT SYSTEMS
-- ==============================================================================

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

-- ==============================================================================
-- INVOICES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
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

-- ==============================================================================
-- PAYMENT TOKENS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS payment_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  token VARCHAR(64) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT false,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ==============================================================================
-- CONTACT SUBMISSIONS
-- ==============================================================================

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

-- ==============================================================================
-- CMS SETTINGS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS cms_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR UNIQUE NOT NULL,
  value TEXT,
  category VARCHAR NOT NULL CHECK (category IN ('branding', 'colors', 'social', 'contact', 'seo')),
  description TEXT,
  updated_by VARCHAR REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ==============================================================================
-- CMS CONTENT BLOCKS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS cms_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_type VARCHAR NOT NULL CHECK (block_type IN ('hero', 'about', 'services', 'contact', 'footer', 'testimonial')),
  identifier VARCHAR NOT NULL,
  title VARCHAR,
  content TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  updated_by VARCHAR REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS cms_content_block_identifier_idx ON cms_content (block_type, identifier);

-- ==============================================================================
-- CMS MEDIA LIBRARY
-- ==============================================================================

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

-- ==============================================================================
-- SERVICES (CMS-managed service cards for homepage)
-- ==============================================================================

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

-- ==============================================================================
-- PASSWORD RESET TOKENS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id),
  token VARCHAR NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ==============================================================================
-- DRIVER MESSAGES (Driver communications/messaging system)
-- ==============================================================================

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

-- ==============================================================================
-- EMERGENCY INCIDENTS
-- ==============================================================================

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

-- ==============================================================================
-- SCHEMA VERSION TRACKING
-- ==============================================================================

CREATE TABLE IF NOT EXISTS schema_version (
  id SERIAL PRIMARY KEY,
  version VARCHAR NOT NULL,
  applied_at TIMESTAMP DEFAULT NOW(),
  description TEXT
);

INSERT INTO schema_version (version, description) 
VALUES 
  ('1.0.0', 'Initial schema - USA Luxury Limo complete database'),
  ('1.1.0', 'Added CMS tables: cms_settings, cms_content (updated), cms_media with favicon support'),
  ('1.2.0', 'Added services, password_reset_tokens, driver_messages, emergency_incidents tables')
ON CONFLICT DO NOTHING;
