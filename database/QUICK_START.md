# Quick Start - Database Installation

## One-Line Installation

```bash
# Interactive menu (recommended)
./database/install.sh
```

## Manual Installation

### Step 1: Connect to database
```bash
# Using environment variable
export DATABASE_URL="postgresql://user:password@host:port/database"
```

### Step 2: Install schema
```bash
psql $DATABASE_URL -f database/schema.sql
```

### Step 3: Load test data (optional)
```bash
psql $DATABASE_URL -f database/test-data.sql
```

### Step 4: Verify installation
```bash
psql $DATABASE_URL -f database/verify.sql
```

## What You Get

### With Schema Only (`schema.sql`)
- 17 empty tables ready for production
- All foreign keys and indexes configured
- PostgreSQL 14+ compatible

### With Test Data (`test-data.sql`)
- **7 User Accounts**
  - admin@usaluxurylimo.com (Admin)
  - dispatcher@usaluxurylimo.com (Dispatcher)
  - 4 test passengers
  - 3 test drivers

- **5 Vehicle Types**
  - Business Sedan ($75/hr, $3.50/mile)
  - Business SUV ($95/hr, $4.25/mile)
  - First Class Sedan ($110/hr, $4.50/mile)
  - First Class SUV ($135/hr, $5.50/mile)
  - Business Van ($150/hr, $5.00/mile)

- **10 Pricing Rules** (Transfer + Hourly for each vehicle type)

- **4 Sample Bookings**
  - 1 completed trip
  - 1 confirmed upcoming trip
  - 1 in-progress hourly booking
  - 1 pending booking

- **System Configuration**
  - Company settings
  - Payment systems placeholders
  - CMS content
  - Saved addresses

## Common Scenarios

### Scenario 1: Development/Testing
```bash
./database/install.sh
# Choose option 2: Fresh install with test data
```

### Scenario 2: Production
```bash
./database/install.sh
# Choose option 1: Fresh install (schema only)
```

### Scenario 3: Reset Everything
```bash
./database/install.sh
# Choose option 3: Drop and reinstall
```

### Scenario 4: Check Installation
```bash
./database/install.sh
# Choose option 4: Verify
```

## Environment Examples

### Replit Development
```bash
# DATABASE_URL is automatically set
./database/install.sh
```

### Neon (Production)
```bash
export DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/db?sslmode=require"
./database/install.sh
```

### Local PostgreSQL
```bash
export DATABASE_URL="postgresql://localhost:5432/usa_luxury_limo"
./database/install.sh
```

### Docker Container
```bash
docker exec -i postgres_container psql -U postgres < database/schema.sql
docker exec -i postgres_container psql -U postgres < database/test-data.sql
```

## Troubleshooting

### Error: "psql: command not found"
Install PostgreSQL client:
```bash
# Ubuntu/Debian
sudo apt-get install postgresql-client

# macOS
brew install postgresql
```

### Error: "permission denied"
Grant proper privileges:
```sql
GRANT ALL PRIVILEGES ON DATABASE your_db TO your_user;
```

### Error: "relation already exists"
Drop and reinstall:
```bash
psql $DATABASE_URL -f database/drop-all.sql
psql $DATABASE_URL -f database/schema.sql
```

## Next Steps

After installation:

1. ✅ Database is ready
2. 🚀 Start your application: `npm run dev`
3. 🔐 Log in with test admin account (if test data loaded)
4. ⚙️ Configure payment providers
5. 📧 Set up email/SMS notifications
6. 🎨 Customize branding via CMS

## Support

- Full documentation: `database/README.md`
- Schema reference: `database/schema.sql`
- Verification: `psql $DATABASE_URL -f database/verify.sql`
