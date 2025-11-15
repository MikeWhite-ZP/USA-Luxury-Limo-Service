# USA Luxury Limo

## Overview
USA Luxury Limo is a full-stack Progressive Web Application (PWA) with native mobile app capabilities, designed as a comprehensive luxury transportation booking platform. It aims to streamline the booking process by offering real-time pricing, fleet management, and multi-role user authentication for passengers, drivers, and dispatchers. Key capabilities include flight search integration, advanced payment options, and driver document management, providing an efficient solution for luxury transportation services. The application can be deployed as a web app, PWA, or native iOS/Android apps using Ionic Capacitor. The project's ambition is to be a leading solution in the luxury transportation market, offering an intuitive and efficient booking experience across all platforms.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX
The frontend is built with React 18, TypeScript, and Vite, utilizing Shadcn/ui components (Radix UI) styled with Tailwind CSS. It functions as a PWA with installable capabilities and offline support, and can be converted to native iOS/Android apps using Ionic Capacitor. Role-based login provides distinct dashboards: passenger (light red/white/black theme), driver (green theme), and dispatcher (purple theme). The design emphasizes a modern, professional aesthetic with consistent rounded corners and cohesive color schemes, using Tailwind utility classes. Device detection and auto-redirection manage mobile and desktop views, with user overrides.

### Technical Implementation
- **Frontend**: React 18, TypeScript, Vite, Wouter for routing, React Hook Form with Zod for validation, TanStack Query for server state. Features include optimistic updates, touch-optimized interfaces, and lazy loading for all page components using React.lazy() and Suspense for improved performance.
- **Mobile Native Apps**: Ionic Capacitor integration enables building native iOS and Android apps from the same codebase, including plugins for Camera, Geolocation, Push Notifications, Status Bar, Keyboard, and Splash Screen.
- **Backend**: Node.js with Express.js, TypeScript, RESTful JSON APIs.
- **Database**: PostgreSQL (Neon for hosting) with Drizzle ORM.
- **Authentication**: Replit Auth with OpenID Connect, **environment-aware session management** (PostgreSQL-backed in production via connect-pg-simple, MemoryStore in development), and scrypt hashing for multi-role access (passenger, driver, admin). **Production deployment requires `NODE_ENV=production` environment variable** to enable persistent PostgreSQL session storage, which is critical for login/register functionality across server restarts and load-balanced environments.
- **Object Storage**: Replit Object Storage with custom Buffer normalization for all downloads, supporting MinIO and AWS S3 via an abstract adapter. Dynamic credential loading and bucket auto-creation for MinIO. **Production-ready presigned URL system**: All GET endpoints dynamically generate time-limited presigned URLs (1-hour expiration) for images stored in MinIO, ensuring secure direct access without exposing credentials. Database stores only object storage keys (e.g., `/cms/vehicles/image.webp`); presigned URLs (e.g., `https://minio.best-chauffeurs.com/replit/image.webp?X-Amz-Algorithm=...`) are generated on-the-fly. Backwards compatible with legacy full URLs. DELETE operations use key extraction for reliable file removal.
- **Core Features**:
    - **Notifications**: Comprehensive email and SMS notification system (Twilio, Nodemailer) for all booking lifecycle events, using a fire-and-forget async pattern.
    - **Payment**: Integration with multiple providers (Stripe, PayPal, Square), supporting "Pay Now", "Pay Later", and "Pay with Cash" options, including surcharge management.
    - **Geolocation & Flight Data**: TomTom API for geocoding and AeroDataBox API for real-time flight information.
    - **Booking & Dispatch**: A 4-step booking flow, intelligent driver assignment, and a two-stage job acceptance workflow. Supports itemized pricing for transfer and hourly services.
    - **Driver Management**: Document upload/tracking, real-time GPS tracking, navigation integration, and driver payment/credential management.
    - **User/Admin Features**: User account management with cascading delete, support, system settings, a Dispatcher Dashboard, and API credential management. Database URL configuration allows admins to manage PostgreSQL connection strings directly from the admin panel with AES-256-GCM encryption (requires SETTINGS_ENCRYPTION_KEY environment variable set to a 64-character hex string for 32-byte key). Changes require application restart to take effect. **Password Recovery & Management**: Complete password reset system with SHA-256 hashed tokens (1-hour expiration), admin temporary password feature with email/SMS notifications, forgot password/username flows with anti-enumeration protection (uniform 202 responses), and user self-service reset via secure token links. All password reset data stored directly on users table (password_reset_token and password_reset_expires fields) with indexed lookups for performance.
    - **Vehicle Type Management**: Complete admin interface for managing system-wide vehicle types (add/edit/delete) with table view, search functionality, and active/inactive status control. Includes full CRUD operations with Zod validation and TanStack Query integration, including image upload to MinIO. Admin pricing page dynamically loads vehicle types from database instead of hardcoded values, ensuring real-time accuracy.
    - **Invoice Management**: Complete invoice system for viewing, editing, printing, and emailing detailed invoices.
    - **CMS**: Component-based Content Management System for brand identity, media assets, and service content management. Features include: Logo, Hero Image, and Favicon management with CRUD operations, MediaLibrary for image organization with 7 folder types (Logos, Hero, Favicon, Vehicles, Testimonials, General), and ServiceCMS for managing homepage service cards (create/edit/delete services with icons, features, images, and SEO-friendly slugs). Favicon updates dynamically across the entire application using TanStack Query with real-time cache synchronization. Dynamic PWA manifest.json endpoint serves favicon-based app icons with proper MIME type detection (PNG, JPEG, WEBP support), ETag-based cache invalidation, and automatic PWA icon updates when favicon changes. All CMS features accessible via AdminNav dropdown menu with proper authentication.

