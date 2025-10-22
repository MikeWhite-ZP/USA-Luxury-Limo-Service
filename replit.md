# USA Luxury Limo

## Overview
USA Luxury Limo is a full-stack Progressive Web Application (PWA) designed to be a comprehensive luxury transportation booking platform. It offers real-time pricing, fleet management, and multi-role user authentication for passengers, drivers, and dispatchers. The platform aims to streamline the booking process, featuring flight search integration, advanced payment options, and driver document management. Its ambition is to provide a seamless and efficient booking and dispatching solution for luxury transportation services, supporting growth in the premium chauffeured car market.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript and Vite.
- **UI/UX**: Utilizes Shadcn/ui components (Radix UI) styled with Tailwind CSS, custom design tokens, and the Montserrat font. Features a PWA with installable capabilities, offline support via service worker, and web app manifest.
- **State Management**: TanStack Query for server state.
- **Routing**: Wouter for client-side routing.
- **Form Handling**: React Hook Form with Zod validation.
- **Mobile PWA**: Implements smart install prompts (iOS/Android detection), a three-stage animated splash screen, role-based login with visual theming, and touch-optimized dashboards for passengers and drivers. Includes optimistic UI updates for instant feedback.
- **Driver Mobile App**: Green-themed, touch-optimized interface for driver management of rides (Upcoming, Completed), status updates, and navigation integration via Google Maps links.

### Backend
- **Runtime**: Node.js with Express.js.
- **Language**: TypeScript with ES modules.
- **API**: RESTful APIs with JSON.
- **Authentication**: Replit Auth with OpenID Connect and PostgreSQL-backed session management, supporting passenger, driver, and admin roles.
- **Security**: scrypt password hashing, secure session cookies, and robust password validation.

### Database
- **Type**: PostgreSQL with Neon for connection pooling.
- **ORM**: Drizzle ORM for type-safe operations, with Drizzle Kit for migrations.
- **Key Entities**: Users, drivers, vehicles, bookings, addresses, system settings, invoices, contact submissions.

### Core Features
- **SMS Notifications**: Twilio-based system for booking confirmations, status updates, and driver assignments, with secure credential management via Replit Secrets and admin settings.
- **Email Notifications**: SMTP-based system using Nodemailer, with admin-configurable settings and HTML email templates for various notifications.
- **Payment Processing**: Supports multiple providers (Stripe, PayPal, Square) with secure credential handling and flexible "Pay Now" / "Pay Later" options.
- **Geolocation**: TomTom API for geocoding, address autocomplete, and coordinate conversion.
- **Flight Search**: AeroDataBox API for real-time flight information.
- **Pricing Engine**: Complex fare calculation based on service and vehicle type, commissions, and discounts.
- **Booking Flow**: A 4-step process that finalizes bookings only after successful payment.
- **Driver Management**: Document upload, approval, and expiration tracking with Replit Object Storage integration.
- **User Account Management**: Secure profile and password updates for users; admin control over user roles, `payLaterEnabled` status, and discounts.
- **Contact Support**: Passenger contact form with submissions stored for admin review.
- **System Settings**: Admin-configurable key-value settings stored in the database.
- **Dispatcher Dashboard**: Real-time statistics, assign/reassign ride functionality, and fleet monitoring with live driver and vehicle status.

## External Dependencies
- **Twilio**: SMS messaging service.
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