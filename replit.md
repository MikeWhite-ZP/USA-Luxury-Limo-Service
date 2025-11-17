# USA Luxury Limo

## Overview
USA Luxury Limo is a full-stack Progressive Web Application (PWA) with native mobile app capabilities, designed as a comprehensive luxury transportation booking platform. It aims to streamline the booking process by offering real-time pricing, fleet management, and multi-role user authentication for passengers, drivers, and dispatchers. Key capabilities include flight search integration, advanced payment options, and driver document management, providing an efficient solution for luxury transportation services. The project's ambition is to be a leading solution in the luxury transportation market, offering an intuitive and efficient booking experience across all platforms.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX
The frontend is built with React 18, TypeScript, and Vite, utilizing Shadcn/ui components (Radix UI) styled with Tailwind CSS. It functions as a PWA with installable capabilities and offline support, and can be converted to native iOS/Android apps using Ionic Capacitor. Role-based login provides distinct dashboards for desktop and a unified modern light theme for mobile pages, optimized for responsiveness across devices. The design emphasizes a modern, professional aesthetic with consistent rounded corners and cohesive color schemes.

### Technical Implementation
- **Frontend**: React 18, TypeScript, Vite, Wouter for routing, React Hook Form with Zod for validation, TanStack Query for server state. Features optimistic updates, touch-optimized interfaces, and lazy loading.
- **Mobile Native Apps**: Ionic Capacitor integration enables building native iOS and Android apps from the same codebase, including plugins for Camera, Geolocation, Push Notifications, Status Bar, Keyboard, and Splash Screen.
- **Backend**: Node.js with Express.js, TypeScript, RESTful JSON APIs.
- **Database**: PostgreSQL (Neon for hosting) with Drizzle ORM.
- **Authentication**: Replit Auth with OpenID Connect, environment-aware session management (PostgreSQL-backed in production, MemoryStore in development), and scrypt hashing for multi-role access. Production deployment requires `NODE_ENV=production` for persistent PostgreSQL session storage. Complete password recovery and management system with secure tokens and anti-enumeration protection.
- **Object Storage**: Replit Object Storage with custom Buffer normalization, supporting MinIO and AWS S3 via an abstract adapter. Production-ready presigned URL system dynamically generates time-limited URLs for secure direct access to images.
- **Core Features**:
    - **Notifications**: Comprehensive email and SMS notification system (Twilio, Nodemailer) for booking lifecycle events using a fire-and-forget async pattern.
    - **Payment**: Integration with multiple providers (Stripe, PayPal, Square), supporting "Pay Now", "Pay Later", and "Pay with Cash" options, including surcharge management.
    - **Geolocation & Flight Data**: TomTom API for geocoding and AeroDataBox API for real-time flight information.
    - **Booking & Dispatch**: A 4-step booking flow, intelligent driver assignment, and a two-stage job acceptance workflow. Supports itemized pricing.
    - **Driver Management**: Document upload/tracking, dynamic real-time GPS tracking with interval-based updates (30s on duty, 60s idle), navigation integration, and driver payment/credential management.
    - **User/Admin Features**: User account management, support, system settings, Dispatcher Dashboard, API credential management. Database URL configuration allows admins to manage PostgreSQL connection strings with AES-256-GCM encryption.
    - **Vehicle Type Management**: Complete admin interface for CRUD operations on system-wide vehicle types, including image upload to MinIO and dynamic pricing page integration.
    - **Invoice Management**: Complete invoice system for viewing, editing, printing, and emailing detailed invoices.
    - **CMS**: Component-based Content Management System for brand identity, media assets, and service content management (Logo, Hero, Favicon, MediaLibrary, ServiceCMS). Dynamic PWA manifest.json endpoint for favicon-based app icons and real-time updates.

### System Design Choices
The application is designed for flexible deployment across Replit, external Docker-based platforms (like Coolify), and native iOS/Android apps. It features a simplified Dockerfile, health check endpoints, and robust code splitting. Object storage and authentication are abstracted to allow switching between Replit-specific services and generic alternatives.
- **Security & Configuration**: Sensitive settings are encrypted using AES-256-GCM. Admin dashboard and API endpoints are protected by subdomain-based access control, enforced both frontend and backend, configurable via `ADMIN_PANEL_HOSTS` environment variables.
- **Database Persistence**: Employs external managed PostgreSQL (Neon) for data persistence across deployments. Follows best practices for data safety including external managed databases, separation of concerns, migration management with Drizzle, backup/recovery strategies, environment separation, and robust deployment workflows. Requires `NODE_ENV=production` for persistent session storage in production environments.

## External Dependencies
- **Twilio**: SMS messaging.
- **Stripe, PayPal, Square**: Payment processing.
- **TomTom**: Geocoding and location services.
- **Neon Database**: PostgreSQL hosting.
- **Replit Auth**: User authentication.
- **Shadcn/ui**: UI component library.
- **TanStack Query**: Server state management.
- **Drizzle ORM**: Database ORM.
- **Tailwind CSS**: Styling.
- **Wouter**: React router.
- **React Hook Form**: Form management.
- **AeroDataBox API**: Flight search.
- **Replit Object Storage, MinIO, AWS S3**: Object Storage.
- **react-datepicker**: Date and time selection.
- **AWS SDK**: For S3-compatible storage.
- **Ionic Capacitor**: Native app framework.