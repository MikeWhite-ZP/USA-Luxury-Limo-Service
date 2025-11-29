import pg from 'pg';
const { Pool, Client } = pg;
import { drizzle } from 'drizzle-orm/node-postgres';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import { getSetupConfig, isSetupComplete } from './setupConfig';

export type { NodePgDatabase };

let pool: pg.Pool | null = null;
let db: NodePgDatabase<typeof schema> | null = null;

export function getDatabaseUrl(): string | null {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const config = getSetupConfig();
  if (config?.databaseUrl) {
    return config.databaseUrl;
  }

  return null;
}

export function initializeDatabase(): { pool: pg.Pool; db: NodePgDatabase<typeof schema> } | null {
  const databaseUrl = getDatabaseUrl();
  
  if (!databaseUrl) {
    console.log('[DATABASE] No database URL configured - running in setup mode');
    return null;
  }

  if (pool && db) {
    return { pool, db };
  }

  try {
    pool = new Pool({ 
      connectionString: databaseUrl,
      ssl: databaseUrl.includes('sslmode=require') 
        ? { rejectUnauthorized: false } 
        : false
    });

    pool.on('error', (err) => {
      console.error('Unexpected database pool error:', err);
    });

    db = drizzle({ client: pool, schema });
    
    console.log('[DATABASE] Connection initialized successfully');
    return { pool, db };
  } catch (error) {
    console.error('[DATABASE] Failed to initialize:', error);
    return null;
  }
}

export function getPool(): pg.Pool | null {
  if (!pool) {
    const result = initializeDatabase();
    if (result) {
      return result.pool;
    }
  }
  return pool;
}

export function getDb(): NodePgDatabase<typeof schema> | null {
  if (!db) {
    const result = initializeDatabase();
    if (result) {
      return result.db;
    }
  }
  return db;
}

export async function testDatabaseConnection(connectionString: string): Promise<{ success: boolean; message: string }> {
  const client = new Client({
    connectionString,
    ssl: connectionString.includes('sslmode=require') 
      ? { rejectUnauthorized: false } 
      : false,
    connectionTimeoutMillis: 10000
  });

  try {
    await client.connect();
    await client.query('SELECT 1');
    await client.end();
    return { success: true, message: 'Database connection successful' };
  } catch (error: any) {
    try {
      await client.end();
    } catch {}
    return { success: false, message: error.message || 'Failed to connect to database' };
  }
}

export async function createDatabaseIfNotExists(
  host: string,
  port: number,
  user: string,
  password: string,
  databaseName: string,
  sslRequired: boolean = false
): Promise<{ success: boolean; message: string; databaseUrl: string }> {
  const adminConnectionString = `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/postgres${sslRequired ? '?sslmode=require' : ''}`;
  
  const adminClient = new Client({
    connectionString: adminConnectionString,
    ssl: sslRequired ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 15000
  });

  try {
    await adminClient.connect();
    
    const dbExistsResult = await adminClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [databaseName]
    );

    if (dbExistsResult.rows.length === 0) {
      await adminClient.query(`CREATE DATABASE "${databaseName}"`);
      console.log(`[SETUP] Created database: ${databaseName}`);
    } else {
      console.log(`[SETUP] Database already exists: ${databaseName}`);
    }

    await adminClient.end();

    const databaseUrl = `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${databaseName}${sslRequired ? '?sslmode=require' : ''}`;
    
    return { 
      success: true, 
      message: `Database '${databaseName}' is ready`,
      databaseUrl 
    };
  } catch (error: any) {
    try {
      await adminClient.end();
    } catch {}
    return { 
      success: false, 
      message: error.message || 'Failed to create database',
      databaseUrl: '' 
    };
  }
}

