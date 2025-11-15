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
- **Authentication**: Replit Auth with OpenID Connect, PostgreSQL-backed session management, and scrypt hashing for multi-role access (passenger, driver, admin).
- **Object Storage**: Replit Object Storage with custom Buffer normalization for all downloads, supporting MinIO and AWS S3 via an abstract adapter. Dynamic credential loading and bucket auto-creation for MinIO. **Production-ready presigned URL system**: All GET endpoints dynamically generate time-limited presigned URLs (1-hour expiration) for images stored in MinIO, ensuring secure direct access without exposing credentials. Database stores only object storage keys (e.g., `/cms/vehicles/image.webp`); presigned URLs (e.g., `https://minio.best-chauffeurs.com/replit/image.webp?X-Amz-Algorithm=...`) are generated on-the-fly. Backwards compatible with legacy full URLs. DELETE operations use key extraction for reliable file removal.
- **Core Features**:
    - **Notifications**: Comprehensive email and SMS notification system (Twilio, Nodemailer) for all booking lifecycle events, using a fire-and-forget async pattern.
    - **Payment**: Integration with multiple providers (Stripe, PayPal, Square), supporting "Pay Now", "Pay Later", and "Pay with Cash" options, including surcharge management.
    - **Geolocation & Flight Data**: TomTom API for geocoding and AeroDataBox API for real-time flight information.
    - **Booking & Dispatch**: A 4-step booking flow, intelligent driver assignment, and a two-stage job acceptance workflow. Supports itemized pricing for transfer and hourly services.
    - **Driver Management**: Document upload/tracking, real-time GPS tracking, navigation integration, and driver payment/credential management.
    - **User/Admin Features**: User account management with cascading delete, support, system settings, a Dispatcher Dashboard, and API credential management. Database URL configuration allows admins to manage PostgreSQL connection strings directly from the admin panel with AES-256-GCM encryption (requires SETTINGS_ENCRYPTION_KEY environment variable set to a 64-character hex string for 32-byte key). Changes require application restart to take effect.
    - **Vehicle Type Management**: Complete admin interface for managing system-wide vehicle types (add/edit/delete) with table view, search functionality, and active/inactive status control. Includes full CRUD operations with Zod validation and TanStack Query integration, including image upload to MinIO. Admin pricing page dynamically loads vehicle types from database instead of hardcoded values, ensuring real-time accuracy.
    - **Invoice Management**: Complete invoice system for viewing, editing, printing, and emailing detailed invoices.
    - **CMS**: Component-based Content Management System for brand identity, media assets, and service content management. Features include: Logo, Hero Image, and Favicon management with CRUD operations, MediaLibrary for image organization with 7 folder types (Logos, Hero, Favicon, Vehicles, Testimonials, General), and ServiceCMS for managing homepage service cards (create/edit/delete services with icons, features, images, and SEO-friendly slugs). Favicon updates dynamically across the entire application using TanStack Query with real-time cache synchronization. Dynamic PWA manifest.json endpoint serves favicon-based app icons with proper MIME type detection (PNG, JPEG, WEBP support), ETag-based cache invalidation, and automatic PWA icon updates when favicon changes. All CMS features accessible via AdminNav dropdown menu with proper authentication.

### System Design Choices
The application is designed for flexible deployment, supporting Replit, external Docker-based platforms (like Coolify), and native iOS/Android apps. It features a simplified Dockerfile for production builds, health check endpoints (`/health`, `/api/health`), and robust code splitting for performance. Object storage and authentication are abstracted to allow switching between Replit-specific services (Replit Object Storage, Replit Auth) and generic alternatives (MinIO/S3, custom authentication) based on environment variables.

**Security & Configuration**: 
- **Encryption**: Sensitive settings like DATABASE_URL are encrypted at rest using AES-256-GCM encryption. The `SETTINGS_ENCRYPTION_KEY` environment variable must be set to a 64-character hexadecimal string (representing a 32-byte key) for encryption features to work. Generate a secure key using: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
- **Admin Access Control**: Admin dashboard and API endpoints are protected by subdomain-based access control for enhanced security. The admin panel is only accessible via designated subdomains (e.g., `adminaccess.usaluxurylimo.net`). Frontend enforcement hides admin links and redirects non-admin domains away from admin routes. Backend enforcement validates hostname on all `/api/admin/*` endpoints, returning 403 for unauthorized domains. Configure allowed admin hosts using the `ADMIN_PANEL_HOSTS` environment variable (comma-separated list, e.g., "adminaccess.example.com,admin.example.net"). Frontend uses `VITE_ADMIN_PANEL_HOSTS` for client-side subdomain detection. Development mode bypasses hostname validation for easier local testing.

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