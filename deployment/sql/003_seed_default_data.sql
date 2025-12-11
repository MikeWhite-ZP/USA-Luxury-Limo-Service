-- ============================================================================
-- USA Luxury Limo - Default Seed Data
-- Description: Optional seed data for new tenant deployments
-- Run this after 001_init_schema.sql to populate default settings
-- ============================================================================

-- ============================================================================
-- DEFAULT PAYMENT OPTIONS
-- ============================================================================
INSERT INTO payment_options (option_type, display_name, description, is_enabled, sort_order) VALUES
('credit_card', 'Credit Card', 'Pay securely with your credit or debit card', true, 1),
('pay_later', 'Pay Later', 'Pay after your ride is completed', false, 2),
('cash', 'Cash', 'Pay in cash to the driver', false, 3),
('ride_credit', 'Ride Credit', 'Use your ride credit balance', true, 4)
ON CONFLICT (option_type) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description;

-- ============================================================================
-- DEFAULT VEHICLE TYPES
-- ============================================================================
INSERT INTO vehicle_types (name, description, passenger_capacity, luggage_capacity, hourly_rate, per_mile_rate, minimum_fare, is_active) VALUES
('Business Sedan', 'Comfortable sedan for business travel. Perfect for airport transfers and corporate transportation.', 3, '2 large, 2 small', 75.00, 3.50, 75.00, true),
('Business SUV', 'Spacious SUV for groups. Ideal for families or business teams traveling together.', 6, '4 large, 4 small', 95.00, 4.50, 95.00, true),
('First Class Sedan', 'Premium luxury sedan with top amenities. For the discerning traveler who expects the best.', 3, '2 large, 2 small', 125.00, 5.50, 125.00, true),
('First Class SUV', 'Premium luxury SUV with executive features. Ultimate comfort for important occasions.', 6, '4 large, 4 small', 150.00, 6.50, 150.00, true),
('Business Van', 'Large capacity van for groups up to 10. Perfect for corporate events or family outings.', 10, '10 large, 10 small', 175.00, 7.50, 175.00, true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- DEFAULT PRICING RULES
-- ============================================================================

-- Business Sedan - Transfer
INSERT INTO pricing_rules (vehicle_type, service_type, base_rate, per_mile_rate, minimum_fare, gratuity_percent, is_active) VALUES
('business_sedan', 'transfer', 45.00, 3.50, 75.00, 20.00, true)
ON CONFLICT (vehicle_type, service_type) DO UPDATE SET
    base_rate = EXCLUDED.base_rate,
    per_mile_rate = EXCLUDED.per_mile_rate,
    minimum_fare = EXCLUDED.minimum_fare;

-- Business Sedan - Hourly
INSERT INTO pricing_rules (vehicle_type, service_type, hourly_rate, minimum_hours, minimum_fare, gratuity_percent, is_active) VALUES
('business_sedan', 'hourly', 75.00, 3, 225.00, 20.00, true)
ON CONFLICT (vehicle_type, service_type) DO UPDATE SET
    hourly_rate = EXCLUDED.hourly_rate,
    minimum_hours = EXCLUDED.minimum_hours,
    minimum_fare = EXCLUDED.minimum_fare;

-- Business SUV - Transfer
INSERT INTO pricing_rules (vehicle_type, service_type, base_rate, per_mile_rate, minimum_fare, gratuity_percent, is_active) VALUES
('business_suv', 'transfer', 55.00, 4.50, 95.00, 20.00, true)
ON CONFLICT (vehicle_type, service_type) DO UPDATE SET
    base_rate = EXCLUDED.base_rate,
    per_mile_rate = EXCLUDED.per_mile_rate,
    minimum_fare = EXCLUDED.minimum_fare;

-- Business SUV - Hourly
INSERT INTO pricing_rules (vehicle_type, service_type, hourly_rate, minimum_hours, minimum_fare, gratuity_percent, is_active) VALUES
('business_suv', 'hourly', 95.00, 3, 285.00, 20.00, true)
ON CONFLICT (vehicle_type, service_type) DO UPDATE SET
    hourly_rate = EXCLUDED.hourly_rate,
    minimum_hours = EXCLUDED.minimum_hours,
    minimum_fare = EXCLUDED.minimum_fare;

-- First Class Sedan - Transfer
INSERT INTO pricing_rules (vehicle_type, service_type, base_rate, per_mile_rate, minimum_fare, gratuity_percent, is_active) VALUES
('first_class_sedan', 'transfer', 75.00, 5.50, 125.00, 20.00, true)
ON CONFLICT (vehicle_type, service_type) DO UPDATE SET
    base_rate = EXCLUDED.base_rate,
    per_mile_rate = EXCLUDED.per_mile_rate,
    minimum_fare = EXCLUDED.minimum_fare;

-- First Class Sedan - Hourly
INSERT INTO pricing_rules (vehicle_type, service_type, hourly_rate, minimum_hours, minimum_fare, gratuity_percent, is_active) VALUES
('first_class_sedan', 'hourly', 125.00, 3, 375.00, 20.00, true)
ON CONFLICT (vehicle_type, service_type) DO UPDATE SET
    hourly_rate = EXCLUDED.hourly_rate,
    minimum_hours = EXCLUDED.minimum_hours,
    minimum_fare = EXCLUDED.minimum_fare;

-- First Class SUV - Transfer
INSERT INTO pricing_rules (vehicle_type, service_type, base_rate, per_mile_rate, minimum_fare, gratuity_percent, is_active) VALUES
('first_class_suv', 'transfer', 95.00, 6.50, 150.00, 20.00, true)
ON CONFLICT (vehicle_type, service_type) DO UPDATE SET
    base_rate = EXCLUDED.base_rate,
    per_mile_rate = EXCLUDED.per_mile_rate,
    minimum_fare = EXCLUDED.minimum_fare;

-- First Class SUV - Hourly
INSERT INTO pricing_rules (vehicle_type, service_type, hourly_rate, minimum_hours, minimum_fare, gratuity_percent, is_active) VALUES
('first_class_suv', 'hourly', 150.00, 3, 450.00, 20.00, true)
ON CONFLICT (vehicle_type, service_type) DO UPDATE SET
    hourly_rate = EXCLUDED.hourly_rate,
    minimum_hours = EXCLUDED.minimum_hours,
    minimum_fare = EXCLUDED.minimum_fare;

-- Business Van - Transfer
INSERT INTO pricing_rules (vehicle_type, service_type, base_rate, per_mile_rate, minimum_fare, gratuity_percent, is_active) VALUES
('business_van', 'transfer', 95.00, 7.50, 175.00, 20.00, true)
ON CONFLICT (vehicle_type, service_type) DO UPDATE SET
    base_rate = EXCLUDED.base_rate,
    per_mile_rate = EXCLUDED.per_mile_rate,
    minimum_fare = EXCLUDED.minimum_fare;

-- Business Van - Hourly
INSERT INTO pricing_rules (vehicle_type, service_type, hourly_rate, minimum_hours, minimum_fare, gratuity_percent, is_active) VALUES
('business_van', 'hourly', 175.00, 3, 525.00, 20.00, true)
ON CONFLICT (vehicle_type, service_type) DO UPDATE SET
    hourly_rate = EXCLUDED.hourly_rate,
    minimum_hours = EXCLUDED.minimum_hours,
    minimum_fare = EXCLUDED.minimum_fare;

-- ============================================================================
-- DEFAULT CMS BRANDING SETTINGS
-- ============================================================================
INSERT INTO cms_settings (key, value, category, description) VALUES
('company_name', 'USA Luxury Limo', 'branding', 'Company name displayed in header and footer'),
('tagline', 'Premium Transportation Services', 'branding', 'Company tagline'),
('description', 'Experience the finest in luxury ground transportation. Our fleet of premium vehicles and professional chauffeurs ensure your journey is smooth, comfortable, and memorable.', 'branding', 'Company description for SEO and about section'),
('primary_color', '#1a365d', 'colors', 'Primary brand color'),
('secondary_color', '#ecc94b', 'colors', 'Secondary/accent brand color'),
('email', 'info@example.com', 'contact', 'Primary contact email'),
('phone', '+1 (555) 123-4567', 'contact', 'Primary contact phone number'),
('address', '123 Luxury Lane, Suite 100, New York, NY 10001', 'contact', 'Business address')
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = NOW();

-- ============================================================================
-- DEFAULT SERVICES
-- ============================================================================
INSERT INTO services (slug, title, subtitle, description, icon, features, display_order, is_active) VALUES
('airport-transfer', 'Airport Transfer', 'Seamless airport pickups and drop-offs', 'Arrive in style with our premium airport transfer service. We monitor your flight in real-time to ensure timely pickup, regardless of delays.', 'Plane', ARRAY['Flight tracking', 'Meet & greet service', 'Complimentary wait time', 'Luggage assistance'], 1, true),
('corporate-travel', 'Corporate Travel', 'Professional business transportation', 'Elevate your business travel with our corporate transportation solutions. Punctual, professional, and discrete service for executives and teams.', 'Briefcase', ARRAY['Dedicated account manager', 'Priority booking', 'Corporate billing', 'Employee rider programs'], 2, true),
('special-events', 'Special Events', 'Make your celebration unforgettable', 'From weddings to proms, anniversaries to nights out, our special event services ensure you travel in luxury and arrive in style.', 'Heart', ARRAY['Red carpet service', 'Decorated vehicles', 'Champagne service', 'Extended hours available'], 3, true),
('hourly-charter', 'Hourly Charter', 'Flexible chauffeur service on your schedule', 'Need a vehicle and driver at your disposal? Our hourly charter service gives you the flexibility to travel wherever you need, whenever you need.', 'Clock', ARRAY['By-the-hour pricing', 'Multiple stop flexibility', 'Professional chauffeur', 'All-day availability'], 4, true)
ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    subtitle = EXCLUDED.subtitle,
    description = EXCLUDED.description,
    updated_at = NOW();

-- ============================================================================
-- DEFAULT SYSTEM SETTINGS
-- ============================================================================
INSERT INTO system_settings (key, value, description) VALUES
('booking_lead_time_hours', '2', 'Minimum hours in advance a booking can be made'),
('cancellation_policy_hours', '24', 'Hours before pickup for free cancellation'),
('auto_assign_enabled', 'false', 'Whether to automatically assign drivers to bookings'),
('default_gratuity_percent', '20', 'Default gratuity percentage'),
('notification_email_enabled', 'true', 'Enable email notifications for bookings'),
('notification_sms_enabled', 'true', 'Enable SMS notifications for bookings')
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = NOW();

SELECT 'Seed data inserted successfully!' AS status;
