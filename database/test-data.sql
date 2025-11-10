-- USA Luxury Limo Test Data
-- Populate database with sample/test data for development and testing

-- ==============================================================================
-- USERS (Test accounts for all roles)
-- ==============================================================================

-- Admin user
INSERT INTO users (id, username, email, first_name, last_name, phone, role, is_active, created_at)
VALUES 
  ('admin-001', 'admin', 'admin@usaluxurylimo.com', 'Admin', 'User', '+1-555-0100', 'admin', true, NOW())
ON CONFLICT (id) DO NOTHING;

-- Dispatcher user
INSERT INTO users (id, username, email, first_name, last_name, phone, role, is_active, created_at)
VALUES 
  ('dispatcher-001', 'dispatcher', 'dispatcher@usaluxurylimo.com', 'Dispatch', 'Manager', '+1-555-0101', 'dispatcher', true, NOW())
ON CONFLICT (id) DO NOTHING;

-- Test passengers
INSERT INTO users (id, username, email, first_name, last_name, phone, role, is_active, pay_later_enabled, discount_type, discount_value, created_at)
VALUES 
  ('passenger-001', 'john.doe', 'john.doe@example.com', 'John', 'Doe', '+1-555-0201', 'passenger', true, false, NULL, 0, NOW()),
  ('passenger-002', 'jane.smith', 'jane.smith@example.com', 'Jane', 'Smith', '+1-555-0202', 'passenger', true, true, 'percentage', 10, NOW()),
  ('passenger-003', 'bob.wilson', 'bob.wilson@example.com', 'Bob', 'Wilson', '+1-555-0203', 'passenger', true, false, 'fixed', 25, NOW()),
  ('passenger-004', 'alice.johnson', 'alice.johnson@example.com', 'Alice', 'Johnson', '+1-555-0204', 'passenger', true, true, NULL, 0, NOW())
ON CONFLICT (id) DO NOTHING;

-- Test driver users
INSERT INTO users (id, username, email, first_name, last_name, phone, role, is_active, created_at)
VALUES 
  ('driver-user-001', 'michael.brown', 'michael.brown@usaluxurylimo.com', 'Michael', 'Brown', '+1-555-0301', 'driver', true, NOW()),
  ('driver-user-002', 'sarah.davis', 'sarah.davis@usaluxurylimo.com', 'Sarah', 'Davis', '+1-555-0302', 'driver', true, NOW()),
  ('driver-user-003', 'david.martinez', 'david.martinez@usaluxurylimo.com', 'David', 'Martinez', '+1-555-0303', 'driver', true, NOW())
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- DRIVERS
-- ==============================================================================

INSERT INTO drivers (id, user_id, license_number, license_expiry, vehicle_plate, background_check_status, verification_status, rating, total_rides, is_available, created_at)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'driver-user-001', 'DL-12345678', NOW() + INTERVAL '2 years', 'LUX-001', 'approved', 'verified', 4.85, 156, true, NOW()),
  ('22222222-2222-2222-2222-222222222222', 'driver-user-002', 'DL-87654321', NOW() + INTERVAL '1 year', 'LUX-002', 'approved', 'verified', 4.92, 203, true, NOW()),
  ('33333333-3333-3333-3333-333333333333', 'driver-user-003', 'DL-11223344', NOW() + INTERVAL '3 years', 'LUX-003', 'approved', 'verified', 4.78, 98, false, NOW())
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- VEHICLE TYPES
-- ==============================================================================

INSERT INTO vehicle_types (id, name, description, passenger_capacity, luggage_capacity, hourly_rate, per_mile_rate, minimum_fare, features, is_active, created_at)
VALUES 
  ('vtype-001', 'Business Sedan', 'Professional sedan for business travel', 3, '2 large bags', 75.00, 3.50, 50.00, '["WiFi", "Bottled Water", "Phone Charger", "Climate Control"]'::jsonb, true, NOW()),
  ('vtype-002', 'Business SUV', 'Spacious SUV for group travel', 6, '4 large bags', 95.00, 4.25, 65.00, '["WiFi", "Bottled Water", "Phone Charger", "Climate Control", "Extra Luggage Space"]'::jsonb, true, NOW()),
  ('vtype-003', 'First Class Sedan', 'Luxury sedan for premium experience', 3, '2 large bags', 110.00, 4.50, 75.00, '["WiFi", "Bottled Water", "Phone Charger", "Premium Sound", "Leather Seats", "Refreshments"]'::jsonb, true, NOW()),
  ('vtype-004', 'First Class SUV', 'Premium SUV for ultimate comfort', 6, '5 large bags', 135.00, 5.50, 95.00, '["WiFi", "Bottled Water", "Phone Charger", "Premium Sound", "Leather Seats", "Refreshments", "Privacy Screen"]'::jsonb, true, NOW()),
  ('vtype-005', 'Business Van', 'Large van for group transportation', 10, '8 large bags', 150.00, 5.00, 100.00, '["WiFi", "Bottled Water", "Climate Control", "Extra Luggage Space", "Group Seating"]'::jsonb, true, NOW())
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- PRICING RULES
-- ==============================================================================

