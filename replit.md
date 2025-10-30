# USA Luxury Limo

## Overview
USA Luxury Limo is a full-stack Progressive Web Application (PWA) designed as a comprehensive luxury transportation booking platform. It offers real-time pricing, fleet management, and multi-role user authentication for passengers, drivers, and dispatchers. The platform aims to streamline the booking process, featuring flight search integration, advanced payment options, and driver document management, to provide a seamless and efficient solution for luxury transportation services.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes (October 30, 2025)
**Admin Dashboard & Pricing Redesign**: Completed comprehensive redesign with modern professional light theme:
- **Color Palette**: Replaced all red/orange/amber themes with blue/indigo/slate/green Tailwind utilities
- **Gradient Headers**: All major dashboard cards now feature gradient headers (blue/indigo/green/purple) with colored icon badges
- **No Hex Colors**: Eliminated all hardcoded hex values (#9e0202, #de0d0d, #f79952, etc.) in favor of Tailwind classes
- **Professional Styling**: Consistent light theme with slate borders, smooth hover effects, and semantic status badges
- **Sections Updated**: Payment Systems (green), System Settings (slate), CMS (blue/indigo), Bookings (purple), Pricing (blue)

**Admin Security Enhancement**: Improved admin account security:
- New admin accounts created as inactive by default, requiring manual activation by existing admins
- Login protection prevents inactive users from accessing the system
- User Management interface updated with professional gradient styling and status indicators

**User Deletion Fix**: Comprehensive cascading delete implementation:
- Properly handles all foreign key constraints (invoices → payment tokens, bookings → ratings, emergency incidents, messages)
- Safe deletion order: payment tokens → invoices → ratings → bookings → driver data → user
- Prevents database constraint violations when deleting users with bookings, invoices, or driver records

## System Architecture

### UI/UX
The frontend is built with React 18, TypeScript, and Vite, utilizing Shadcn/ui components (Radix UI) styled with Tailwind CSS. It functions as a PWA with installable capabilities, offline support, and an animated splash screen. Role-based login provides distinct blue (passenger), green (driver), and purple (dispatcher) themed dashboards. Key UI features include optimistic updates, touch-optimized interfaces, smart install prompts, and role-specific dashboards for booking, ride management, and fleet monitoring.

### Technical Implementation
- **Frontend**: React 18, TypeScript, Vite, Wouter for routing, React Hook Form with Zod for validation, TanStack Query for server state.
- **Backend**: Node.js with Express.js, TypeScript, RESTful JSON APIs.
- **Database**: PostgreSQL (Neon for hosting) with Drizzle ORM for type-safe operations.
- **Authentication**: Replit Auth with OpenID Connect, PostgreSQL-backed session management, and scrypt password hashing for secure multi-role access (passenger, driver, admin).
- **Core Features**:
    - **Notifications**: Twilio for SMS and Nodemailer for email, both with admin-configurable settings and HTML templates.
    - **Payment**: Integration with multiple providers (Stripe, PayPal, Square) supporting "Pay Now" / "Pay Later" options and a comprehensive surcharge management system with secure payment capture.
    - **Geolocation & Flight Data**: TomTom API for geocoding and AeroDataBox API for real-time flight information.
    - **Booking & Dispatch**: A 4-step booking flow, intelligent driver assignment with smart ranking (proximity, vehicle capacity, rating, workload, conflicts), and a two-stage job acceptance workflow for drivers.
    - **Driver Management**: Document upload/tracking (Replit Object Storage), real-time GPS tracking, navigation integration, and a system for managing driver payments (with privacy controls) and credentials.
    - **User/Admin Features**: User account management, contact support, system settings, and a Dispatcher Dashboard with real-time statistics and fleet monitoring.
    - **CMS**: Component-based Content Management System for brand identity, media asset management (Replit Object Storage), and content editing.

## External Dependencies
- **Twilio**: SMS messaging.
- **Stripe**: Payment processing.
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