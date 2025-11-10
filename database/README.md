# USA Luxury Limo Database Manual Installation

This directory contains SQL scripts for manually installing and populating the database.

## Files

- **schema.sql** - Complete database schema (all tables, indexes, constraints)
- **test-data.sql** - Sample/test data for development and testing
- **drop-all.sql** - Drop all tables (use with caution!)
- **verify.sql** - Verify database installation

## Quick Start

### 1. Connect to your PostgreSQL database

```bash
# Using psql command line
psql "postgresql://username:password@host:5432/database_name"

# Or using environment variable
psql $DATABASE_URL
```

### 2. Install Schema

```bash
# Run the schema creation script
\i database/schema.sql
```

Or using command line:

```bash
psql $DATABASE_URL -f database/schema.sql
```

### 3. Load Test Data (Optional)

```bash
# Run the test data script
\i database/test-data.sql
```

Or using command line:

```bash
psql $DATABASE_URL -f database/test-data.sql
```

### 4. Verify Installation

```bash
# Run verification script
\i database/verify.sql
```

Or using command line:

```bash
psql $DATABASE_URL -f database/verify.sql
```

## What's Included in Test Data

### Users (7 total)
- **1 Admin**: admin@usaluxurylimo.com
- **1 Dispatcher**: dispatcher@usaluxurylimo.com
- **4 Passengers**: Various test passengers with different discount settings
- **3 Drivers**: Active drivers with verified status

### Vehicles & Pricing
- **5 Vehicle Types**: Business Sedan, Business SUV, First Class Sedan, First Class SUV, Business Van
- **10 Pricing Rules**: Transfer and hourly pricing for each vehicle type
- **3 Vehicles**: Assigned to drivers, ready for bookings

### Sample Bookings (4 scenarios)
1. **Completed booking** - Past trip, paid
2. **Confirmed booking** - Upcoming trip with driver assigned
3. **In-progress booking** - Hourly service currently active
4. **Pending booking** - Awaiting driver assignment

### Additional Data
- Saved addresses for passengers
- System settings (company info, booking rules)
- Payment system placeholders
- CMS content
- Driver ratings

## Clean Install (Drop Everything)

⚠️ **WARNING**: This will delete all data!

```bash
# Drop all tables and start fresh
\i database/drop-all.sql

# Then reinstall schema
\i database/schema.sql

# And reload test data
\i database/test-data.sql
```

## Tables Overview

| Table | Description |
|-------|-------------|
| `sessions` | Express session storage (auth) |
| `users` | User accounts (all roles) |
| `drivers` | Driver-specific information |
| `driver_documents` | Driver verification documents |
| `vehicle_types` | Vehicle categories and base pricing |
| `pricing_rules` | Advanced pricing configuration |
| `vehicles` | Individual vehicles |
| `bookings` | Ride bookings and trip details |
| `driver_ratings` | Passenger ratings of drivers |
| `saved_addresses` | Passenger saved locations |
| `system_settings` | Application configuration |
| `payment_systems` | Payment provider configuration |
| `invoices` | Booking invoices |
| `payment_tokens` | Secure payment links |
| `contact_submissions` | Contact form submissions |
| `cms_content` | Content management data |

## Environment-Specific Instructions

### Replit Development Database

```bash
# The DATABASE_URL is automatically set
psql $DATABASE_URL -f database/schema.sql
psql $DATABASE_URL -f database/test-data.sql
```

### Neon (Production)

```bash
# Set your Neon database URL
export DATABASE_URL="postgresql://username:password@ep-xxx.neon.tech/neondb?sslmode=require"

psql $DATABASE_URL -f database/schema.sql
psql $DATABASE_URL -f database/test-data.sql
```

### Local PostgreSQL

```bash
# Connect to local database
psql -U postgres -d usa_luxury_limo -f database/schema.sql
psql -U postgres -d usa_luxury_limo -f database/test-data.sql
```

### Coolify/VPS Deployment

```bash
# Use the DATABASE_URL from your environment variables
psql "$DATABASE_URL" -f database/schema.sql
psql "$DATABASE_URL" -f database/test-data.sql
```

## Troubleshooting

### Error: "relation already exists"

The tables already exist. To reinstall:

```bash
\i database/drop-all.sql
\i database/schema.sql
```

### Error: "permission denied"

Make sure your database user has CREATE privileges:

```sql
GRANT CREATE ON DATABASE your_database TO your_user;
```

### Check Current Schema

```sql
-- List all tables
\dt

-- Check specific table structure
\d users

-- Count records
SELECT COUNT(*) FROM users;
```

## Next Steps

After installing the database:

1. **Update Application Config**: Ensure `DATABASE_URL` is set in your environment
2. **Test Connection**: Run the application and verify database connectivity
3. **Configure Integrations**: Set up payment providers, email/SMS services
4. **Create Admin Account**: Log in with the test admin account or create your own
5. **Configure Pricing**: Adjust pricing rules via admin panel
6. **Upload Media**: Add logos, vehicle images via CMS

## Production Deployment

For production:

1. **DO NOT** load test data (`test-data.sql`)
2. Only run `schema.sql` to create tables
3. Create a real admin account through the application
4. Configure real payment provider credentials
5. Set up production email/SMS services
6. Enable proper backup strategy

## Support

For issues or questions:
- Check application logs
- Review error messages carefully
- Ensure PostgreSQL 14+ is installed
- Verify DATABASE_URL format is correct