### System Design Choices
The application is designed for flexible deployment, supporting Replit, external Docker-based platforms (like Coolify), and native iOS/Android apps. It features a simplified Dockerfile for production builds, health check endpoints (`/health`, `/api/health`), and robust code splitting for performance. Object storage and authentication are abstracted to allow switching between Replit-specific services (Replit Object Storage, Replit Auth) and generic alternatives (MinIO/S3, custom authentication) based on environment variables.

**Security & Configuration**: 
- **Encryption**: Sensitive settings like DATABASE_URL are encrypted at rest using AES-256-GCM encryption. The `SETTINGS_ENCRYPTION_KEY` environment variable must be set to a 64-character hexadecimal string (representing a 32-byte key) for encryption features to work. Generate a secure key using: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
- **Admin Access Control**: Admin dashboard and API endpoints are protected by subdomain-based access control for enhanced security. The admin panel is only accessible via designated subdomains (e.g., `adminaccess.usaluxurylimo.net`). Frontend enforcement hides admin links and redirects non-admin domains away from admin routes. Backend enforcement validates hostname on all `/api/admin/*` endpoints, returning 403 for unauthorized domains. Configure allowed admin hosts using the `ADMIN_PANEL_HOSTS` environment variable (comma-separated list, e.g., "adminaccess.example.com,admin.example.net"). Frontend uses `VITE_ADMIN_PANEL_HOSTS` for client-side subdomain detection. Development mode bypasses hostname validation for easier local testing.

### Database Persistence & Production Deployment Best Practices

**Data Persistence Across Deployments:**
The application follows industry-standard practices to ensure all database data (users, bookings, vehicle types, settings, etc.) persists safely across deployments and application updates:

1. **External Managed Database** (Recommended):
   - Use a dedicated PostgreSQL instance hosted separately from your application container (e.g., Neon, DigitalOcean Managed Databases, AWS RDS, or Azure Database for PostgreSQL)
   - Your application connects via `DATABASE_URL` environment variable
   - Database lives independently of application deployments - data never lost during updates
   - Current setup uses Neon PostgreSQL, which already follows this best practice

