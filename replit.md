# USA Luxury Limo

## Overview
USA Luxury Limo is a full-stack Progressive Web Application (PWA) with native mobile app capabilities, designed as a comprehensive luxury transportation booking platform. It aims to streamline the booking process by offering real-time pricing, fleet management, and multi-role user authentication for passengers, drivers, and dispatchers. Key capabilities include flight search integration, advanced payment options, and driver document management, providing an efficient solution for luxury transportation services. The application can be deployed as a web app, PWA, or native iOS/Android apps using Ionic Capacitor. The project's ambition is to be a leading solution in the luxury transportation market, offering an intuitive and efficient booking experience across all platforms.

## Recent Changes

### November 11, 2025
- **MinIO Credential Management**: Added comprehensive MinIO/S3-compatible object storage credential management to admin panel. Features include: dedicated MinIO Storage section in Settings dropdown with 6 configurable fields (Service Name, Console URL, S3 API URL, Access Key, Secret Key, Bucket Name), built-in connection testing with real-time validation, and seamless integration with existing credential management system. Admin can now configure and test MinIO connections directly from the web interface without manual environment variable configuration.
- **Admin Navigation Reorganization**: Consolidated Pricing, API Credentials, Payment Systems, and Vehicle Types menu items into the Settings dropdown menu for better organization and cleaner navigation. All functionality preserved.
- **Vehicle Type Pricing Fields**: Removed pricing input fields (hourlyRate, perMileRate, minimumFare) from Vehicle Type Management UI. Backend schema updated to make pricing fields optional. Pricing is now managed separately through the pricing rules system.
- **Dashboard Stats Redesign**: Modernized dashboard statistics section with professional design featuring clean white cards, subtle gradient accents, refined typography with uppercase tracking, and smooth hover effects with lift animations.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX
The frontend is built with React 18, TypeScript, and Vite, utilizing Shadcn/ui components (Radix UI) styled with Tailwind CSS. It functions as a PWA with installable capabilities and offline support, and can be converted to native iOS/Android apps using Ionic Capacitor. Role-based login provides distinct dashboards: passenger (light red/white/black theme), driver (green theme), and dispatcher (purple theme). The design emphasizes a modern, professional aesthetic with consistent rounded corners and cohesive color schemes, using Tailwind utility classes. Device detection and auto-redirection manage mobile and desktop views, with user overrides.

### Technical Implementation
- **Frontend**: React 18, TypeScript, Vite, Wouter for routing, React Hook Form with Zod for validation, TanStack Query for server state. Features include optimistic updates, touch-optimized interfaces, and lazy loading for all page components using React.lazy() and Suspense for improved performance.
- **Mobile Native Apps**: Ionic Capacitor integration enables building native iOS and Android apps from the same codebase, including plugins for Camera, Geolocation, Push Notifications, Status Bar, Keyboard, and Splash Screen.
- **Backend**: Node.js with Express.js, TypeScript, RESTful JSON APIs.
- **Database**: PostgreSQL (Neon for hosting) with Drizzle ORM.
- **Authentication**: Replit Auth with OpenID Connect, PostgreSQL-backed session management, and scrypt hashing for multi-role access (passenger, driver, admin).
- **Object Storage**: Replit Object Storage with custom Buffer normalization for all downloads, supporting MinIO and AWS S3 via an abstract adapter.
- **Core Features**:
    - **Notifications**: Comprehensive email and SMS notification system (Twilio, Nodemailer) for all booking lifecycle events, using a fire-and-forget async pattern.
    - **Payment**: Integration with multiple providers (Stripe, PayPal, Square), supporting "Pay Now", "Pay Later", and "Pay with Cash" options, including surcharge management.
    - **Geolocation & Flight Data**: TomTom API for geocoding and AeroDataBox API for real-time flight information.
    - **Booking & Dispatch**: A 4-step booking flow, intelligent driver assignment, and a two-stage job acceptance workflow. Supports itemized pricing for transfer and hourly services.
    - **Driver Management**: Document upload/tracking, real-time GPS tracking, navigation integration, and driver payment/credential management.
    - **User/Admin Features**: User account management with cascading delete, support, system settings, a Dispatcher Dashboard, and API credential management.
    - **Vehicle Type Management**: Complete admin interface for managing system-wide vehicle types (add/edit/delete) with table view, search functionality, and active/inactive status control. Includes full CRUD operations with Zod validation and TanStack Query integration.
    - **Invoice Management**: Complete invoice system for viewing, editing, printing, and emailing detailed invoices.
    - **CMS**: Component-based Content Management System for brand identity and media asset management (Logo and Hero Image), with CRUD operations.

### System Design Choices
The application is designed for flexible deployment, supporting Replit, external Docker-based platforms (like Coolify), and native iOS/Android apps. It features a simplified Dockerfile for production builds, health check endpoints (`/health`, `/api/health`), and robust code splitting for performance. Object storage and authentication are abstracted to allow switching between Replit-specific services (Replit Object Storage, Replit Auth) and generic alternatives (MinIO/S3, custom authentication) based on environment variables.

## External Dependencies
- **Twilio**: SMS messaging.
- **Stripe**: Payment processing.
- **PayPal**: Payment processing.
- **Square**: Payment processing.
- **TomTom**: Geocoding and location services.
- **Neon Database**: PostgreSQL hosting.
- **Replit Auth**: User authentication (optional).
- **Shadcn/ui**: UI component library.
- **TanStack Query**: Server state management.
- **Drizzle ORM**: Database ORM.
- **Tailwind CSS**: Styling.
- **Wouter**: React router.
- **React Hook Form**: Form management.
- **AeroDataBox API (via RapidAPI)**: Flight search.
- **Object Storage**: Replit Object Storage, MinIO, or AWS S3.
- **react-datepicker**: Date and time selection.
- **AWS SDK**: For S3-compatible storage.
- **Ionic Capacitor**: Framework for building native iOS and Android apps.