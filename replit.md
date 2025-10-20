# USA Luxury Limo

## Overview
USA Luxury Limo is a full-stack luxury transportation booking platform designed as a Progressive Web Application (PWA). It provides a comprehensive system for real-time pricing, fleet management, and multi-role user authentication, catering to passengers, drivers, and dispatchers. The platform aims to streamline the booking process for luxury transportation services, offering features like flight search integration, advanced payment options, and driver document management.

## Recent Changes (October 20, 2025)
- **SMS Notification System**: Implemented comprehensive SMS notification system using Twilio integration via Replit connector. Features include:
  - **Secure Credential Management**: Uses Replit's Twilio connector for secure API key and account SID management
  - **Admin SMS Settings Interface**: Dedicated settings section in admin dashboard showing connection status, account SID, and configured phone number
  - **Test SMS Feature**: Built-in test SMS functionality to verify Twilio configuration before deployment
  - **Automated SMS Notifications**:
    - Booking confirmations sent to passengers upon booking creation with pickup details and scheduled time
    - Status update notifications sent to passengers when booking status changes (confirmed, in progress, completed, cancelled)
    - Driver assignment SMS sent to drivers when assigned to a ride with passenger and trip information
  - **Professional SMS Templates**: Clear, concise message templates optimized for SMS character limits
  - **Graceful Error Handling**: SMS failures don't block critical operations (bookings and status updates continue even if SMS fails)
  - **Parallel Email + SMS**: Both email and SMS notifications are sent for important events, providing redundant communication channels
  - **Phone Number Validation**: SMS only sent if user has valid phone number on file
- **Email Sending Functionality**: Implemented comprehensive email notification system throughout the application using Nodemailer for SMTP. Features include:
  - **Admin SMTP Configuration**: Two-tab interface in admin dashboard for configuring SMTP server settings (host, port, secure/TLS, username, password, from email, from name) with support for common providers (Gmail, Outlook, Yahoo, SendGrid)
  - **Correct SSL/TLS Handling**: Properly configured STARTTLS support for port 587 (secure: false, requireTLS: true) and direct SSL for port 465 (secure: true). Admin UI provides clear guidance on correct settings for each SMTP provider.
  - **Test Email Feature**: Built-in test email functionality to verify SMTP configuration before deployment
  - **Automated Email Notifications**:
    - Contact form submissions automatically email admin with form details
    - Booking confirmations sent to passengers upon booking creation with complete trip details
    - Status update notifications sent to passengers when booking status changes (pending → confirmed → in progress → completed)
    - Driver assignment emails sent to drivers when assigned to a ride with passenger and trip information
  - **Professional Email Templates**: Responsive HTML email templates with company branding, gradient headers, and mobile-friendly design
  - **Graceful Error Handling**: Email failures don't block critical operations (bookings, status updates continue even if email fails)
  - **Cached SMTP Transport**: Efficient SMTP connection management with 5-minute caching to reduce overhead
  - **SMTP Configuration Notes**:
    - Port 587: Use SSL/TLS = No (STARTTLS automatically enabled)
    - Port 465: Use SSL/TLS = Yes (direct SSL connection)
    - Gmail requires App Passwords (not regular password) with 2-Step Verification enabled
- **Dispatcher Dashboard Real-Time Statistics**: Replaced hardcoded statistics with real data from the system. The dispatcher dashboard now displays accurate, live metrics including active drivers (available and verified), active rides (in-progress bookings), pending requests (awaiting assignment), and fleet utilization percentage (vehicles currently in use vs. total active vehicles).
- **Dispatcher Assign/Reassign Ride Functionality**: Implemented comprehensive ride assignment and reassignment workflow for dispatchers. Features include:
  - Three-panel dialog layout showing pending bookings (unassigned), already assigned bookings (with current driver), and available drivers
  - Visual indicators for assignment status (blue highlight for pending, orange highlight for reassignment)
  - Current driver information prominently displayed for assigned bookings
  - Dynamic button text ("Assign Driver" vs "Reassign Driver") based on booking selection
  - One-click assignment or driver change with automatic statistics updates
  - Differentiated success messages for new assignments vs. reassignments
  - Full mobile responsiveness across all three panels
- **Fleet Monitoring Functionality**: Implemented real-time fleet monitoring system for dispatchers. Features include:
  - Live overview of all drivers and vehicles with status breakdown (Available, On Ride, Offline, Total)
  - Detailed driver cards displaying current status, ratings, total rides, and contact information
  - Real-time ride information showing current passenger, pickup/destination, and scheduled time for drivers on active rides
  - Vehicle information display (type and plate number)
  - Color-coded status badges (green for available, blue for on ride, orange for offline)
  - Auto-refreshing data when dialog opens
  - Comprehensive fleet summary statistics at the top of the monitor

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
- **SMS Notifications**: Comprehensive Twilio-based SMS system using Replit's Twilio connector for secure credential management. Automated SMS notifications for booking confirmations, status updates, and driver assignments. Professional SMS templates optimized for mobile delivery. Test SMS functionality for configuration verification. Graceful error handling ensures SMS failures don't block critical operations.
- **Email Notifications**: Comprehensive SMTP-based email system using Nodemailer with admin-configurable SMTP settings (host, port, authentication, SSL/TLS). Automated email notifications for contact form submissions, booking confirmations, status updates, and driver assignments. Professional HTML email templates with responsive design. Test email functionality for configuration verification.
- **Payment Processing**: Multi-provider support (Stripe, PayPal, Square) with secure credential handling and configurable payment systems. Supports "Pay Now" and conditional "Pay Later" options.
- **Geolocation**: TomTom API for geocoding, address autocomplete, and coordinate conversion.
- **Address Autocomplete**: Intelligent address input with TomTom suggestions and saved addresses. Admin booking form displays passenger's saved addresses (with labels and default badges) alongside TomTom suggestions for quick selection. Debounced API calls (300ms) reduce usage costs.
- **Flight Search**: AeroDataBox API for real-time flight search, configurable via RapidAPI key.
- **Pricing Engine**: Complex fare calculation based on service type (transfer/hourly) and vehicle type, incorporating system commissions and per-passenger discounts (percentage/fixed).
- **Booking Flow**: A 4-step process where bookings are finalized only after successful payment completion to prevent unpaid bookings.
- **Driver Management**: Document upload and approval system (Driver License, Limo License, Insurance, Vehicle Image) with expiration tracking, admin review, and Replit Object Storage integration.
- **User Account Management**: Users can update profiles and change passwords securely; admins manage user roles, `payLaterEnabled` status, and discount settings. Password updates require current password verification and enforce strong password requirements.
- **Contact Support**: Passenger contact form with submissions stored in the database for admin review.
- **System Settings**: Admin-configurable, system-wide key-value settings stored in the database (e.g., ADMIN_EMAIL, SMTP settings).

## External Dependencies
- **Twilio**: SMS messaging service via Replit connector.
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