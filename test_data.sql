-- USA Luxury Limo Test Data
-- Sample data for development and testing purposes
-- Generated: 2025-11-17
-- NOTE: This file contains test data only. Sensitive credentials are excluded.

-- ============================================
-- USERS - Test Accounts
-- ============================================

-- Test Passenger (90% discount enabled)
INSERT INTO users (id, username, email, first_name, last_name, phone, role, is_active, pay_later_enabled, cash_payment_enabled, discount_type, discount_value, oauth_provider)
VALUES 
('e9888fb7-a993-4e53-a188-c5c557a6e489', 'testpassenger', 'usaluxurylimo+TestPassenger@gmail.com', 'Test', 'Passenger', '8325629281', 'passenger', true, true, true, 'percentage', 90.00, 'local')
ON CONFLICT (id) DO NOTHING;

-- Test Driver
INSERT INTO users (id, username, email, first_name, last_name, phone, role, is_active, oauth_provider)
VALUES 
('170c1fae-4066-444a-bb9e-266065543639', 'testdriver', 'usaluxurylimo+testdriver@gmail.com', 'Test', 'Driver', '+18324796515', 'driver', true, 'local')
ON CONFLICT (id) DO NOTHING;

-- Test Dispatcher
INSERT INTO users (id, username, email, first_name, last_name, role, is_active, oauth_provider)
VALUES 
('a62c27de-ac7d-4005-9c2f-9cf7433f6e87', 'testdispatcher', 'testdispatcher@usaluxurylimo.com', 'Test', 'Dispatcher', 'dispatcher', true, 'local')
ON CONFLICT (id) DO NOTHING;

-- Test Admin
INSERT INTO users (id, username, email, first_name, last_name, role, is_active, oauth_provider)
VALUES 
('312afc88-c8c2-4a3a-a249-a8a3af31d2ca', 'mikeadmin2', 'ZANANPALAOGLU@gmail.com', 'Mike', 'White', 'admin', true, 'local')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- VEHICLE TYPES
-- ============================================

