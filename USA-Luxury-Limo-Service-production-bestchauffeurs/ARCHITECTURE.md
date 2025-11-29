# System Architecture

Comprehensive architecture documentation for USA Luxury Limo application.

## Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [System Architecture](#system-architecture)
4. [Data Flow](#data-flow)
5. [Authentication & Authorization](#authentication--authorization)
6. [Object Storage](#object-storage)
7. [Database Schema](#database-schema)
8. [API Architecture](#api-architecture)
9. [Frontend Architecture](#frontend-architecture)
10. [Deployment Architecture](#deployment-architecture)
11. [Security Architecture](#security-architecture)
12. [Scalability & Performance](#scalability--performance)

---

## Overview

USA Luxury Limo is a full-stack Progressive Web Application (PWA) designed for luxury transportation booking. The application follows a modern three-tier architecture:

- **Presentation Layer**: React 18 SPA with PWA capabilities
- **Application Layer**: Node.js/Express RESTful API
- **Data Layer**: PostgreSQL database with S3-compatible object storage

### Key Design Principles

- **Separation of Concerns**: Clear boundaries between frontend, backend, and data layers
- **API-First Design**: RESTful JSON APIs for all operations
- **Stateless Backend**: Session data persisted in PostgreSQL for horizontal scaling
- **Progressive Enhancement**: Works offline with service workers
- **Security by Default**: HTTPS, CSRF protection, input validation
- **Cloud Native**: Containerized with Docker, deployable on any platform

---

## Technology Stack

### Frontend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.x | UI framework |
| TypeScript | 5.x | Type safety |
| Vite | 5.x | Build tool & dev server |
| Wouter | 3.x | Lightweight routing |
| TanStack Query | 5.x | Server state management |
| React Hook Form | 7.x | Form handling |
| Zod | 3.x | Schema validation |
| Shadcn/ui | Latest | UI component library |
| Tailwind CSS | 3.x | Utility-first styling |
| Leaflet | 1.9.x | Maps & geolocation |

### Backend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 20.x LTS | Runtime environment |
| Express.js | 4.x | Web framework |
| TypeScript | 5.x | Type safety |
| Drizzle ORM | Latest | Database ORM |
| Passport.js | Latest | Authentication middleware |
| Bcrypt | Latest | Password hashing |
| Express Session | Latest | Session management |

### Infrastructure & Services

| Service | Purpose |
|---------|---------|
| PostgreSQL (Neon) | Primary database |
| MinIO / S3 | Object storage (files, images) |
| Stripe | Payment processing |
| Twilio | SMS notifications |
| Nodemailer | Email notifications |
| TomTom | Geocoding & mapping |
| RapidAPI | Flight data integration |

---

## System Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT TIER                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Passenger  │  │    Driver    │  │    Admin     │      │
│  │   Dashboard  │  │   Dashboard  │  │   Dashboard  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  React SPA (PWA) + TanStack Query + Wouter Routing          │
│                                                               │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTPS / REST API
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                      APPLICATION TIER                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           Express.js Application Server              │   │
│  │                                                       │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │   │
│  │  │   Auth   │  │   API    │  │   Notification   │  │   │
│  │  │ Middleware│  │  Routes  │  │     Service      │  │   │
│  │  └──────────┘  └──────────┘  └──────────────────┘  │   │
│  │                                                       │   │
│  │  ┌──────────────────┐  ┌─────────────────────────┐ │   │
│  │  │  Storage Adapter │  │  Payment Integration    │ │   │
│  │  │  (S3/MinIO/Repl) │  │  (Stripe/PayPal/Square) │ │   │
│  │  └──────────────────┘  └─────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
└─────────┬─────────────────────────────┬─────────────────────┘
          │                             │
          │                             │
┌─────────▼─────────┐       ┌───────────▼──────────┐
│    DATA TIER      │       │   STORAGE TIER       │
├───────────────────┤       ├──────────────────────┤
│                   │       │                      │
│  ┌─────────────┐ │       │  ┌────────────────┐ │
│  │  PostgreSQL │ │       │  │  MinIO / S3    │ │
│  │   Database  │ │       │  │                │ │
│  │             │ │       │  │  • Documents   │ │
│  │  • Users    │ │       │  │  • Images      │ │
│  │  • Bookings │ │       │  │  • CMS Media   │ │
│  │  • Vehicles │ │       │  └────────────────┘ │
│  │  • Sessions │ │       │                      │
│  └─────────────┘ │       └──────────────────────┘
│                   │
└───────────────────┘
```

### Component Responsibilities

#### Client Tier
- **React Components**: UI rendering and user interaction
- **TanStack Query**: API data fetching, caching, synchronization
- **Wouter Router**: Client-side navigation
- **Service Workers**: Offline support and caching

#### Application Tier
- **Express Server**: HTTP request handling
- **Authentication Layer**: User identity and session management
- **API Routes**: Business logic and data validation
- **Storage Adapter**: Abstraction over object storage backends
- **Notification Service**: Email and SMS delivery
- **Payment Integration**: Stripe, PayPal, Square connectivity

#### Data Tier
- **PostgreSQL**: Relational data persistence
- **MinIO/S3**: Binary file storage
- **Session Store**: PostgreSQL-backed sessions

---

## Data Flow

### Booking Creation Flow

```
User → Frontend Form
  ↓
  1. Form Validation (Zod)
  ↓
  2. POST /api/bookings (TanStack Query Mutation)
  ↓
Backend Receives Request
  ↓
  3. Authentication Check (Passport)
  ↓
  4. Request Validation (Zod)
  ↓
  5. Calculate Pricing
  ↓
  6. Create Booking Record (Drizzle ORM)
  ↓
  7. Assign Driver (if applicable)
  ↓
  8. Process Payment (if Pay Now)
     ↓
     Stripe API
  ↓
  9. Send Notifications
     ↓
     Email (Nodemailer) + SMS (Twilio)
  ↓
  10. Return Booking Confirmation
  ↓
Frontend Updates
  ↓
  11. Cache Invalidation (TanStack Query)
  ↓
  12. Optimistic UI Update
  ↓
  13. Redirect to Confirmation Page
```

### File Upload Flow

```
User Selects File
  ↓
  1. Frontend Validation (size, type)
  ↓
  2. POST /api/driver/documents (multipart/form-data)
  ↓
Backend Receives File
  ↓
  3. Multer Middleware (memory storage)
  ↓
  4. Authentication Check
  ↓
  5. File Validation
  ↓
  6. Storage Adapter
     ↓
     MinIO / S3 / Replit Storage
  ↓
  7. Save Metadata to Database
  ↓
  8. Return File URL
  ↓
Frontend Displays Uploaded File
```

---

## Authentication & Authorization

### Authentication Strategies

The application supports two authentication strategies:

#### 1. Replit Auth (OIDC)
- **When**: Deployed on Replit
- **How**: OpenID Connect with Replit identity provider
- **Detection**: Presence of `REPLIT_DOMAINS` and `REPL_ID` env vars
- **Flow**: OAuth 2.0 Authorization Code flow

#### 2. Local Authentication
- **When**: Deployed on VPS/Coolify or locally
- **How**: Username/password with Bcrypt hashing
- **Storage**: PostgreSQL users table
- **Flow**: Traditional session-based authentication

### Authentication Flow (Local)

```
User Enters Credentials
  ↓
POST /api/auth/login
  ↓
Backend:
  1. Find user by username
  2. Compare password hash (Bcrypt)
  3. Create session (express-session)
  4. Store session in PostgreSQL
  5. Return session cookie
  ↓
Subsequent Requests:
  1. Browser sends session cookie
  2. Session middleware loads user
  3. Passport deserializes user
  4. Request.user populated
```

### Role-Based Access Control (RBAC)

```typescript
// User roles
enum UserRole {
  PASSENGER = 'passenger',
  DRIVER = 'driver',
  DISPATCHER = 'dispatcher',
  ADMIN = 'admin'
}

// Authorization middleware
function requireRole(roles: UserRole[]) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}
```

### Session Management

- **Storage**: PostgreSQL with `connect-pg-simple`
- **Cookie**: HTTP-only, Secure (in production), SameSite=Lax
- **Expiration**: Configurable (default: 7 days)
- **Secret**: Environment variable `SESSION_SECRET`

---

## Object Storage

### Storage Abstraction Layer

The application uses a unified storage adapter (`server/objectStorageAdapter.ts`) that supports three backends:

```typescript
interface StorageAdapter {
  upload(key: string, buffer: Buffer, contentType: string): Promise<void>;
  download(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  getPublicUrl(key: string): string;
}
```

### Storage Backend Selection

```
Environment Detection:
  ↓
  REPLIT_DOMAINS exists?
    → YES: Use Replit Object Storage
    → NO: Continue
  ↓
  MINIO_ENDPOINT exists?
    → YES: Use MinIO (S3-compatible)
    → NO: Continue
  ↓
  S3_BUCKET exists?
    → YES: Use AWS S3
    → NO: Error (no storage configured)
```

### Storage Organization

```
Bucket: usa-luxury-limo
├── public/
│   ├── logos/
│   │   └── {timestamp}-{filename}
│   └── hero-images/
│       └── {timestamp}-{filename}
├── .private/
│   ├── driver-documents/
│   │   └── {userId}/{documentType}/{timestamp}-{filename}
│   ├── profile-pictures/
│   │   └── {userId}/{timestamp}-{filename}
│   └── invoices/
│       └── {bookingId}/{timestamp}.pdf
```

### MinIO Configuration (VPS Deployment)

```yaml
# docker-compose.yml
minio:
  image: minio/minio:latest
  ports:
    - "9000:9000"  # API
    - "9001:9001"  # Console
  environment:
    - MINIO_ROOT_USER=minioadmin
    - MINIO_ROOT_PASSWORD=${MINIO_SECRET_KEY}
  volumes:
    - minio-data:/data
```

---

## Database Schema

### Core Tables

#### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(20) NOT NULL,  -- passenger, driver, dispatcher, admin
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### bookings
```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  service_type VARCHAR(20),  -- transfer, hourly
  vehicle_type_id UUID REFERENCES vehicle_types(id),
  pickup_address TEXT,
  dropoff_address TEXT,
  pickup_datetime TIMESTAMP,
  passenger_count INTEGER,
  total_price DECIMAL(10,2),
  status VARCHAR(20),  -- pending, confirmed, completed, cancelled
  payment_status VARCHAR(20),  -- unpaid, paid, refunded
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### vehicle_types
```sql
CREATE TABLE vehicle_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  capacity INTEGER,
  base_price DECIMAL(10,2),
  per_mile_rate DECIMAL(10,2),
  per_hour_rate DECIMAL(10,2),
  image_url TEXT
);
```

#### driver_documents
```sql
CREATE TABLE driver_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID REFERENCES users(id),
  document_type VARCHAR(50),  -- license, insurance, etc.
  file_key VARCHAR(500),
  file_name VARCHAR(255),
  expiration_date DATE,
  status VARCHAR(20),  -- pending, approved, rejected
  uploaded_at TIMESTAMP DEFAULT NOW()
);
```

### Session Table

```sql
CREATE TABLE session (
  sid VARCHAR NOT NULL PRIMARY KEY,
  sess JSON NOT NULL,
  expire TIMESTAMP(6) NOT NULL
);
CREATE INDEX idx_session_expire ON session (expire);
```

---

## API Architecture

### API Design Principles

- **RESTful**: Resource-based URLs, standard HTTP methods
- **JSON**: All requests and responses use JSON
- **Stateless**: No client state stored on server (except sessions)
- **Versioned**: Future-ready (can add `/api/v2` if needed)
- **Consistent**: Uniform error handling and response format

### API Response Format

**Success Response:**
```json
{
  "data": { ... },
  "message": "Success"
}
```

**Error Response:**
```json
{
  "error": "Error message",
  "details": { ... }  // optional
}
```

### API Endpoints Structure

```
/api
├── /auth
│   ├── POST /login
│   ├── POST /register
│   ├── POST /logout
│   └── GET /user
├── /bookings
│   ├── GET /
│   ├── POST /
│   ├── GET /:id
│   ├── PATCH /:id
│   └── POST /quote
├── /driver
│   ├── GET /jobs
│   ├── POST /jobs/:id/accept
│   ├── POST /jobs/:id/confirm
│   ├── POST /location
│   └── POST /documents
├── /admin
│   ├── GET /users
│   ├── GET /bookings
│   ├── POST /dispatch
│   └── GET /analytics
├── /payment
│   ├── POST /stripe
│   ├── POST /paypal
│   └── POST /square
├── /cms
│   ├── GET /logo
│   ├── POST /logo
│   ├── GET /hero
│   └── POST /hero
└── /health
    └── GET /
```

### Middleware Chain

```
Request
  ↓
1. CORS middleware
  ↓
2. Body parser (JSON)
  ↓
3. Session middleware
  ↓
4. Passport initialization
  ↓
5. Custom logging
  ↓
6. Route handler
  ↓
7. Error handler
  ↓
Response
```

---

## Frontend Architecture

### Component Organization

```
client/src/
├── components/
│   ├── ui/              # Shadcn components
│   ├── layout/          # Layout components
│   ├── booking/         # Booking-related components
│   ├── dashboard/       # Dashboard components
│   └── shared/          # Shared components
├── pages/               # Route pages (lazy loaded)
│   ├── PassengerDashboard.tsx
│   ├── DriverDashboard.tsx
│   ├── AdminDashboard.tsx
│   └── ...
├── lib/
│   ├── queryClient.ts   # TanStack Query setup
│   ├── utils.ts         # Utilities
│   └── api.ts           # API helpers
├── hooks/
│   ├── use-toast.ts
│   ├── use-auth.ts
│   └── ...
└── App.tsx              # Router + providers
```

### State Management Strategy

- **Server State**: TanStack Query
  - API data caching
  - Background refetching
  - Optimistic updates
  
- **Client State**: React useState/useContext
  - UI state (modals, forms)
  - Temporary data
  
- **Form State**: React Hook Form
  - Form validation
  - Error handling

### Lazy Loading Implementation

```typescript
// All pages lazy loaded for performance
const PassengerDashboard = lazy(() => import('./pages/PassengerDashboard'));
const DriverDashboard = lazy(() => import('./pages/DriverDashboard'));
// ... 49+ pages

// App.tsx
<Suspense fallback={<LoadingSpinner />}>
  <Route path="/passenger" component={PassengerDashboard} />
  <Route path="/driver" component={DriverDashboard} />
</Suspense>
```

---

## Deployment Architecture

### Production Deployment (Coolify)

```
Internet
  ↓
Coolify Proxy (Traefik)
  ↓ (HTTPS / Let's Encrypt)
  ↓
Docker Network
  ├── usa-luxury-limo (app container)
  │   ├── Node.js 20
  │   ├── Port 5000
  │   └── Health check: /health
  ├── usa-limo-minio (storage container)
  │   ├── MinIO server
  │   └── Port 9000/9001
  └── PostgreSQL (external)
      └── Neon Database
```

### Container Architecture

**Dockerfile Structure:**
```dockerfile
# Stage 1: Builder
FROM node:20-alpine AS builder
- Install dependencies
- Build TypeScript → JavaScript
- Output: dist/ folder

# Stage 2: Production
FROM node:20-alpine AS production
- Create non-root user (nodejs:nodejs)
- Copy built files from builder
- Install production dependencies only
- Run as non-root user
- Health check enabled
```

### Environment-Specific Configuration

| Environment | Auth | Storage | Database |
|-------------|------|---------|----------|
| Development (Replit) | Replit Auth | Replit Storage | Neon |
| Production (Coolify) | Local Auth | MinIO | Neon |
| Local Dev | Local Auth | MinIO (compose) | PostgreSQL |

---

## Security Architecture

### Security Layers

1. **Transport Security**
   - HTTPS (TLS 1.2+)
   - Let's Encrypt certificates (Coolify)
   - Secure cookies (HTTP-only, Secure flag)

2. **Authentication Security**
   - Bcrypt password hashing (cost factor: 10)
   - Session-based authentication
   - Session stored in PostgreSQL (not memory)
   - Random session secrets (32+ characters)

3. **Authorization Security**
   - Role-based access control (RBAC)
   - Middleware checks on every protected route
   - User context in every request

4. **Input Validation**
   - Zod schemas on frontend
   - Zod schemas on backend
   - SQL injection prevention (parameterized queries)
   - XSS prevention (React escaping + CSP headers)

5. **Data Security**
   - Sensitive files in .private/ directory
   - No credentials in code (environment variables)
   - Database connection over SSL
   - Object storage access control

6. **Container Security**
   - Non-root user in Docker container
   - Minimal base image (Alpine Linux)
   - Security updates (`apk upgrade`)
   - Image scanning (Trivy in CI/CD)

### Security Best Practices

```typescript
// Example: Secure file upload
router.post('/upload', 
  requireAuth,                    // 1. Authentication
  requireRole(['driver']),        // 2. Authorization
  validateFileType(['pdf', 'jpg']), // 3. File validation
  upload.single('file'),          // 4. Multer processing
  async (req, res) => {
    // 5. Virus scan (future enhancement)
    // 6. Upload to private storage
    // 7. Save metadata to DB
    // 8. Return success
  }
);
```

---

## Scalability & Performance

### Performance Optimizations

1. **Frontend**
   - Code splitting (React.lazy)
   - Image optimization (Sharp)
   - Query caching (TanStack Query)
   - Service worker caching
   - Gzip compression

2. **Backend**
   - Database connection pooling
   - PostgreSQL indexing
   - Async/await for I/O operations
   - Fire-and-forget notifications
   - Query optimization

3. **Database**
   - Indexed foreign keys
   - Efficient query patterns (Drizzle)
   - Connection pooling (Neon serverless)
   - Read replicas (future)

### Horizontal Scaling Strategy

**Current (Single Instance):**
```
Coolify → Single App Container → PostgreSQL
```

**Future (Multi-Instance):**
```
                 Coolify Load Balancer
                          ↓
        ┌─────────────────┼─────────────────┐
        ↓                 ↓                 ↓
    App Instance 1   App Instance 2   App Instance 3
        ↓                 ↓                 ↓
        └─────────────────┼─────────────────┘
                          ↓
                    PostgreSQL
                (with connection pooling)
```

**Stateless Design Benefits:**
- Sessions in PostgreSQL (not memory)
- No in-memory cache (TanStack Query on client)
- File storage external (MinIO/S3)
- Can scale horizontally without session affinity

### Monitoring & Observability

**Health Checks:**
```javascript
GET /health
Response: { status: 'ok' }

GET /api/health
Response: { 
  status: 'ok', 
  timestamp: '2025-11-08T...',
  database: 'connected',
  storage: 'available'
}
```

**Logging Strategy:**
- Application logs: stdout (Docker)
- Access logs: Express middleware
- Error logs: stderr
- Coolify aggregates all logs

---

## Integration Architecture

### External Service Integration

```
USA Limo App
  ├── Stripe API (Payments)
  │   └── Webhook: /api/webhooks/stripe
  ├── Twilio API (SMS)
  │   └── Fire-and-forget async
  ├── Nodemailer (Email)
  │   └── Fire-and-forget async
  ├── TomTom API (Geocoding)
  │   └── Real-time API calls
  └── RapidAPI (Flight Data)
      └── Real-time API calls
```

### Webhook Handling

```typescript
// Stripe webhook endpoint
router.post('/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    // 1. Verify webhook signature
    // 2. Process event
    // 3. Update booking status
    // 4. Send notification
    // 5. Return 200 immediately
  }
);
```

---

## Disaster Recovery

### Backup Strategy

1. **Database Backups**
   - Neon automatic backups (daily)
   - Point-in-time recovery available
   - Export critical data weekly

2. **Object Storage Backups**
   - MinIO replication (future)
   - Periodic S3 sync (future)
   - Critical documents exported monthly

3. **Code Repository**
   - GitHub as source of truth
   - Tagged releases for rollback
   - Branch protection on `main`

### Recovery Procedures

**Application Failure:**
1. Check Coolify logs
2. Rollback to previous deployment
3. Investigate issue
4. Fix and redeploy

**Database Failure:**
1. Restore from Neon backup
2. Point-in-time recovery if needed
3. Verify data integrity
4. Resume operations

---

## Future Enhancements

### Planned Architecture Improvements

1. **Caching Layer**
   - Redis for session storage
   - API response caching
   - Rate limiting

2. **Message Queue**
   - RabbitMQ / Redis Queue
   - Async job processing
   - Email/SMS queue

3. **Microservices**
   - Payment service
   - Notification service
   - Analytics service

4. **Real-Time Features**
   - WebSocket for live tracking
   - Server-Sent Events for updates
   - Push notifications

5. **Analytics**
   - Analytics dashboard
   - User behavior tracking
   - Performance monitoring

---

## Summary

The USA Luxury Limo application is built on a solid, scalable architecture that separates concerns, ensures security, and provides flexibility for deployment across multiple platforms. The use of modern technologies, containerization, and cloud-native practices makes it production-ready and maintainable.

For deployment instructions, see:
- [QUICK_START.md](QUICK_START.md) - Quick deployment guide
- [DEPLOYMENT.md](DEPLOYMENT.md) - Comprehensive deployment documentation
- [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) - Verification checklist
