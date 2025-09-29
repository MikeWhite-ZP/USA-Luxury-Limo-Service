# USA Luxury Limo

## Overview

USA Luxury Limo is a full-stack luxury transportation booking platform that replicates the functionality of professional limousine services. The application provides a comprehensive booking system with real-time pricing, fleet management, and multi-role user authentication. Built with modern web technologies, it features a React frontend with TypeScript, Express.js backend, PostgreSQL database with Drizzle ORM, and integrates with Stripe for payments and TomTom for geocoding services.

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
- **Provider**: Stripe integration for secure payment processing
- **Implementation**: Stripe Elements for PCI-compliant card collection
- **Features**: Customer creation, payment intents, tokenized card storage
- **Security**: No raw card data storage, tokenization-only approach

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