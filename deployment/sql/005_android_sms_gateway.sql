-- =====================================================
-- Android SMS Gateway - Database Migration
-- Version: 1.0.0
-- Date: 2024-12-30
-- 
-- SAFE MIGRATION: This script only creates new tables
-- and does not modify any existing tables or columns.
-- Existing Twilio SMS functionality remains unchanged.
-- =====================================================

-- Create Android SMS Devices table
-- Stores registered Android devices that can send SMS
CREATE TABLE IF NOT EXISTS android_sms_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_uuid VARCHAR(100) NOT NULL UNIQUE,
    device_name VARCHAR(100),
    api_token VARCHAR(255) NOT NULL,
    last_heartbeat TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    phone_number VARCHAR(30),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for querying active devices
CREATE INDEX IF NOT EXISTS android_devices_active_idx 
    ON android_sms_devices(is_active);

-- Create Android SMS Queue table
-- Stores SMS messages waiting to be sent by Android devices
CREATE TABLE IF NOT EXISTS android_sms_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(30) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SENT', 'FAILED', 'EXPIRED')),
    device_uuid VARCHAR(100),
    error_message TEXT,
    priority INTEGER DEFAULT 0,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    scheduled_at TIMESTAMP,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for querying pending messages by status
CREATE INDEX IF NOT EXISTS sms_queue_status_idx 
    ON android_sms_queue(status);

-- Index for prioritizing messages
CREATE INDEX IF NOT EXISTS sms_queue_priority_idx 
    ON android_sms_queue(priority DESC);

-- SMS Provider setting (stored in system_settings table)
-- Default value is 'TWILIO' to maintain backward compatibility
-- INSERT INTO system_settings (key, value, description)
-- VALUES ('SMS_PROVIDER', 'TWILIO', 'Active SMS provider: TWILIO or ANDROID_SMS')
-- ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- ROLLBACK SCRIPT (if needed)
-- =====================================================
-- DROP INDEX IF EXISTS sms_queue_priority_idx;
-- DROP INDEX IF EXISTS sms_queue_status_idx;
-- DROP INDEX IF EXISTS android_devices_active_idx;
-- DROP TABLE IF EXISTS android_sms_queue;
-- DROP TABLE IF EXISTS android_sms_devices;
-- DELETE FROM system_settings WHERE key = 'SMS_PROVIDER';
-- =====================================================