export async function runDatabaseMigrations(connectionString: string): Promise<{ success: boolean; message: string }> {
  const client = new Client({
    connectionString,
    ssl: connectionString.includes('sslmode=require') 
      ? { rejectUnauthorized: false } 
      : false
  });

  try {
    await client.connect();

    const migrationSQL = `
      -- Enable UUID extension
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";
      
      -- Sessions table for connect-pg-simple
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL,
        PRIMARY KEY ("sid")
      );
      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");

      -- Sessions table for drizzle schema
      CREATE TABLE IF NOT EXISTS "sessions" (
        "sid" varchar PRIMARY KEY,
        "sess" jsonb NOT NULL,
        "expire" timestamp NOT NULL
      );
      CREATE INDEX IF NOT EXISTS "sessions_expire_idx" ON "sessions" ("expire");

      -- Users table
      CREATE TABLE IF NOT EXISTS "users" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        "username" varchar UNIQUE,
        "password" varchar,
        "oauth_provider" varchar DEFAULT 'local',
        "oauth_id" varchar,
        "email" varchar UNIQUE,
        "first_name" varchar,
        "last_name" varchar,
        "profile_image_url" varchar,
        "phone" varchar,
        "role" varchar DEFAULT 'passenger',
        "is_active" boolean DEFAULT true,
        "pay_later_enabled" boolean DEFAULT false,
        "cash_payment_enabled" boolean DEFAULT false,
        "discount_type" varchar,
        "discount_value" decimal(10,2) DEFAULT 0,
        "stripe_customer_id" varchar,
        "stripe_subscription_id" varchar,
        "latitude" decimal(10,8),
        "longitude" decimal(11,8),
        "last_location_update" timestamp,
        "password_reset_token" varchar,
        "password_reset_expires" timestamp,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      );

      -- Drivers table
      CREATE TABLE IF NOT EXISTS "drivers" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" varchar REFERENCES "users"("id"),
        "license_number" varchar,
        "license_expiry" timestamp,
        "license_document_url" varchar,
        "insurance_document_url" varchar,
        "vehicle_plate" varchar,
        "driver_credentials" varchar,
        "background_check_status" varchar DEFAULT 'pending',
        "verification_status" varchar DEFAULT 'pending',
        "rating" decimal(3,2) DEFAULT 0.00,
        "total_rides" integer DEFAULT 0,
        "is_available" boolean DEFAULT false,
        "current_location" text,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      );

      -- Driver documents table
      CREATE TABLE IF NOT EXISTS "driver_documents" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "driver_id" uuid REFERENCES "drivers"("id"),
        "document_type" varchar NOT NULL,
        "document_url" text NOT NULL,
        "expiration_date" timestamp,
        "vehicle_plate" varchar,
        "status" varchar DEFAULT 'pending',
        "rejection_reason" text,
        "whatsapp_number" varchar,
        "uploaded_at" timestamp DEFAULT now(),
        "reviewed_at" timestamp,
        "reviewed_by" varchar REFERENCES "users"("id"),
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      );

      -- Vehicle types table
      CREATE TABLE IF NOT EXISTS "vehicle_types" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar NOT NULL,
        "description" text,
        "passenger_capacity" integer NOT NULL,
        "luggage_capacity" varchar,
        "hourly_rate" decimal(10,2),
        "per_mile_rate" decimal(10,2),
        "minimum_fare" decimal(10,2),
        "image_url" varchar,
        "features" jsonb,
        "is_active" boolean DEFAULT true,
        "created_at" timestamp DEFAULT now()
      );

      -- Pricing rules table
      CREATE TABLE IF NOT EXISTS "pricing_rules" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "vehicle_type" varchar NOT NULL,
        "service_type" varchar NOT NULL,
        "base_rate" decimal(10,2),
        "per_mile_rate" decimal(10,2),
        "hourly_rate" decimal(10,2),
        "minimum_hours" integer,
        "minimum_fare" decimal(10,2),
        "gratuity_percent" decimal(5,2) DEFAULT 20.00,
        "airport_fees" jsonb DEFAULT '[]'::jsonb,
        "meet_and_greet" jsonb DEFAULT '{"enabled": false, "charge": 0}'::jsonb,
        "surge_pricing" jsonb DEFAULT '[]'::jsonb,
        "distance_tiers" jsonb DEFAULT '[]'::jsonb,
        "overtime_rate" decimal(10,2),
        "effective_start" timestamp,
        "effective_end" timestamp,
        "is_active" boolean DEFAULT true,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "unique_vehicle_service" ON "pricing_rules" ("vehicle_type", "service_type");

      -- Vehicles table
      CREATE TABLE IF NOT EXISTS "vehicles" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "vehicle_type_id" uuid REFERENCES "vehicle_types"("id"),
        "driver_id" uuid REFERENCES "drivers"("id"),
        "make" varchar NOT NULL,
        "model" varchar NOT NULL,
        "year" integer NOT NULL,
        "color" varchar,
        "license_plate" varchar,
        "vin" varchar,
        "is_active" boolean DEFAULT true,
        "created_at" timestamp DEFAULT now()
      );

      -- Bookings table
      CREATE TABLE IF NOT EXISTS "bookings" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "passenger_id" varchar REFERENCES "users"("id") NOT NULL,
        "driver_id" uuid REFERENCES "drivers"("id"),
        "vehicle_type_id" uuid REFERENCES "vehicle_types"("id") NOT NULL,
        "vehicle_id" uuid REFERENCES "vehicles"("id"),
        "booking_type" varchar NOT NULL,
        "status" varchar DEFAULT 'pending',
        "pickup_address" text NOT NULL,
        "pickup_lat" decimal(10,8),
        "pickup_lon" decimal(11,8),
        "destination_address" text,
        "destination_lat" decimal(10,8),
        "destination_lon" decimal(11,8),
        "via_points" jsonb,
        "scheduled_date_time" timestamp NOT NULL,
        "estimated_duration" integer,
        "estimated_distance" decimal(8,2),
        "requested_hours" integer,
        "base_fare" decimal(10,2),
        "distance_fare" decimal(10,2),
        "time_fare" decimal(10,2),
        "gratuity_amount" decimal(10,2),
        "airport_fee_amount" decimal(10,2),
        "surge_pricing_multiplier" decimal(5,2),
        "surge_pricing_amount" decimal(10,2),
        "surcharges" jsonb DEFAULT '[]'::jsonb,
        "regular_price" decimal(10,2),
        "discount_percentage" decimal(5,2),
        "discount_amount" decimal(10,2),
        "total_amount" decimal(10,2),
        "driver_payment" decimal(10,2),
        "payment_status" varchar DEFAULT 'pending',
        "payment_intent_id" varchar,
        "special_instructions" text,
        "passenger_count" integer DEFAULT 1,
        "luggage_count" integer DEFAULT 0,
        "baby_seat" boolean DEFAULT false,
        "booking_for" varchar DEFAULT 'self',
        "passenger_name" varchar,
        "passenger_phone" varchar,
        "passenger_email" varchar,
        "flight_number" varchar,
        "flight_name" varchar,
        "flight_airline" varchar,
        "flight_departure_airport" varchar,
        "flight_arrival_airport" varchar,
        "flight_departure" varchar,
        "flight_arrival" varchar,
        "no_flight_info" boolean DEFAULT false,
        "booked_by" varchar,
        "booked_at" timestamp,
        "confirmed_at" timestamp,
        "assigned_at" timestamp,
        "accepted_at" timestamp,
        "reminder_sent_at" timestamp,
        "on_the_way_at" timestamp,
        "arrived_at" timestamp,
        "on_board_at" timestamp,
        "auto_cancelled_at" timestamp,
        "accepted_location" jsonb,
        "started_at" timestamp,
        "started_location" jsonb,
        "dod_at" timestamp,
        "dod_location" jsonb,
        "pob_at" timestamp,
        "pob_location" jsonb,
        "ended_at" timestamp,
        "ended_location" jsonb,
        "payment_at" timestamp,
        "cancelled_at" timestamp,
        "cancel_reason" text,
        "no_show" boolean DEFAULT false,
        "refund_invoice_sent" boolean DEFAULT false,
        "marked_completed_at" timestamp,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      );

      -- Driver ratings table
      CREATE TABLE IF NOT EXISTS "driver_ratings" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "booking_id" uuid REFERENCES "bookings"("id") NOT NULL,
        "driver_id" uuid REFERENCES "drivers"("id") NOT NULL,
        "passenger_id" varchar REFERENCES "users"("id") NOT NULL,
        "rating" integer NOT NULL,
        "comment" text,
        "created_at" timestamp DEFAULT now()
      );

      -- Saved addresses table
      CREATE TABLE IF NOT EXISTS "saved_addresses" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" varchar REFERENCES "users"("id") NOT NULL,
        "label" varchar NOT NULL,
        "address" text NOT NULL,
        "lat" decimal(10,8),
        "lon" decimal(11,8),
        "is_default" boolean DEFAULT false,
        "created_at" timestamp DEFAULT now()
      );

      -- System settings table
      CREATE TABLE IF NOT EXISTS "system_settings" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "key" varchar UNIQUE NOT NULL,
        "value" text,
        "description" text,
        "is_encrypted" boolean DEFAULT false,
        "updated_at" timestamp DEFAULT now(),
        "updated_by" varchar REFERENCES "users"("id")
      );

      -- Payment systems table
      CREATE TABLE IF NOT EXISTS "payment_systems" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "provider" varchar UNIQUE NOT NULL,
        "is_active" boolean DEFAULT false,
        "public_key" text,
        "secret_key" text,
        "webhook_secret" text,
        "config" jsonb,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      );

      -- Invoices table
      CREATE TABLE IF NOT EXISTS "invoices" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "booking_id" uuid REFERENCES "bookings"("id") NOT NULL,
        "invoice_number" varchar UNIQUE NOT NULL,
        "base_fare" decimal(10,2),
        "gratuity_amount" decimal(10,2),
        "airport_fee_amount" decimal(10,2),
        "surge_pricing_multiplier" decimal(5,2),
        "surge_pricing_amount" decimal(10,2),
        "subtotal" decimal(10,2) NOT NULL,
        "discount_percentage" decimal(5,2),
        "discount_amount" decimal(10,2),
        "tax_amount" decimal(10,2) DEFAULT 0.00,
        "total_amount" decimal(10,2) NOT NULL,
        "paid_at" timestamp,
        "created_at" timestamp DEFAULT now()
      );

      -- Payment tokens table
      CREATE TABLE IF NOT EXISTS "payment_tokens" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "invoice_id" uuid REFERENCES "invoices"("id") NOT NULL,
        "token" varchar(64) UNIQUE NOT NULL,
        "expires_at" timestamp NOT NULL,
        "used" boolean DEFAULT false,
        "used_at" timestamp,
        "created_at" timestamp DEFAULT now()
      );

      -- Contact submissions table
      CREATE TABLE IF NOT EXISTS "contact_submissions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "first_name" varchar NOT NULL,
        "last_name" varchar NOT NULL,
        "email" varchar NOT NULL,
        "phone" varchar,
        "service_type" varchar,
        "message" text NOT NULL,
        "status" varchar DEFAULT 'new',
        "created_at" timestamp DEFAULT now()
      );
    `;

    await client.query(migrationSQL);
    await client.end();

    return { success: true, message: 'Database tables created successfully' };
  } catch (error: any) {
    try {
      await client.end();
    } catch {}
    return { success: false, message: error.message || 'Failed to run migrations' };
  }
}

export function resetDatabaseConnection(): void {
  if (pool) {
    pool.end().catch(console.error);
    pool = null;
    db = null;
  }
}
