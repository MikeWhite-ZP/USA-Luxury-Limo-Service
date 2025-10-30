# USA Luxury Limo

## Overview
USA Luxury Limo is a full-stack Progressive Web Application (PWA) designed as a comprehensive luxury transportation booking platform. It aims to streamline the booking process by offering real-time pricing, fleet management, and multi-role user authentication for passengers, drivers, and dispatchers. Key capabilities include flight search integration, advanced payment options, and driver document management, providing an efficient solution for luxury transportation services.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX
The frontend is built with React 18, TypeScript, and Vite, utilizing Shadcn/ui components (Radix UI) styled with Tailwind CSS. It functions as a PWA with installable capabilities and offline support. Role-based login provides distinct blue (passenger), green (driver), and purple (dispatcher) themed dashboards. The design emphasizes a modern, professional light theme with consistent gradient headers, rounded corners, and a professional color palette (blue/indigo/purple/pink/emerald/amber/orange/cyan). All styling uses Tailwind utility classes, avoiding hardcoded hex values.

**Admin Dashboard Design:**
- **Dashboard Stats**: Six color-coded stat cards with light gradient backgrounds (amber for Revenue, purple/pink for Commission, blue/cyan for Active Bookings, green/emerald for Drivers, orange/amber for Customer Satisfaction, red/rose for Awaiting Driver Approval). Each card features an icon badge, semi-transparent white data containers with backdrop blur, and smooth hover animations.
- **Admin Settings Sections**: Consistent gradient headers with icon badges across all sections (System Commission with indigo/blue, Email Settings with blue/indigo/green tabs, SMS Settings with purple/pink). Modern card-based layouts with color-coded information sections and professional typography.

### Technical Implementation
- **Frontend**: React 18, TypeScript, Vite, Wouter for routing, React Hook Form with Zod for validation, TanStack Query for server state. Features include optimistic updates, touch-optimized interfaces, and role-specific dashboards.
- **Backend**: Node.js with Express.js, TypeScript, RESTful JSON APIs.
- **Database**: PostgreSQL (Neon for hosting) with Drizzle ORM.
- **Authentication**: Replit Auth with OpenID Connect, PostgreSQL-backed session management, and scrypt hashing for multi-role access (passenger, driver, admin). Admin accounts require manual activation.
- **Core Features**:
    - **Notifications**: Twilio for SMS and Nodemailer for email, with admin-configurable settings and HTML templates.
    - **Payment**: Integration with multiple providers (Stripe, PayPal, Square), supporting "Pay Now" / "Pay Later" and surcharge management.
    - **Geolocation & Flight Data**: TomTom API for geocoding and AeroDataBox API for real-time flight information.
    - **Booking & Dispatch**: A 4-step booking flow, intelligent driver assignment (proximity, capacity, rating, workload, conflicts), and a two-stage job acceptance workflow. Includes itemized pricing breakdown with base fare, surge pricing, gratuity, airport fees, and discounts, supporting both transfer and hourly services.
    - **Driver Management**: Document upload/tracking (Replit Object Storage), real-time GPS tracking, navigation integration, and driver payment/credential management.
    - **User/Admin Features**: User account management with cascading delete, contact support, system settings, a Dispatcher Dashboard with real-time statistics, and API credential management.
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