-- Transfer pricing rules
INSERT INTO pricing_rules (id, vehicle_type, service_type, base_rate, per_mile_rate, minimum_fare, gratuity_percent, is_active, created_at)
VALUES 
  ('price-001', 'business_sedan', 'transfer', 25.00, 3.50, 50.00, 20.00, true, NOW()),
  ('price-002', 'business_suv', 'transfer', 35.00, 4.25, 65.00, 20.00, true, NOW()),
  ('price-003', 'first_class_sedan', 'transfer', 40.00, 4.50, 75.00, 20.00, true, NOW()),
  ('price-004', 'first_class_suv', 'transfer', 50.00, 5.50, 95.00, 20.00, true, NOW()),
  ('price-005', 'business_van', 'transfer', 45.00, 5.00, 100.00, 20.00, true, NOW())
ON CONFLICT (id) DO NOTHING;

-- Hourly pricing rules
INSERT INTO pricing_rules (id, vehicle_type, service_type, hourly_rate, minimum_hours, minimum_fare, gratuity_percent, overtime_rate, is_active, created_at)
VALUES 
  ('price-006', 'business_sedan', 'hourly', 75.00, 3, 225.00, 20.00, 85.00, true, NOW()),
  ('price-007', 'business_suv', 'hourly', 95.00, 3, 285.00, 20.00, 105.00, true, NOW()),
  ('price-008', 'first_class_sedan', 'hourly', 110.00, 3, 330.00, 20.00, 125.00, true, NOW()),
  ('price-009', 'first_class_suv', 'hourly', 135.00, 3, 405.00, 20.00, 155.00, true, NOW()),
  ('price-010', 'business_van', 'hourly', 150.00, 4, 600.00, 20.00, 170.00, true, NOW())
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- VEHICLES
-- ==============================================================================

INSERT INTO vehicles (id, vehicle_type_id, driver_id, make, model, year, color, license_plate, is_active, created_at)
VALUES 
  ('vehicle-001', 'vtype-001', '11111111-1111-1111-1111-111111111111', 'Mercedes-Benz', 'E-Class', 2023, 'Black', 'LUX-001', true, NOW()),
  ('vehicle-002', 'vtype-002', '22222222-2222-2222-2222-222222222222', 'Cadillac', 'Escalade', 2023, 'Black', 'LUX-002', true, NOW()),
  ('vehicle-003', 'vtype-003', '33333333-3333-3333-3333-333333333333', 'BMW', '7 Series', 2024, 'Silver', 'LUX-003', true, NOW())
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- SAMPLE BOOKINGS (Various statuses)
-- ==============================================================================

-- Completed booking
INSERT INTO bookings (
  id, passenger_id, driver_id, vehicle_type_id, vehicle_id, booking_type, status,
  pickup_address, destination_address, scheduled_date_time,
  estimated_distance, base_fare, distance_fare, gratuity_amount, total_amount,
  payment_status, booked_by, created_at
)
VALUES (
  'booking-001', 'passenger-001', '11111111-1111-1111-1111-111111111111', 'vtype-001', 'vehicle-001', 'transfer', 'completed',
  'JFK Airport, Queens, NY', '123 Park Avenue, New York, NY 10017', NOW() - INTERVAL '2 days',
  15.5, 25.00, 54.25, 15.85, 95.10,
  'paid', 'passenger', NOW() - INTERVAL '3 days'
)
ON CONFLICT (id) DO NOTHING;

-- Confirmed upcoming booking
INSERT INTO bookings (
  id, passenger_id, driver_id, vehicle_type_id, vehicle_id, booking_type, status,
  pickup_address, destination_address, scheduled_date_time,
  estimated_distance, base_fare, distance_fare, gratuity_amount, total_amount,
  payment_status, booked_by, created_at
)
VALUES (
  'booking-002', 'passenger-002', '22222222-2222-2222-2222-222222222222', 'vtype-002', 'vehicle-002', 'transfer', 'confirmed',
  'LaGuardia Airport, Queens, NY', 'Times Square, New York, NY', NOW() + INTERVAL '1 day',
  12.0, 35.00, 51.00, 17.20, 103.20,
  'pending', 'passenger', NOW() - INTERVAL '1 day'
)
ON CONFLICT (id) DO NOTHING;

-- Hourly booking in progress
INSERT INTO bookings (
  id, passenger_id, driver_id, vehicle_type_id, vehicle_id, booking_type, status,
  pickup_address, destination_address, scheduled_date_time,
  requested_hours, base_fare, time_fare, gratuity_amount, total_amount,
  payment_status, booked_by, created_at
)
VALUES (
  'booking-003', 'passenger-003', '11111111-1111-1111-1111-111111111111', 'vtype-003', 'vehicle-001', 'hourly', 'in_progress',
  'Manhattan, New York, NY', 'Various locations - City tour', NOW() - INTERVAL '1 hour',
  4, 0, 440.00, 88.00, 528.00,
  'pending', 'admin', NOW() - INTERVAL '2 hours'
)
ON CONFLICT (id) DO NOTHING;

