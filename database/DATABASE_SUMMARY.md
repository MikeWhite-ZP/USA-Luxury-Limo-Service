# Database Summary - USA Luxury Limo

## 📊 Database Tables (17 Total)

### Core Tables
| Table | Rows (Test Data) | Purpose |
|-------|------------------|---------|
| `sessions` | 0 | Express session storage for authentication |
| `users` | 7 | All user accounts (passengers, drivers, dispatchers, admins) |
| `drivers` | 3 | Driver-specific information and status |
| `driver_documents` | 0 | Driver verification documents (licenses, insurance) |
| `driver_ratings` | 2 | Passenger ratings of drivers |

### Fleet Management
| Table | Rows (Test Data) | Purpose |
|-------|------------------|---------|
| `vehicle_types` | 5 | Vehicle categories (Sedan, SUV, Van, etc.) |
| `vehicles` | 3 | Individual vehicles assigned to drivers |
| `pricing_rules` | 10 | Pricing for transfer & hourly services |

### Bookings & Payments
| Table | Rows (Test Data) | Purpose |
|-------|------------------|---------|
| `bookings` | 4 | Ride bookings with full journey tracking |
| `invoices` | 0 | Invoice records for completed bookings |
| `payment_tokens` | 0 | Secure payment links for invoices |
| `payment_systems` | 3 | Payment provider configuration (Stripe, PayPal, Square) |

### User Features
| Table | Rows (Test Data) | Purpose |
|-------|------------------|---------|
| `saved_addresses` | 4 | Passenger favorite locations |
| `contact_submissions` | 0 | Contact form messages |

### System
| Table | Rows (Test Data) | Purpose |
|-------|------------------|---------|
| `system_settings` | 6 | Application configuration |
| `cms_content` | 4 | Editable content (logos, text, images) |

## 🎯 Test Data Details

### Users (7 accounts)

**Admin Access**
- Email: `admin@usaluxurylimo.com`
- Role: Admin
- Purpose: Full system access

**Dispatcher**
- Email: `dispatcher@usaluxurylimo.com`
- Role: Dispatcher
- Purpose: Booking management and driver assignment

**Passengers (4 test accounts)**
1. `john.doe@example.com` - Regular passenger
2. `jane.smith@example.com` - With 10% discount + pay later enabled
3. `bob.wilson@example.com` - With $25 fixed discount
4. `alice.johnson@example.com` - With pay later enabled

**Drivers (3 active drivers)**
1. Michael Brown (LUX-001) - Mercedes E-Class, 4.85★, 156 rides
2. Sarah Davis (LUX-002) - Cadillac Escalade, 4.92★, 203 rides
3. David Martinez (LUX-003) - BMW 7 Series, 4.78★, 98 rides

### Vehicle Types & Pricing

| Vehicle Type | Hourly Rate | Per Mile | Min Fare | Capacity |
|--------------|-------------|----------|----------|----------|
| Business Sedan | $75.00 | $3.50 | $50.00 | 3 pax |
| Business SUV | $95.00 | $4.25 | $65.00 | 6 pax |
| First Class Sedan | $110.00 | $4.50 | $75.00 | 3 pax |
| First Class SUV | $135.00 | $5.50 | $95.00 | 6 pax |
| Business Van | $150.00 | $5.00 | $100.00 | 10 pax |

All pricing includes **20% gratuity** by default.

### Sample Bookings (4 scenarios)

1. **Completed Transfer**
   - JFK → Manhattan
   - Status: Completed, Paid
   - Distance: 15.5 miles
   - Total: $95.10

2. **Confirmed Upcoming Trip**
   - LaGuardia → Times Square
   - Status: Confirmed (tomorrow)
   - Driver: Sarah Davis
   - Total: $103.20

3. **Hourly Service In Progress**
   - Manhattan city tour
   - Status: In Progress
   - Duration: 4 hours
   - Total: $528.00

4. **Pending Airport Pickup**
   - Newark Airport → Manhattan
   - Status: Pending (awaiting driver)
   - Flight: AA1234
   - Total: $182.10

## 📈 Key Features Configured

### Advanced Pricing
- ✅ Base rates + per-mile rates
- ✅ Hourly rates with minimum hours
- ✅ 20% default gratuity
- ✅ Airport fee support (configurable)
- ✅ Surge pricing (time-based, configurable)
- ✅ Distance tiers (progressive pricing)
- ✅ User discounts (percentage or fixed)

### Booking Lifecycle
- ✅ Journey tracking (13+ timestamps)
- ✅ Status transitions (9 states)
- ✅ Payment integration ready
- ✅ Flight information support
- ✅ GPS location tracking
- ✅ Driver acceptance workflow

### User Management
- ✅ Multi-role authentication (4 roles)
- ✅ OAuth support (Google, Apple)
- ✅ Driver verification workflow
- ✅ Document management
- ✅ Rating system

## 🔧 System Settings

Pre-configured settings in test data:

| Setting | Value |
|---------|-------|
| Company Name | USA Luxury Limo |
| Company Email | info@usaluxurylimo.com |
| Company Phone | +1-555-LIMO-USA |
| Booking Advance | 2 hours minimum |
| Cancellation Window | 24 hours free cancellation |
| Default Gratuity | 20% |

## 💾 Database Statistics

- **Total Tables**: 17
- **Total Columns**: ~200+
- **Foreign Keys**: 15+
- **Indexes**: 3 (session expiry, unique constraints)
- **Default Values**: Extensive (timestamps, booleans, UUIDs)
- **Constraints**: CHECK constraints on enums and values

## 🚀 Production Deployment

For production use:

1. **DO NOT** load test data
2. Run only `schema.sql`
3. Create real admin account
4. Configure payment providers
5. Set real API credentials
6. Enable backups

## 📚 Documentation

- `README.md` - Complete installation guide
- `QUICK_START.md` - One-page quick reference
- `schema.sql` - Full schema with comments
- `test-data.sql` - Sample data for testing
- `verify.sql` - Installation verification
- `install.sh` - Interactive installer

## ⚡ Installation Commands

```bash
# Quick install (interactive)
./database/install.sh

# Manual install
psql $DATABASE_URL -f database/schema.sql
psql $DATABASE_URL -f database/test-data.sql

# Verify
psql $DATABASE_URL -f database/verify.sql
```

---

**Schema Version**: 1.0.0  
**Last Updated**: November 2025  
**PostgreSQL Version**: 14+
