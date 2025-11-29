# USA Luxury Limo Service

## Overview

USA Luxury Limo is a full-stack Progressive Web Application (PWA) designed for luxury transportation booking and management. The platform serves three primary user types: passengers booking rides, drivers managing assignments, and administrators/dispatchers overseeing operations. Built as a modern web application with PWA capabilities and native mobile app support through Capacitor, it provides real-time pricing, flight tracking integration, GPS-based driver tracking, and comprehensive booking management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The application uses **React 18 with TypeScript** as the core framework, built with **Vite** for fast development and optimized production builds. Routing is handled by **Wouter**, a lightweight alternative to React Router. The UI is built with **Shadcn/ui components** (based on Radix UI primitives) styled with **Tailwind CSS** for a modern, responsive design.

**State Management:** TanStack Query (React Query) manages all server state with optimistic updates and automatic cache invalidation. React Hook Form with Zod validation handles forms, providing type-safe validation schemas shared between frontend and backend.

**PWA Features:** Service workers enable offline functionality and app installation. The manifest is dynamically generated to support custom branding configured by administrators.

**Mobile Apps:** Ionic Capacitor converts the web app into native iOS and Android applications from the same codebase, with plugins for Camera, Geolocation, Push Notifications, and other native features.

### Backend Architecture

The backend is a **Node.js/Express** RESTful API built with TypeScript. All endpoints follow JSON API conventions with consistent error handling and response formats.

**Key Design Decision:** The server uses `esbuild` for production bundling with external package dependencies to reduce bundle size. Static files are served from a resolved path that works correctly in both development and bundled production environments.

**Authentication:** Uses Replit Auth with OpenID Connect for user authentication. Sessions are persisted differently based on environment - PostgreSQL-backed sessions in production for horizontal scaling, and MemoryStore in development for simplicity. Passwords use scrypt hashing. The system supports role-based access control for passengers, drivers, dispatchers, and admins.

**API Structure:** Routes are organized by domain (bookings, users, drivers, payments, admin). Middleware handles authentication checks, role authorization, and CSRF protection in production.

### Database Layer

**PostgreSQL with Drizzle ORM** provides type-safe database access. The schema is defined in TypeScript with automatic migration generation. The application uses **Neon** as the managed PostgreSQL provider for production deployments, ensuring data persistence across container restarts.

**Design Rationale:** PostgreSQL was chosen over MongoDB for ACID compliance, complex querying capabilities, and strong typing support. Drizzle ORM provides compile-time type safety while remaining lightweight compared to alternatives like TypeORM.

### Object Storage

A custom **storage adapter abstraction** supports both Replit Object Storage and S3-compatible services (MinIO, AWS S3). The implementation includes custom Buffer normalization to handle different provider quirks.

**Presigned URLs:** For security, the system generates time-limited presigned URLs for file access rather than serving files directly through the application server. This offloads bandwidth to the storage provider and prevents unauthorized access.

**Use Cases:** Driver document uploads (licenses, insurance), company branding assets (logos, hero images), and invoice attachments.

### Core Features & Design Decisions

**Booking Flow:** A 4-step wizard guides users through pickup/destination, vehicle selection, passenger details, and payment method. Real-time pricing calculations consider distance, vehicle type, surge pricing, discounts, and special requirements (baby seats, extra luggage).

**TomTom Integration:** Provides geocoding for address autocomplete and route calculation. Distance data feeds the pricing engine.

**Flight Tracking:** AeroDataBox API integration enables automatic flight number lookup, populating airline, airports, and estimated times for airport pickings/drop-offs.

**Payment Options:** Supports "Pay Now" (Stripe integration), "Pay Later" (authorized users), and "Pay with Cash". The system tracks payment status separately from booking status.

**Driver Management:** Two-stage job acceptance (accept → confirm with ETA) prevents overbooking. GPS tracking updates at configurable intervals (30s on duty, 60s idle). Drivers upload documents which admins can approve/reject.

**Notification System:** Fire-and-forget async notifications via email (Nodemailer) and SMS (Twilio) for booking lifecycle events. Non-blocking to prevent user-facing delays.

**Admin Features:** 
- Vehicle type CRUD with image uploads
- User management (all roles)
- System settings (API credentials, SMTP config, encrypted storage)
- Dispatcher dashboard for real-time booking oversight
- CMS for branding (logo, hero, favicon, company info)
- Invoice generation, editing, and email delivery

**Dynamic Branding:** Administrators can customize company name, logo, colors, and contact information through the admin panel. A public API endpoint (`/api/branding`) provides this data to the frontend, enabling white-label deployments. The PWA manifest is dynamically generated based on branding settings.

**Security Considerations:** 
- Subdomain-based admin access control (enforced in middleware and frontend)
- Sensitive settings encrypted with AES-256-GCM
- CSRF tokens in production
- Helmet.js for security headers
- Trust proxy configuration for proper IP detection behind reverse proxies

### Deployment Architecture

**Containerized with Docker:** Multi-stage Dockerfile reduces production image size. The build stage compiles frontend and backend separately, then copies only production artifacts to the final image.

**Health Checks:** `/health` endpoint enables container orchestration platforms (Coolify, Docker Compose) to verify application readiness.

**Environment-Aware:** Automatically detects production vs development via `NODE_ENV`. Static file serving, session storage, and logging behavior adjust accordingly.

**Coolify Support:** Optimized for deployment on Coolify with docker-compose configuration including PostgreSQL session storage, MinIO object storage, and automatic SSL certificates.

**Static File Resolution Fix:** Production builds resolve static files using `process.cwd()` instead of `__dirname` to handle esbuild bundling correctly. This prevents MIME type errors where HTML is served instead of JavaScript/CSS files.

## External Dependencies

- **Neon Database:** Managed PostgreSQL hosting
- **Stripe:** Payment processing for "Pay Now" bookings
- **TomTom API:** Geocoding, address autocomplete, and route distance calculation
- **AeroDataBox API:** Flight information lookup
- **Twilio:** SMS notifications
- **Nodemailer:** Email notifications (SMTP)
- **Replit Auth:** User authentication via OpenID Connect
- **MinIO or AWS S3:** Object storage for uploads (driver documents, branding images)
- **React/Vite ecosystem:** @vitejs/plugin-react, Tailwind CSS, PostCSS
- **UI Libraries:** Radix UI primitives, Shadcn/ui components, Lucide icons
- **Capacitor:** Native mobile app framework for iOS/Android builds