2. **Docker Volume Persistence** (For self-hosted PostgreSQL):
   - If running PostgreSQL in Docker, mount database data to a host filesystem volume
   - Example in docker-compose.yml:
     ```yaml
     volumes:
       - /var/lib/postgresql/data:/var/lib/postgresql/data  # Host path:Container path
     ```
   - This ensures data survives container rebuilds and application redeployments

3. **Separation of Concerns**:
   - **Application Layer (Stateless)**: Docker containers can be destroyed and recreated freely
   - **Data Layer (Stateful)**: Database exists outside containers with persistent storage
   - Deployments only update application code, never touch database data

4. **Migration Management**:
   - Database schema changes are managed via Drizzle migrations (versioned in codebase)
   - Run migrations separately from application deployment: `npm run db:push` (development) or via CI/CD pipeline (production)
   - Never deploy schema changes directly to production without testing in staging first
   - Current schema includes all necessary indexes and constraints for production use

5. **Backup & Recovery**:
   - Configure automated daily backups with point-in-time recovery
   - Neon provides automated backups with configurable retention
   - For self-hosted: Use `pg_dump` scheduled via cron or backup solutions
   - Test recovery procedures periodically to validate backup integrity
   - Store backups in separate location from primary database (different region/provider)

6. **Environment Separation**:
   - **Staging Database**: Separate PostgreSQL instance for testing deployments
   - **Production Database**: Dedicated instance with stricter access controls
   - Never use production database credentials in development/staging
   - Use environment variables to inject correct DATABASE_URL per environment

7. **Deployment Workflow (Coolify/VPS)**:
   ```
   Step 1: Set required environment variables:
           - DATABASE_URL: pointing to external PostgreSQL
           - NODE_ENV=production (CRITICAL - enables PostgreSQL session storage)
           - SESSION_SECRET: secure random string for session encryption
   Step 2: Deploy application container (Dockerfile builds app)
   Step 3: Application connects to existing database - all data intact
   Step 4: Verify session table is auto-created in PostgreSQL
   Step 5: Optional: Run migrations if schema changed (in separate step before deployment)
   ```
   
   **CRITICAL**: Without `NODE_ENV=production`, the app uses in-memory sessions which:
   - Don't persist across server restarts
   - Cause login/register failures in load-balanced environments
   - Result in 500 errors on authentication endpoints

8. **Data Safety Guarantees**:
   - User accounts, active/inactive status, bookings, vehicle configurations, pricing rules, and all system settings are stored in PostgreSQL
   - As long as DATABASE_URL points to a persistent PostgreSQL instance, all data survives deployments
   - Application containers are ephemeral and stateless - they only contain code, not data
   - Redeploying application does not affect database content in any way

9. **Monitoring & Alerts**:
   - Monitor database connection health via health check endpoints (`/health`, `/api/health`)
   - Set up alerts for failed database connections, slow queries, and backup failures
   - Track database size growth and plan for scaling before hitting storage limits

**Quick Troubleshooting**:
- **"Data disappeared after deployment"**: DATABASE_URL likely changed or pointing to wrong instance - verify environment variables
- **"Cannot connect to database"**: Check network rules/firewall allow application server to reach database instance
- **"Schema mismatch errors"**: Run migrations with `npm run db:push` to sync schema
- **"Performance degradation"**: Check database connection pool settings and query performance

## External Dependencies
- **Twilio**: SMS messaging.
- **Stripe**: Payment processing.
- **PayPal**: Payment processing.
- **Square**: Payment processing.
- **TomTom**: Geocoding and location services.
- **Neon Database**: PostgreSQL hosting.
- **Replit Auth**: User authentication (optional).
- **Shadcn/ui**: UI component library.
- **TanStack Query**: Server state management.
- **Drizzle ORM**: Database ORM.
- **Tailwind CSS**: Styling.
- **Wouter**: React router.
- **React Hook Form**: Form management.
- **AeroDataBox API (via RapidAPI)**: Flight search.
- **Object Storage**: Replit Object Storage, MinIO, or AWS S3.
- **react-datepicker**: Date and time selection.
- **AWS SDK**: For S3-compatible storage.
- **Ionic Capacitor**: Framework for building native iOS and Android apps.