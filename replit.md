# USA Luxury Limo

## Overview
USA Luxury Limo is a full-stack luxury transportation booking platform designed as a Progressive Web Application (PWA). It provides a comprehensive system for real-time pricing, fleet management, and multi-role user authentication, catering to passengers, drivers, and dispatchers. The platform aims to streamline the booking process for luxury transportation services, offering features like flight search integration, advanced payment options, and driver document management.

## Recent Changes (October 20, 2025)
- **Dispatcher Dashboard Real-Time Statistics**: Replaced hardcoded statistics with real data from the system. The dispatcher dashboard now displays accurate, live metrics including active drivers (available and verified), active rides (in-progress bookings), pending requests (awaiting assignment), and fleet utilization percentage (vehicles currently in use vs. total active vehicles).

## Previous Changes (October 18, 2025)
- **Password Update Feature**: Implemented secure password update functionality for users. Backend validates current password using scrypt comparison before allowing updates. New passwords require minimum 8 characters with uppercase, lowercase, and numbers. Password update UI integrated in passenger dashboard Account Details section with real-time validation and user-friendly error messages.

## Previous Changes (October 17, 2025)
- **Fixed Flight Information Display Bug**: Added comprehensive console logging to track flight search and data restoration processes in admin booking dialog.
- **Backend Data Retrieval Fix**: Updated `getAllBookingsWithDetails()` in server/storage.ts to include all booking fields (flight information, passenger details, luggage, baby seat, etc.) that were previously missing from the API response.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript and Vite.
- **UI/UX**: Shadcn/ui components (Radix UI) with Tailwind CSS, custom design tokens, and Montserrat font.
- **State Management**: TanStack Query for server state.
- **Routing**: Wouter for client-side routing.
- **Form Handling**: React Hook Form with Zod validation.
- **PWA Features**: Installable with offline capabilities via service worker and web app manifest.

### Backend
- **Runtime**: Node.js with Express.js.
- **Language**: TypeScript with ES modules.
- **API**: RESTful APIs with JSON.
- **Authentication**: Replit Auth with OpenID Connect and PostgreSQL-backed session management, supporting three-tier roles (passenger, driver, admin).
- **Security**: scrypt password hashing, secure session cookies, and robust password validation.

### Database
- **Type**: PostgreSQL with Neon for connection pooling.
- **ORM**: Drizzle ORM for type-safe operations.
- **Schema Management**: Drizzle Kit for migrations.
- **Key Entities**: Users, drivers, vehicles, bookings, addresses, system settings, invoices, contact submissions.

### Core Features
- **Payment Processing**: Multi-provider support (Stripe, PayPal, Square) with secure credential handling and configurable payment systems. Supports "Pay Now" and conditional "Pay Later" options.
- **Geolocation**: TomTom API for geocoding, address autocomplete, and coordinate conversion.
- **Address Autocomplete**: Intelligent address input with TomTom suggestions and saved addresses. Admin booking form displays passenger's saved addresses (with labels and default badges) alongside TomTom suggestions for quick selection. Debounced API calls (300ms) reduce usage costs.
- **Flight Search**: AeroDataBox API for real-time flight search, configurable via RapidAPI key.
- **Pricing Engine**: Complex fare calculation based on service type (transfer/hourly) and vehicle type, incorporating system commissions and per-passenger discounts (percentage/fixed).
- **Booking Flow**: A 4-step process where bookings are finalized only after successful payment completion to prevent unpaid bookings.
- **Driver Management**: Document upload and approval system (Driver License, Limo License, Insurance, Vehicle Image) with expiration tracking, admin review, and Replit Object Storage integration.
- **User Account Management**: Users can update profiles and change passwords securely; admins manage user roles, `payLaterEnabled` status, and discount settings. Password updates require current password verification and enforce strong password requirements.
- **Contact Support**: Passenger contact form with submissions stored in the database for admin review.
- **System Settings**: Admin-configurable, system-wide key-value settings stored in the database (e.g., ADMIN_EMAIL).

## External Dependencies
- **Stripe**: Payment gateway.
- **TomTom**: Geocoding and location services.
- **Neon Database**: PostgreSQL hosting.
- **Replit Auth**: User authentication.
- **Shadcn/ui**: UI component library.
- **TanStack Query**: Server state management.
- **Drizzle ORM**: Database ORM.
- **Tailwind CSS**: Styling framework.
- **Wouter**: React router.
- **React Hook Form**: Form management.
- **AeroDataBox API (via RapidAPI)**: Flight search services.
- **Replit Object Storage**: Driver document storage.