-- Pending booking awaiting assignment
INSERT INTO bookings (
  id, passenger_id, vehicle_type_id, booking_type, status,
  pickup_address, destination_address, scheduled_date_time,
  estimated_distance, base_fare, distance_fare, gratuity_amount, total_amount,
  payment_status, booked_by, flight_number, flight_airline, created_at
)
VALUES (
  'booking-004', 'passenger-004', 'vtype-004', 'transfer', 'pending',
  'Newark Airport (EWR), Newark, NJ', '456 Fifth Avenue, New York, NY', NOW() + INTERVAL '3 hours',
  18.5, 50.00, 101.75, 30.35, 182.10,
  'pending', 'passenger', 'AA1234', 'American Airlines', NOW() - INTERVAL '30 minutes'
)
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- SAVED ADDRESSES
-- ==============================================================================

INSERT INTO saved_addresses (id, user_id, label, address, lat, lon, is_default, created_at)
VALUES 
  (gen_random_uuid(), 'passenger-001', 'Home', '123 Park Avenue, New York, NY 10017', 40.7589, -73.9774, true, NOW()),
  (gen_random_uuid(), 'passenger-001', 'Work', '1 World Trade Center, New York, NY 10007', 40.7127, -74.0134, false, NOW()),
  (gen_random_uuid(), 'passenger-002', 'Home', '456 Fifth Avenue, New York, NY', 40.7549, -73.9840, true, NOW()),
  (gen_random_uuid(), 'passenger-002', 'JFK Airport', 'JFK Airport, Queens, NY', 40.6413, -73.7781, false, NOW())
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- SYSTEM SETTINGS
-- ==============================================================================

INSERT INTO system_settings (id, key, value, description, created_at)
VALUES 
  (gen_random_uuid(), 'company_name', 'USA Luxury Limo', 'Company name displayed throughout the application', NOW()),
  (gen_random_uuid(), 'company_email', 'info@usaluxurylimo.com', 'Main company email address', NOW()),
  (gen_random_uuid(), 'company_phone', '+1-555-LIMO-USA', 'Main company phone number', NOW()),
  (gen_random_uuid(), 'booking_advance_hours', '2', 'Minimum hours in advance for booking', NOW()),
  (gen_random_uuid(), 'cancellation_window_hours', '24', 'Hours before pickup for free cancellation', NOW()),
  (gen_random_uuid(), 'default_gratuity_percent', '20', 'Default gratuity percentage', NOW())
ON CONFLICT (key) DO NOTHING;

-- ==============================================================================
-- PAYMENT SYSTEMS (Placeholder - keys should be set via admin panel)
-- ==============================================================================

INSERT INTO payment_systems (id, provider, is_active, created_at)
VALUES 
  (gen_random_uuid(), 'stripe', false, NOW()),
  (gen_random_uuid(), 'paypal', false, NOW()),
  (gen_random_uuid(), 'square', false, NOW())
ON CONFLICT (provider) DO NOTHING;

-- ==============================================================================
-- CMS CONTENT
-- ==============================================================================

INSERT INTO cms_content (id, component_type, content_key, content_value, is_active, created_at)
VALUES 
  (gen_random_uuid(), 'about', 'about_heading', 'About USA Luxury Limo', true, NOW()),
  (gen_random_uuid(), 'about', 'about_description', 'We provide premium luxury transportation services with professional drivers and top-of-the-line vehicles.', true, NOW()),
  (gen_random_uuid(), 'services', 'services_heading', 'Our Services', true, NOW()),
  (gen_random_uuid(), 'contact', 'contact_heading', 'Contact Us', true, NOW())
ON CONFLICT (content_key) DO NOTHING;

-- ==============================================================================
-- DRIVER RATINGS
-- ==============================================================================

INSERT INTO driver_ratings (id, booking_id, driver_id, passenger_id, rating, comment, created_at)
VALUES 
  (gen_random_uuid(), 'booking-001', '11111111-1111-1111-1111-111111111111', 'passenger-001', 5, 'Excellent service! Very professional and punctual.', NOW() - INTERVAL '1 day'),
  (gen_random_uuid(), 'booking-003', '11111111-1111-1111-1111-111111111111', 'passenger-003', 5, 'Great city tour, driver was very knowledgeable.', NOW() - INTERVAL '30 minutes')
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- Summary
-- ==============================================================================

SELECT 
  'Test data loaded successfully!' as message,
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM drivers) as total_drivers,
  (SELECT COUNT(*) FROM vehicle_types) as total_vehicle_types,
  (SELECT COUNT(*) FROM vehicles) as total_vehicles,
  (SELECT COUNT(*) FROM bookings) as total_bookings,
  (SELECT COUNT(*) FROM pricing_rules) as total_pricing_rules;
