# USA Luxury Limo

## Overview

USA Luxury Limo is a full-stack luxury transportation booking platform that replicates the functionality of professional limousine services. The application provides a comprehensive booking system with real-time pricing, fleet management, and multi-role user authentication. Built as a Progressive Web Application (PWA), it features a React frontend with TypeScript, Express.js backend, PostgreSQL database with Drizzle ORM, and integrates with Stripe for payments and TomTom for geocoding services. The PWA functionality allows drivers, passengers, and dispatchers to install the app on their devices for quick access and offline capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and Montserrat font family
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation
- **Admin Navigation**: Reusable AdminNav component provides consistent navigation across all admin pages (pricing, credentials, user management, bookings)

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful APIs with JSON responses
- **Authentication**: Replit Auth integration with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL storage
- **File Processing**: Custom upload handling with object storage integration

### Database Design
- **Database**: PostgreSQL with connection pooling via Neon
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations and schema generation
- **Key Tables**: Users, drivers, vehicles, bookings, saved addresses, system settings, invoices, contact submissions

### Authentication & Authorization
- **Provider**: Replit Auth with OpenID Connect
- **Session Storage**: PostgreSQL-backed sessions with configurable TTL
- **User Roles**: Three-tier role system (passenger, driver, admin)
- **Security**: bcrypt for password hashing, secure session cookies

### Payment Processing
- **Multi-Provider Support**: Configurable payment systems for Stripe, PayPal, and Square
- **Implementation**: Dialog-based credential configuration with provider-specific fields
- **Configuration Flow**: 
  - Create new systems with full credential validation
  - Update existing systems with partial credential updates
  - Prefill non-secret fields when editing (publicKey, clientId, applicationId, locationId)
  - Never expose or prefill secret fields for security
- **Provider Mapping**:
  - Stripe: publicKey (pk_live_*), secretKey (sk_live_*), webhookSecret (whsec_*)
  - PayPal: clientId (→publicKey), clientSecret (→secretKey), webhookId (→webhookSecret)
  - Square: applicationId (→publicKey), accessToken (→secretKey), locationId (→config.locationId)
- **Security**: No raw credential storage in frontend, password-type inputs for secrets, server-side credential masking

### Geolocation Services
- **Provider**: TomTom API for address geocoding and suggestions
- **Features**: Real-time address autocomplete, coordinate conversion
- **Integration**: Configurable API keys via system settings
- **Fallback**: Graceful degradation when service unavailable

### Business Logic
- **Pricing Engine**: Complex fare calculation based on n8n workflow specifications
- **Service Types**: Transfer (point-to-point) and hourly booking options
- **Fleet Management**: Vehicle type definitions with capacity and pricing
- **Booking Flow**: Multi-step booking process with real-time validation
- **Commission System**: Configurable system commission percentage for calculating company earnings from completed bookings, displayed in admin dashboard alongside total revenue

### Driver Document Management
- **Document Types**: Four document types (Driver License, Limo License, Insurance Certificate, Vehicle Image)
- **Status Tracking**: Three-tier status system (pending, approved, rejected) with visual badges
- **Expiration Management**: 
  - Driver License, Limo License, and Insurance Certificate include expiration date tracking
  - Vehicle Image includes vehicle plate number instead of expiration date
- **Upload Flow**:
  - Initial upload: File + metadata → Status set to "pending" → Awaits admin review
  - Re-upload: Updates existing document → Status resets to "pending" → Notifies admins
- **Driver View**: Real-time status display with expiration dates, rejection reasons, and upload timestamps
- **Admin Review**: Admins can approve/reject documents with optional rejection reasons
- **Object Storage**: Files stored in Replit Object Storage under `driver-docs/{driverId}/` directory

### Progressive Web Application (PWA)
- **Installability**: App can be installed on any device (iOS, Android, Desktop) via browser prompt
- **Install Prompt**: Custom in-app prompt with "Install" and "Not now" options, dismissible per session
- **Service Worker**: Implements offline caching strategy for static assets and API responses
- **Manifest**: Web app manifest with app metadata, icons (72x72 to 512x512), and theme colors
- **Icons**: Auto-generated PWA icons from luxury limo stock image in 8 different sizes
- **Offline Support**: Network-first caching strategy with offline fallback to cached content
- **User Experience**: Works seamlessly for all user roles (passenger, driver, dispatcher/admin)
- **Installation**: Users can install from browser menu or via in-app prompt for quick access

## External Dependencies

- **Stripe**: Payment processing and customer management
- **TomTom**: Geocoding services and address suggestions
- **Neon Database**: PostgreSQL hosting with connection pooling
- **Replit Auth**: Authentication provider with OpenID Connect
- **Shadcn/ui**: Component library built on Radix UI
- **TanStack Query**: Server state management and caching
- **Drizzle ORM**: Type-safe database operations
- **Tailwind CSS**: Utility-first CSS framework
- **Wouter**: Lightweight React routing
- **React Hook Form**: Form state management and validation

## Docker Deployment

The application can be containerized and deployed using Docker:

### Files
- **Dockerfile**: Multi-stage build (builder + production) using Node 20 Alpine
- **docker-compose.yml**: Service orchestration with environment variables
- **.dockerignore**: Excludes node_modules, logs, and dev files from build context
- **.env.example**: Template for required environment variables

### Build Process
1. Builder stage: Installs all dependencies and runs `npm run build`
   - Frontend built to `dist/public/` via Vite
   - Backend bundled to `dist/index.js` via esbuild
2. Production stage: Copies built artifacts and production dependencies only

### Running with Docker
```bash
# Build the image
docker build -t usa-luxury-limo .

# Run with docker-compose (recommended)
docker-compose up -d

# Or run directly
docker run -p 5000:5000 --env-file .env usa-luxury-limo
```

### Environment Variables
All environment variables must be provided via `.env` file or docker-compose environment section:
- DATABASE_URL, STRIPE keys, Auth credentials, SESSION_SECRET, etc.
- See `.env.example` for complete list