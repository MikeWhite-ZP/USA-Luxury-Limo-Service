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
- **Mobile PWA**: Implements smart install prompts (iOS/Android detection), a three-stage animated splash screen, role-based login with visual theming, and touch-optimized dashboards for passengers, drivers, and dispatchers. Includes optimistic UI updates for instant feedback.
- **Passenger Mobile App**: Blue-themed dashboard with quick booking, bookings list, invoice downloads, credit card management, and booking edit with price approval workflow.
- **Driver Mobile App**: Green-themed, touch-optimized interface for driver management of rides (Upcoming, Completed), status updates, real-time GPS tracking with live location updates, and navigation integration via universal Google Maps links.
- **Dispatcher Mobile App**: Purple-themed fleet management interface with real-time statistics dashboard, three-tab ride management (Pending/Assigned/Active), simplified driver assignment workflow with dropdown selection, and fleet monitor showing all drivers with GPS location integration and "View on Map" functionality.

### Backend
- **Runtime**: Node.js with Express.js.
- **Language**: TypeScript with ES modules.
- **API**: RESTful APIs with JSON.
- **Authentication**: Replit Auth with OpenID Connect and PostgreSQL-backed session management, supporting passenger, driver, and admin roles.
- **Security**: scrypt password hashing, secure session cookies, and robust password validation.
- **Async Notification Pattern**: Long-running operations (email/SMS) use fire-and-forget async execution to return HTTP responses immediately, ensuring fast UI feedback. Notifications are sent in background with comprehensive error handling.

### Database
- **Type**: PostgreSQL with Neon for connection pooling.
- **ORM**: Drizzle ORM for type-safe operations, with Drizzle Kit for migrations.
- **Key Entities**: Users, drivers, vehicles, bookings, addresses, system settings, invoices, contact submissions.

