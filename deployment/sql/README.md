# USA Luxury Limo - Database Schema Migrations

This folder contains SQL scripts for deploying and updating tenant databases.

## Files

### 001_init_schema.sql
Complete database schema for new tenant deployments. Run this script on a fresh database to create all required tables, indexes, and default data.

**Usage for new tenants:**
```bash
psql -h <host> -U <user> -d <database> -f 001_init_schema.sql
```

### 002_schema_updates.sql
Migration updates for existing tenant databases. This script uses `IF NOT EXISTS` checks and `DO $$ ... END $$` blocks to safely add new columns and tables without affecting existing data.

**Usage for existing tenants:**
```bash
psql -h <host> -U <user> -d <database> -f 002_schema_updates.sql
```

## Deployment Order

1. **New Tenant:** Run `001_init_schema.sql` only
2. **Existing Tenant:** Run `002_schema_updates.sql` to update to latest schema

## Environment Variables

When connecting to the database, you can use these environment variables:

```bash
export PGHOST=your-db-host
export PGUSER=your-db-user
export PGPASSWORD=your-db-password
export PGDATABASE=your-db-name
export PGPORT=5432

# Then run:
psql -f 001_init_schema.sql
```

## Tables Overview

| Table | Description |
|-------|-------------|
| `sessions` | User session storage for authentication |
| `users` | All user accounts (passengers, drivers, dispatchers, admins) |
| `drivers` | Driver-specific information and documents |
| `driver_documents` | Driver verification documents |
| `vehicle_types` | Available vehicle categories and pricing |
| `vehicles` | Individual vehicles in the fleet |
| `pricing_rules` | Configurable pricing for different vehicle/service types |
| `bookings` | All ride bookings and their status |
| `driver_ratings` | Passenger ratings for drivers |
| `saved_addresses` | User's saved pickup/dropoff addresses |
| `system_settings` | Global system configuration |
| `payment_systems` | Payment provider configurations |
| `payment_options` | Available payment methods |
| `invoices` | Generated invoices for bookings |
| `payment_tokens` | Secure tokens for invoice payment links |
| `contact_submissions` | Contact form submissions |
| `ride_credits` | User ride credit balances |
| `ride_credit_transactions` | Audit trail for credit changes |
| `booking_cancellations` | Cancellation details and refund status |
| `cms_settings` | CMS branding and configuration |
| `cms_content` | CMS content blocks |
| `cms_media` | CMS media library |
| `services` | Homepage service cards |
| `password_reset_tokens` | Password recovery tokens |
| `driver_messages` | Communication messages to drivers |
| `emergency_incidents` | Emergency incident reports |

## Default Data

The `001_init_schema.sql` script includes:

1. **Payment Options:**
   - Credit Card (enabled)
   - Pay Later (disabled)
   - Cash (disabled)
   - Ride Credit (enabled)

2. **Vehicle Types:**
   - Business Sedan (3 passengers)
   - Business SUV (6 passengers)
   - First Class Sedan (3 passengers)
   - First Class SUV (6 passengers)
   - Business Van (10 passengers)

## Creating Admin User

After running the schema, create your first admin user:

```sql
INSERT INTO users (
    username, 
    password, 
    email, 
    first_name, 
    last_name, 
    role, 
    is_active
) VALUES (
    'admin',
    '$scrypt$N=32768,r=8,p=1$YOUR_HASHED_PASSWORD',
    'admin@example.com',
    'Admin',
    'User',
    'admin',
    true
);
```

Note: Generate the password hash using the application's password hashing function (scrypt).

## Troubleshooting

### Connection Issues
```bash
# Test connection
psql -h <host> -U <user> -d <database> -c "SELECT 1"
```

### Check Table Exists
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

### Check Column Exists
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'bookings';
```