INSERT INTO vehicle_types (id, name, description, passenger_capacity, luggage_capacity, hourly_rate, per_mile_rate, minimum_fare, image_url, features, is_active)
VALUES 
(
  '132abd1b-22fc-4116-afcd-b50ee13b19bd',
  'Business Sedan',
  'Luxury sedan for professional transport',
  3,
  '2 Large, 2 Carry-on',
  91.96,
  2.75,
  85.00,
  '/cms/vehicles/cms-vehicles-1763186622207.webp',
  '["Professional driver", "Luxury interior", "Air conditioning", "Complimentary water"]'::jsonb,
  true
),
(
  'ece7c67a-927e-4682-81ce-196b9b4ee5d6',
  'Business SUV',
  'Spacious SUV for comfort and style',
  6,
  '4 Large, 4 Carry-on',
  110.26,
  3.25,
  105.00,
  '/cms/vehicles/cms-vehicles-1763186650408.webp',
  '["Professional driver", "Luxury interior", "Air conditioning", "Extra space", "Complimentary water"]'::jsonb,
  true
),
(
  'eec7edbc-3407-4122-afff-6d104c4a813e',
  'First-Class SUV',
  'Premium SUV for luxury group travel',
  5,
  '4 Large, 4 Carry-on',
  120.56,
  3.75,
  125.00,
  '/cms/vehicles/cms-vehicles-1763186668659.png',
  '["Professional driver", "Luxury interior", "Premium amenities", "Extra space", "Refreshments", "Wi-Fi"]'::jsonb,
  true
),
(
  '031614f5-b49f-4799-b92d-215281e1328f',
  'First-Class Sedan',
  'Premium sedan with enhanced amenities',
  3,
  '2 Large, 2 Carry-on',
  170.56,
  4.50,
  180.00,
  '/cms/vehicles/cms-vehicles-1763186685108.webp',
  '["Professional driver", "Luxury interior", "Premium amenities", "Refreshments", "Wi-Fi", "Phone chargers"]'::jsonb,
  true
),
(
  '89e09c72-5baf-45c6-8233-bb42e34b6f7b',
  'Business VAN',
  'Large van for group transportation',
  10,
  '8 Large, 8 Carry-on',
  175.00,
  4.25,
  200.00,
  '/cms/vehicles/cms-vehicles-1763186699748.webp',
  '["Professional driver", "Luxury interior", "Group travel", "Extra luggage space", "Wi-Fi", "Entertainment system"]'::jsonb,
  true
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- PRICING RULES
-- ============================================

-- Business Sedan - Hourly
INSERT INTO pricing_rules (id, vehicle_type, service_type, hourly_rate, minimum_hours, gratuity_percent, airport_fees, meet_and_greet, surge_pricing, distance_tiers, overtime_rate, is_active)
VALUES (
  '27af3c40-f6c0-4797-90fd-57f30875e12a',
  'business_sedan',
  'hourly',
  91.96,
  2,
  0.00,
  '[{"fee": 0, "airportCode": "IAH", "waiverMinutes": 60}, {"fee": 0, "airportCode": "HOU", "waiverMinutes": 60}]'::jsonb,
  '{"charge": 0, "enabled": false}'::jsonb,
  '[{"endTime": "18:00", "dayOfWeek": -1, "startTime": "16:00", "multiplier": 1.1}]'::jsonb,
  '[]'::jsonb,
  91.96,
  true
)
ON CONFLICT (vehicle_type, service_type) DO NOTHING;

-- Business Sedan - Transfer
INSERT INTO pricing_rules (id, vehicle_type, service_type, base_rate, minimum_fare, gratuity_percent, airport_fees, meet_and_greet, surge_pricing, distance_tiers, is_active)
VALUES (
  '79211386-cb3c-4283-92cd-b47cd639f572',
  'business_sedan',
  'transfer',
  113.49,
  113.49,
  0.00,
  '[{"fee": 8, "airportCode": "IAH", "waiverMinutes": 60}, {"fee": 5, "airportCode": "HOU", "waiverMinutes": 60}]'::jsonb,
  '{"charge": 0, "enabled": false}'::jsonb,
  '[{"endTime": "18:00", "dayOfWeek": -1, "startTime": "16:00", "multiplier": 1.1}]'::jsonb,
  '[{"miles": 20, "ratePerMile": 0}, {"miles": 4.45, "ratePerMile": 0.97}, {"miles": 1.41, "ratePerMile": 2.59}, {"miles": 5, "ratePerMile": 2.35}, {"miles": 5, "ratePerMile": 2.31}, {"miles": 5, "ratePerMile": 2.25}, {"miles": 5, "ratePerMile": 2.31}, {"miles": 5, "ratePerMile": 2.05}, {"miles": 5, "ratePerMile": 2.09}, {"miles": 5, "ratePerMile": 2.15}, {"miles": 5, "ratePerMile": 2.25}, {"miles": 20, "ratePerMile": 2.35}, {"miles": 25, "ratePerMile": 2.45}, {"miles": 0, "isRemaining": true, "ratePerMile": 3.75}]'::jsonb,
  true
)
ON CONFLICT (vehicle_type, service_type) DO NOTHING;

-- Business SUV - Hourly
INSERT INTO pricing_rules (id, vehicle_type, service_type, hourly_rate, minimum_hours, gratuity_percent, airport_fees, meet_and_greet, surge_pricing, distance_tiers, is_active)
VALUES (
  '04ea7083-c546-4b5c-9d30-c4a36654ec8e',
  'business_suv',
  'hourly',
  110.26,
  2,
  0.00,
  '[{"fee": 0, "airportCode": "IAH", "waiverMinutes": 60}, {"fee": 0, "airportCode": "HOU", "waiverMinutes": 60}]'::jsonb,
  '{"charge": 0, "enabled": false}'::jsonb,
  '[{"endTime": "18:00", "dayOfWeek": -1, "startTime": "16:00", "multiplier": 1.1}]'::jsonb,
  '[]'::jsonb,
  true
)
ON CONFLICT (vehicle_type, service_type) DO NOTHING;

-- Business SUV - Transfer
INSERT INTO pricing_rules (id, vehicle_type, service_type, base_rate, minimum_fare, gratuity_percent, surge_pricing, distance_tiers, is_active)
VALUES (
  'f2d25b90-7e18-40ac-ab60-92f1efb5cd5d',
  'business_suv',
  'transfer',
  141.63,
  141.63,
  0.00,
  '[{"endTime": "18:00", "dayOfWeek": -1, "startTime": "16:00", "multiplier": 1.1}]'::jsonb,
  '[{"miles": 20, "ratePerMile": 0}, {"miles": 4.45, "ratePerMile": 0.97}, {"miles": 1.41, "ratePerMile": 2.59}, {"miles": 5, "ratePerMile": 2.35}, {"miles": 5, "ratePerMile": 2.31}, {"miles": 5, "ratePerMile": 2.25}, {"miles": 5, "ratePerMile": 2.31}, {"miles": 5, "ratePerMile": 2.05}, {"miles": 5, "ratePerMile": 2.09}, {"miles": 5, "ratePerMile": 2.15}, {"miles": 5, "ratePerMile": 2.25}, {"miles": 20, "ratePerMile": 2.35}, {"miles": 25, "ratePerMile": 2.45}, {"miles": 0, "isRemaining": true, "ratePerMile": 3.75}]'::jsonb,
  true
)
ON CONFLICT (vehicle_type, service_type) DO NOTHING;

-- First-Class Sedan - Hourly
INSERT INTO pricing_rules (id, vehicle_type, service_type, hourly_rate, minimum_hours, gratuity_percent, surge_pricing, is_active)
VALUES (
  'b56af034-b66c-4bdf-9b27-05ac576108c0',
  'first_class_sedan',
  'hourly',
  180.56,
  5,
  15.00,
  '[{"endTime": "18:00", "dayOfWeek": -1, "startTime": "16:00", "multiplier": 1.1}]'::jsonb,
  true
)
ON CONFLICT (vehicle_type, service_type) DO NOTHING;

-- First-Class SUV - Hourly
INSERT INTO pricing_rules (id, vehicle_type, service_type, hourly_rate, minimum_hours, gratuity_percent, surge_pricing, is_active)
VALUES (
  '0825cc96-fae8-4b5f-bf51-633153d02def',
  'first_class_suv',
  'hourly',
  120.56,
  2,
  0.00,
  '[{"endTime": "18:00", "dayOfWeek": -1, "startTime": "16:00", "multiplier": 1.1}]'::jsonb,
  true
)
ON CONFLICT (vehicle_type, service_type) DO NOTHING;

-- First-Class SUV - Transfer
INSERT INTO pricing_rules (id, vehicle_type, service_type, base_rate, minimum_fare, gratuity_percent, surge_pricing, distance_tiers, is_active)
VALUES (
  'aad01610-3f2c-4281-b04c-68e006d39cb6',
  'first_class_suv',
  'transfer',
  169.77,
  169.77,
  0.00,
  '[{"endTime": "18:00", "dayOfWeek": -1, "startTime": "16:00", "multiplier": 1.1}]'::jsonb,
  '[{"miles": 20, "ratePerMile": 0}, {"miles": 4.45, "ratePerMile": 0.97}, {"miles": 1.41, "ratePerMile": 2.59}, {"miles": 5, "ratePerMile": 2.35}, {"miles": 5, "ratePerMile": 2.31}, {"miles": 5, "ratePerMile": 2.25}, {"miles": 5, "ratePerMile": 2.31}, {"miles": 5, "ratePerMile": 2.05}, {"miles": 5, "ratePerMile": 2.09}, {"miles": 5, "ratePerMile": 2.15}, {"miles": 5, "ratePerMile": 2.25}, {"miles": 20, "ratePerMile": 2.35}, {"miles": 25, "ratePerMile": 2.45}, {"miles": 0, "isRemaining": true, "ratePerMile": 3.75}]'::jsonb,
  true
)
ON CONFLICT (vehicle_type, service_type) DO NOTHING;

-- Business Van - Hourly
INSERT INTO pricing_rules (id, vehicle_type, service_type, hourly_rate, minimum_hours, gratuity_percent, surge_pricing, is_active)
VALUES (
  '94a2e788-6829-4143-a04a-b095b0dc0f71',
  'business_van',
  'hourly',
  175.00,
  5,
  15.00,
  '[{"endTime": "18:00", "dayOfWeek": -1, "startTime": "16:00", "multiplier": 1.1}]'::jsonb,
  true
)
ON CONFLICT (vehicle_type, service_type) DO NOTHING;

-- ============================================
-- CMS SETTINGS - Branding
-- ============================================

INSERT INTO cms_settings (id, key, value, category, description)
VALUES 
(
  'df306b79-5f5e-4b7f-a21e-b86b62dcfa6e',
  'BRAND_COMPANY_NAME',
  'USA Luxury Limo',
  'branding',
  'Company/Brand name displayed throughout the application and PWA install prompt'
)
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- SERVICES - Homepage Service Cards
-- ============================================

INSERT INTO services (id, slug, title, description, icon, features, display_order, is_active)
VALUES 
(
  '4594d759-fd5c-4586-9818-19a0b4ee3b7b',
  'airport-transfer',
  'Airport Transfer',
  'Reliable airport pickup and drop-off with flight tracking and meet & greet service.',
  'Plane',
  ARRAY['Auto Flight tracking', 'Free Meet & Greet', 'Free 60 min. waiting time'],
  1,
  true
),
(
  'ab4c59c2-8fc7-4dfb-92a1-06401963fb00',
  'corporate-travel',
  'Corporate Travel',
  'Professional transportation for business meetings, events, and executive travel.',
  'Briefcase',
  ARRAY['Business-class vehicles', 'Professional chauffeurs', 'Corporate billing'],
  2,
  true
),
(
  '1b1fe3e3-bdfc-450d-b465-5197ea099a0e',
  'special-events',
  'Special Events',
  'Make your special occasions memorable with our luxury transportation services.',
  'Heart',
  ARRAY['Wedding packages', 'Prom & graduation', 'Anniversary celebrations'],
  3,
  true
),
(
  'ff440fc0-f304-4635-a59e-12efd98acb7b',
  'hourly-service',
  'Hourly Service',
  'Flexible hourly transportation for multiple stops, shopping trips, and extended travel needs.',
  'Clock',
  ARRAY['Flexible scheduling', 'Multiple destinations', 'Wait time included', 'Customizable routes'],
  4,
  true
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- SYSTEM SETTINGS - Configuration
-- NOTE: Sensitive keys (passwords, API keys) are excluded for security
-- ============================================

INSERT INTO system_settings (key, value, description, is_encrypted)
VALUES 
('ADMIN_EMAIL', 'info@usaluxurylimo.com', 'System administrator email address', false),
('SYSTEM_ADMIN_EMAIL', 'info@usaluxurylimo.com', 'System administrator contact email', false),
('SYSTEM_COMMISSION_PERCENTAGE', '29', 'System commission percentage for bookings', false),
('SMTP_FROM_EMAIL', 'info@usaluxurylimo.com', 'Email sender address', false),
('SMTP_FROM_NAME', 'USA Luxury Limo', 'Email sender name', false),
('SMTP_HOST', 'smtp.hostinger.com', 'SMTP server host', false),
('SMTP_PORT', '465', 'SMTP server port', false),
('SMTP_SECURE', 'true', 'Use SSL/TLS for SMTP', false),
('TWILIO_ENABLED', 'true', 'Enable Twilio SMS notifications', false)
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- SAMPLE DRIVER DATA
-- ============================================

-- Create driver profile for test driver
INSERT INTO drivers (id, user_id, verification_status, background_check_status, rating, total_rides, is_available)
VALUES (
  'a1b2c3d4-e5f6-4789-a012-3456789abcde',
  '170c1fae-4066-444a-bb9e-266065543639',
  'verified',
  'approved',
  4.85,
  127,
  true
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- NOTES
-- ============================================

-- This file contains test/sample data for development purposes
-- Production deployment should:
-- 1. Configure proper API keys in system_settings
-- 2. Set up payment provider credentials
-- 3. Configure SMTP and Twilio settings
-- 4. Upload real vehicle images to object storage
-- 5. Create actual admin/dispatcher accounts
-- 6. Configure database connection string

-- For security, the following are NOT included in this file:
-- - User passwords (should be hashed with bcrypt)
-- - API keys (Stripe, PayPal, TomTom, RapidAPI, etc.)
-- - Database credentials
-- - SMTP/Twilio authentication tokens
-- - OAuth secrets

-- To use this data:
-- 1. Ensure database schema is created (use database_schema.sql)
-- 2. Import this file: psql -d your_database -f test_data.sql
-- 3. Configure sensitive credentials through admin panel or environment variables