### Core Features
- **SMS Notifications**: Twilio-based system for booking confirmations, status updates, and driver assignments. Admin can view, edit, and manage Twilio credentials (Account SID, Auth Token, Phone Number) directly in the admin dashboard settings. Includes enable/disable toggle to control SMS sending. Credentials stored in database with fallback to environment variables. Connection status monitoring and test SMS functionality included.
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
- **Smart Driver Assignment System**: Intelligent driver matching and ranking system for optimal ride assignments. Features a comprehensive assignment dialog with search functionality (filter by passenger name or location), date range and vehicle type filters, and unified booking list showing both pending and already-assigned rides. Backend endpoint (`GET /api/admin/drivers/for-assignment`) enriches driver data with upcoming bookings, workload metrics, and schedule conflict detection. Smart ranking algorithm calculates match scores (0-100) based on multiple weighted criteria: proximity to pickup location (40% weight using Haversine distance formula), vehicle capacity matching (20% weight), driver rating (20% weight), active status, experience level, current workload, and schedule conflicts (-30% penalty). Real-time conflict detection identifies overlapping rides within 2-hour windows. Assignment dialog displays drivers sorted by match score with visual badges (Best Match 80+, Good Match 60-79, Fair Match <60), distance in miles from pickup, match reasons (e.g., "Very close", "Excellent rating"), warning indicators for conflicts or workload, and detailed driver info cards. One-click auto-assign feature automatically selects and assigns the highest-scoring driver (minimum 40 score required) with immediate mutation execution and comprehensive feedback toast showing match details. Distance calculation utility library (`client/src/lib/driverMatching.ts`) provides coordinate parsing, GPS distance calculations, conflict detection, and driver ranking functions. Supports both manual selection with enhanced visibility and fully automated smart assignment workflow.
- **GPS Tracking**: Real-time driver location tracking using `navigator.geolocation.watchPosition()`. Captures coordinates when driver is available, sends updates to backend (PATCH `/api/driver/location`), stores as JSON (`{lat, lng, timestamp}`) in `drivers.currentLocation` field. UI shows GPS status with three states: requesting permission, active (green pulse), or error.
- **Driver Navigation**: Tappable address cards (pickup/via/dropoff) on driver ride details screen. Each address opens device's native maps app (Apple Maps on iOS, Google Maps on Android) using universal link format: `https://maps.google.com/maps?daddr={lat},{lng}`. Falls back to address string if coordinates unavailable.
- **Driver Payment Management**: Comprehensive system for managing driver earnings with privacy controls and intelligent auto-calculation. Features a unified driver assignment workflow where admin/dispatcher selects driver and sees auto-calculated payment BEFORE finalizing assignment. Payment calculation uses system commission settings: `driverPayment = totalAmount × (1 - commissionPercentage / 100)`. Admin/dispatcher can manually override the calculated amount in the assignment dialog with visual indicators ("Manual Override" badge, "Reset" button to revert to calculated amount). After assignment, payment can be adjusted via dedicated "Edit Driver Payment" button (PATCH `/api/admin/bookings/:id/driver-payment`). Backend fallback: if frontend doesn't send payment, server auto-calculates using `SYSTEM_COMMISSION_PERCENTAGE` setting (default 30%). Critical security feature: drivers receive only `driverPayment` field via API (totalAmount is stripped from driver-facing endpoints), preventing drivers from accessing passenger fares. Driver dashboard and mobile apps display only driver payment amount, not total ride cost. Email/SMS notifications to drivers include their payment amount instead of total fare.
- **Driver Credentials**: Drivers can manage professional credentials (license numbers, certifications, etc.) in account settings via editable text field (PATCH `/api/driver/credentials`). Credentials are stored in `drivers.driverCredentials` field. When driver is assigned to a booking, their credentials are automatically shared with passengers and displayed in booking details across all passenger views (recent bookings, past bookings, full history). Passengers see driver name, phone, and credentials to build trust and verify driver qualifications.
- **Vehicle Plate Management**: Comprehensive vehicle plate tracking system. Admin can set and edit driver vehicle plates via User Manager dialog (only visible for driver role). Drivers can update their own vehicle plate in Account Settings tab (PATCH `/api/driver/vehicle-plate`). Vehicle plates stored in `drivers.vehiclePlate` field. When driver is assigned to a booking, their vehicle plate is displayed in booking details across admin dashboard, dispatcher dashboard, and passenger views. Displayed in monospace font styling for easy readability. Vehicle plate is optional and can be null.
- **Content Management System (CMS)**: Component-based website management system enabling administrators to customize brand identity and manage media assets without code. Features three main sections: Brand Settings (logo upload, primary/secondary/accent/background color customization with synchronized color pickers and hex inputs, company info editing, social media links, contact details, SEO settings), Media Library (drag-and-drop upload with organized folders for logos/hero-images/vehicles/testimonials/general, gallery view with image previews, metadata editing with alt text and descriptions, delete functionality with Object Storage cascade cleanup), and Content Editor (editable sections for hero/about/services/footer with rich text editing and media integration). All CMS data stored in PostgreSQL tables: `cms_settings` (key-value brand settings), `cms_content` (editable page sections with JSON content), and `cms_media` (media library with Object Storage integration). Backend API routes protected with `requireAdmin` middleware and comprehensive Zod validation. Frontend components use TanStack Query for efficient caching/invalidation, controlled inputs with key-based remounting to prevent state leakage during multi-item edits, and real-time color synchronization between pickers and hex inputs. CMS accessible via admin dashboard navigation with dedicated sections for each component.
- **Additional Charges & Payment Capture**: Comprehensive surcharge management system allowing admin and dispatcher users to add post-booking charges to existing bookings with detailed explanations. Surcharges stored as JSONB array in `bookings.surcharges` field with metadata (description, amount, addedBy, addedAt). Features role-based access control restricting functionality to admin/dispatcher roles only. UI displays existing charges in invoice breakdown, provides form to add new charges (description + amount inputs), and automatically recalculates total amount. Backend prevents double-counting by calculating base fare (current total minus existing surcharges) before adding new charges, with robust type coercion and error handling for edge cases. Stripe payment integration via "Authorize & Capture" button retrieves passenger's default payment method from Stripe customer record and creates PaymentIntent for updated total amount. API routes: POST `/api/bookings/:id/additional-charge` (add charge), POST `/api/bookings/:id/authorize-payment` (charge payment method). All operations include audit trail with user ID and timestamp.

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