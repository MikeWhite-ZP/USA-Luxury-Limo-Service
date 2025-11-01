# USA Luxury Limo

## Overview
USA Luxury Limo is a full-stack Progressive Web Application (PWA) designed as a comprehensive luxury transportation booking platform. It aims to streamline the booking process by offering real-time pricing, fleet management, and multi-role user authentication for passengers, drivers, and dispatchers. Key capabilities include flight search integration, advanced payment options, and driver document management, providing an efficient solution for luxury transportation services.

## Recent Changes
- **November 1, 2025**: Fixed delete user functionality - updated deleteUser method to properly handle all foreign key constraints including emergency incidents, driver documents, system settings, CMS content, and media uploads. User deletion now works correctly without constraint violations.
- **November 1, 2025**: Added Cash Payment capability - new payment option allowing admin-approved passengers to complete bookings and pay with cash after trip completion, without requiring saved payment methods. Includes cashPaymentEnabled field in users table, admin toggle in user edit dialog, and green-themed "Pay with Cash" button in booking flow step 4.
- **November 1, 2025**: Redesigned emailed invoice with professional modern design featuring dark gradient header with logo in white container, amber/gold accent colors for totals, improved visual hierarchy, enhanced spacing and shadows, and better mobile responsiveness
- **November 1, 2025**: Added visible print button to invoice print page - fixed top-right position with automatic print dialog on page load plus manual print button for better user experience
- **November 1, 2025**: Fixed past bookings filter to only show cancelled/completed bookings or past-dated bookings without active status - excludes pending, confirmed, pending_driver_acceptance, in_progress, on_the_way, arrived, and on_board statuses
- **November 1, 2025**: Fixed desktop booking form overflow issue by changing width from 110% to w-full max-w-full and optimizing spacing/padding for better responsive design
- **November 1, 2025**: Fixed future bookings filter in passenger dashboard - now shows all active bookings (not just pending/confirmed/in_progress), including on_the_way, arrived, and on_board statuses
- **November 1, 2025**: Created comprehensive MobileBookingForm component with multi-step flow, TomTom geocoding integration, real-time quote calculation, flight search, and payment options

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX
The frontend is built with React 18, TypeScript, and Vite, utilizing Shadcn/ui components (Radix UI) styled with Tailwind CSS. It functions as a PWA with installable capabilities and offline support. Role-based login provides distinct blue (passenger), green (driver), and purple (dispatcher) themed dashboards. The design emphasizes a modern, professional light theme with consistent gradient headers, rounded corners, and a professional color palette (blue/indigo/purple/pink/emerald/amber/orange/cyan). All styling uses Tailwind utility classes, avoiding hardcoded hex values.

**Device Detection & Auto-Redirect:**
- Automatic device detection routes mobile browsers to the `/mobile` PWA interface and desktop browsers to the standard web interface
- Detection based on user agent, screen width (<768px), and touch capability
- Manual preference override system stored in localStorage allows users to switch between mobile and desktop views
- Mobile users can access desktop site via "View Desktop Site" link on mobile splash page
- Desktop users can access mobile PWA via "Open Mobile Version" button on landing page
- Preferences persist across sessions and override automatic detection

**Admin Dashboard Design:**
- **Dashboard Stats**: Six color-coded stat cards with light gradient backgrounds (amber for Revenue, purple/pink for Commission, blue/cyan for Active Bookings, green/emerald for Drivers, orange/amber for Customer Satisfaction, red/rose for Awaiting Driver Approval). Each card features an icon badge, semi-transparent white data containers with backdrop blur, and smooth hover animations.
- **Admin Settings Sections**: Consistent gradient headers with icon badges across all sections (System Commission with indigo/blue, Email Settings with blue/indigo/green tabs, SMS Settings with purple/pink). Modern card-based layouts with color-coded information sections and professional typography.

