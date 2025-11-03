# USA Luxury Limo

## Overview
USA Luxury Limo is a full-stack Progressive Web Application (PWA) designed as a comprehensive luxury transportation booking platform. It aims to streamline the booking process by offering real-time pricing, fleet management, and multi-role user authentication for passengers, drivers, and dispatchers. Key capabilities include flight search integration, advanced payment options, and driver document management, providing an efficient solution for luxury transportation services. The project's ambition is to be a leading solution in the luxury transportation market, offering an intuitive and efficient booking experience.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX
The frontend is built with React 18, TypeScript, and Vite, utilizing Shadcn/ui components (Radix UI) styled with Tailwind CSS. It functions as a PWA with installable capabilities and offline support. Role-based login provides distinct dashboards: passenger dashboard uses a professional light red/white/black theme matching main website branding with clean logo presentation (no gradient backgrounds or effects), driver dashboard uses a green theme, and dispatcher dashboard uses a purple theme. The design emphasizes a modern, professional aesthetic with consistent rounded corners and cohesive color schemes. All styling uses Tailwind utility classes, avoiding hardcoded hex values. Device detection and auto-redirection manage mobile and desktop views, with user overrides.

### Technical Implementation
- **Frontend**: React 18, TypeScript, Vite, Wouter for routing, React Hook Form with Zod for validation, TanStack Query for server state. Features include optimistic updates and touch-optimized interfaces.
- **Backend**: Node.js with Express.js, TypeScript, RESTful JSON APIs.
- **Database**: PostgreSQL (Neon for hosting) with Drizzle ORM.
- **Authentication**: Replit Auth with OpenID Connect, PostgreSQL-backed session management, and scrypt hashing for multi-role access (passenger, driver, admin).
- **Object Storage**: Replit Object Storage with custom Buffer normalization for all downloads. Object storage returns data in serialized format (array-wrapped or plain objects with numeric keys) which is converted to proper Buffers for binary file serving. All download endpoints (driver documents, CMS media, email logos) use consistent conversion logic with strict error handling.
- **Core Features**:
    - **Notifications**: Comprehensive email and SMS notification system (Twilio, Nodemailer) for all booking lifecycle events, using a fire-and-forget async pattern.
    - **Payment**: Integration with multiple providers (Stripe, PayPal, Square), supporting "Pay Now", "Pay Later", and "Pay with Cash" options. Includes surcharge management.
    - **Geolocation & Flight Data**: TomTom API for geocoding and AeroDataBox API for real-time flight information.
    - **Booking & Dispatch**: A 4-step booking flow, intelligent driver assignment, and a two-stage job acceptance workflow. Supports itemized pricing for transfer and hourly services.
    - **Driver Management**: Document upload/tracking, real-time GPS tracking, navigation integration, and driver payment/credential management.
    - **User/Admin Features**: User account management with cascading delete, support, system settings, a Dispatcher Dashboard, and API credential management.
    - **Invoice Management**: Complete invoice system with modern light-themed interface for both admin and passengers, allowing viewing, editing, printing, and emailing of detailed invoices.
    - **CMS**: Component-based Content Management System for brand identity and media asset management (Logo and Hero Image), with CRUD operations. Media stored in Replit Object Storage.

## External Dependencies
- **Twilio**: SMS messaging.
- **Stripe**: Payment processing.
- **PayPal**: Payment processing.
- **Square**: Payment processing.
- **TomTom**: Geocoding and location services.
- **Neon Database**: PostgreSQL hosting.
- **Replit Auth**: User authentication (optional, falls back to regular auth).
- **Shadcn/ui**: UI component library.
- **TanStack Query**: Server state management.
- **Drizzle ORM**: Database ORM.
- **Tailwind CSS**: Styling.
- **Wouter**: React router.
- **React Hook Form**: Form management.
- **AeroDataBox API (via RapidAPI)**: Flight search.
- **Object Storage**: Flexible storage backend - supports Replit Object Storage, MinIO, or AWS S3.
- **react-datepicker**: Date and time selection.
- **AWS SDK**: For S3-compatible storage (MinIO/S3) integration.

## Deployment Options

The application is prepared for multiple deployment scenarios:

### Replit Deployment (Default)
- Uses Replit Auth for authentication
- Uses Replit Object Storage for file storage
- Environment variables automatically managed by Replit

### External Deployment (Coolify/VPS)
Complete preparation for deployment on Coolify or other Docker-based platforms:

#### Key Files:
- **Dockerfile**: Multi-stage production build (Node 20, Vite + esbuild)
- **docker-compose.yml**: Local testing with MinIO service
- **.env.example**: Comprehensive environment variable documentation
- **DEPLOYMENT.md**: Step-by-step Coolify deployment guide for Hostinger VPS

#### Storage Abstraction:
- **server/objectStorageAdapter.ts**: Unified storage interface
- Automatic backend detection based on environment variables
- Supports three storage options:
  1. **MinIO** (recommended for VPS) - Self-hosted S3-compatible storage
  2. **AWS S3** - Cloud-based object storage
  3. **Replit Object Storage** - For Replit deployments

#### Authentication Flexibility:
- **Replit Auth**: Automatically disabled when REPLIT_DOMAINS/REPL_ID not set
- **Fallback**: Uses regular authentication (auth.ts) for non-Replit deployments
- Graceful degradation ensures app works in any environment

#### Production Features:
- Health check endpoint for container monitoring
- Automatic SSL via Let's Encrypt (when using Coolify)
- MinIO console for file management
- Complete environment variable documentation
- PostgreSQL session storage
- Docker networking and volume management