### Technical Implementation
- **Frontend**: React 18, TypeScript, Vite, Wouter for routing, React Hook Form with Zod for validation, TanStack Query for server state. Features include optimistic updates, touch-optimized interfaces, and role-specific dashboards.
- **Backend**: Node.js with Express.js, TypeScript, RESTful JSON APIs.
- **Database**: PostgreSQL (Neon for hosting) with Drizzle ORM.
- **Authentication**: Replit Auth with OpenID Connect, PostgreSQL-backed session management, and scrypt hashing for multi-role access (passenger, driver, admin). Admin accounts require manual activation.
- **Core Features**:
    - **Notifications**: Comprehensive email and SMS notification system across all booking lifecycle events. Twilio for SMS and Nodemailer for email, with admin-configurable settings and professional HTML templates. Notifications use fire-and-forget async pattern to avoid blocking API responses.
        - **Booking Creation**: Email + SMS to passenger, email + SMS to admin, email to all dispatchers
        - **Booking Cancellation**: Email + SMS to passenger, admin email report
        - **Driver Assignment**: Email + SMS to driver (assignment details), email + SMS to passenger (driver assigned)
        - **Driver Status Updates**: Email + SMS to passenger when driver is "on the way" or "arrived"
        - **Email Templates** (6): Booking confirmation, booking cancelled, booking status update, driver assignment, driver on the way, driver arrived
        - **SMS Templates** (4): Booking confirmation, booking cancelled, driver assignment, booking status update, driver on the way, driver arrived, admin new booking alert
    - **Payment**: Integration with multiple providers (Stripe, PayPal, Square), supporting "Pay Now", "Pay Later", and "Pay with Cash" options. Pay Later requires saved payment methods on file. Cash Payment allows admin-approved passengers (with cashPaymentEnabled flag) to complete bookings without saved payment methods and pay cash after trip completion. Includes surcharge management.
    - **Geolocation & Flight Data**: TomTom API for geocoding and AeroDataBox API for real-time flight information.
    - **Booking & Dispatch**: A 4-step booking flow, intelligent driver assignment (proximity, capacity, rating, workload, conflicts), and a two-stage job acceptance workflow. Includes itemized pricing breakdown with base fare, surge pricing, gratuity, airport fees, and discounts, supporting both transfer and hourly services.
    - **Driver Management**: Document upload/tracking (Replit Object Storage), real-time GPS tracking, navigation integration, and driver payment/credential management.
    - **User/Admin Features**: User account management with cascading delete, contact support, system settings, a Dispatcher Dashboard with real-time statistics, and API credential management. Booking deletion properly handles cascading deletes for related records (invoices, driver ratings, emergency incidents).
    - **Invoice Management**: Complete invoice system with modern light-themed interface for both admin and passengers. Admin can view, edit, print, and email invoices with detailed pricing breakdowns. Passengers can view, print, and email their own invoices via the /mobile-invoices page. All invoice displays (dialog, print, email) show itemized pricing including base fare, surge pricing, gratuity, airport fees, and discounts with consistent color coding (orange for surge, green for discounts, blue for totals).
    - **CMS**: Component-based Content Management System for brand identity, media asset management (Replit Object Storage), and content editing.

## External Dependencies
- **Twilio**: SMS messaging.
- **Stripe**: Payment processing.
- **PayPal**: Payment processing.
- **Square**: Payment processing.
- **TomTom**: Geocoding and location services.
- **Neon Database**: PostgreSQL hosting.
- **Replit Auth**: User authentication.
- **Shadcn/ui**: UI component library.
- **TanStack Query**: Server state management.
- **Drizzle ORM**: Database ORM.
- **Tailwind CSS**: Styling.
- **Wouter**: React router.
- **React Hook Form**: Form management.
- **AeroDataBox API (via RapidAPI)**: Flight search.
- **Replit Object Storage**: Driver document and CMS media storage.
- **react-datepicker**: Date and time selection.