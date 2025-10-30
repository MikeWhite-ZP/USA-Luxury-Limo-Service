# USA Luxury Limo

## Overview
USA Luxury Limo is a full-stack Progressive Web Application (PWA) designed as a comprehensive luxury transportation booking platform. It offers real-time pricing, fleet management, and multi-role user authentication for passengers, drivers, and dispatchers. The platform aims to streamline the booking process, featuring flight search integration, advanced payment options, and driver document management, to provide a seamless and efficient solution for luxury transportation services.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes (October 30, 2025)
**BookingDetailsDialog Complete Redesign & Pricing Breakdown**: Comprehensive modern professional light theme transformation with automatic pricing breakdown display:

**Pricing Breakdown Enhancement**:
- **Automatic Display**: Fare breakdown now shows immediately after clicking "Calculate" button
- **Detailed Components**: Shows Base Fare, Surge Pricing (orange), Gratuity, Airport Fee, Subtotal, Discount (green), and Total Amount (blue)
- **Works for Both**: Displays for new bookings after calculation AND existing bookings with pricing data
- **Professional Blue Card**: Consistent bg-blue-50, border-blue-200, rounded-lg design
- **Color-Coded Amounts**: Orange for surge pricing, green for discounts, blue for totals

**Cross-Browser DateTime Support**:
- Implemented react-datepicker for consistent date selection across ALL browsers (Chrome, Firefox, Safari, Edge, etc.)
- Professional calendar picker with blue theme matching the application design
- Custom time selector with three separate dropdowns:
  - **Hours**: 1-12 (12-hour format)
  - **Minutes**: 00-55 with 5-minute intervals (00, 05, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55)
  - **AM/PM**: Clear AM/PM selection
- Custom styling with blue header, rounded corners, and smooth hover effects
- Prevents past date selection (minDate set to today)

**Left Panel (Journey Details) - Modern Professional Redesign**:
- **Main Header**: Blue-to-indigo gradient header with white MapPin icon badge showing Booking ID
- **Journey Details Card**: 
  - Professional light theme with refined spacing (p-6, space-y-6)
  - Icon-enhanced labels with color-coded icons (blue User, green/red MapPin, amber Navigation, indigo Clock)
  - Grouped sections with subtle background colors for visual hierarchy
  - Enhanced passenger search dropdown with two-line display (name + email/phone)
  - Booking Type & Vehicle section with slate-50 background and border
  - Via Points section with amber-50 background highlighting with individual stop cards
  - Schedule section with indigo-50 background containing date and time pickers
  - Time dropdowns with helpful labels (Hour, Minute, Period) beneath each selector
  - Refined borders (slate-200, slate-300) and improved focus states
- **Passenger Details Card**: Purple gradient header (purple-100 to pink-100) with purple-600 icon badge
- **Flight Information Card**: Emerald gradient header (emerald-100 to teal-100) with emerald-600 icon badge
- **Journey Log Card**: Amber gradient header (amber-100 to orange-100) with amber-600 icon badge
- **Professional Light Theme**: Consistent slate/blue/indigo/green/amber color palette throughout
- **Removed ALL Hardcoded Hex Colors**: No more #ff0000, #0052ff, etc.

**Right Panel (Dispatch & Invoice)**:
- **Dispatch Job Card**: Indigo gradient header (indigo-100 to violet-100) with indigo-600 icon badge
- **Invoice Card**: Blue-to-cyan gradient header with blue-600 icon badge
- **Change Driver Button**: Indigo-themed with border-indigo-300 and hover effects
- **Payment Method Card**: Blue-50 background with white inner card, rounded icon badge
- **Journey Fare Card**: Enhanced calculator with blue accents, styled input fields
- **Fare Breakdown Card**: Itemized pricing display with orange surge pricing, green discounts, blue totals
- **Additional Charges Card**: White cards on blue-50 background for each charge item
- **Add Charge Form**: Blue-themed form with proper labels, icons, and styled buttons
- **Total Fare Display**: Gradient blue-to-indigo card with bold blue text for total amount
- **Payment Action Buttons**: Red authorize button, blue-outlined proforma invoice button

**Design Standards Applied**:
- Consistent gradient headers with icon badges across all cards
- Professional color palette: blue/indigo/purple/emerald/amber/cyan
- Proper Tailwind utility classes throughout (no hardcoded hex values)
- Shadow-sm on all cards for subtle depth
- Rounded-lg corners on all containers
- Proper spacing and typography hierarchy
- Professional light theme across entire dialog

**User Management Redesign**: Modern, professional light theme for user accounts management:
- Purple/pink gradient header with icon badge for visual distinction
- Enhanced table design with gradient header row and rounded corners
- Improved search with icon and purple accent colors
- Color-coded action buttons (blue for documents, purple for edit, red for delete)
- Better spacing and typography throughout (p-4 padding, semibold fonts)
- Purple-themed hover effects and info boxes
- Professional star rating display with improved spacing

**API Credentials Redesign**: Modern, professional light theme for credentials management:
- Indigo/blue gradient header with icon badge matching Payment Systems and System Settings
- Enhanced credential cards with rounded corners, shadows, and hover effects
- Color-coded status badges (green for configured, gray for not configured)
- Purple/blue badges for ENV/DB source indicators
- Improved edit form with indigo background and better spacing
- Styled action buttons with color-coded hover states (indigo for edit, red for delete)
- Professional typography and consistent light theme palette

**Admin Dashboard Enhancement**: Added "Awaiting Driver Approval" stat card with modern professional styling:
- New card displays count of bookings waiting for driver acceptance (status: pending_driver_acceptance)
- Rose/pink gradient design with Clock icon for visual distinction
- Shows contextual notice when jobs are waiting
- Dashboard now has 6 stat cards in clean 2-row grid layout (3 columns per row)
- Maintains consistent dark-themed card design with gradient headers and hover effects

**Itemized Pricing Breakdown**: Complete transparency in fare calculations with detailed component display:
- Added pricing breakdown fields to bookings/invoices: baseFare, gratuityAmount, airportFeeAmount, surgePricingMultiplier, surgePricingAmount
- Enhanced price calculation workflow: base fare → surge pricing (multiplier × base) → add gratuity → add airport fees → apply discount
- Invoice display shows itemized breakdown: Base Fare, Surge Pricing (multiplier + amount), Gratuity, Airport Fees, Subtotal, Discount, Total
- Surge pricing correctly applies only to base fare (not to gratuity or airport fees)
- "All Days" option (-1 value) in surge pricing applies rules across entire week
- **Complete State Management**: All pricing fields (baseFare, gratuityAmount, airportFeeAmount, surgePricingMultiplier, surgePricingAmount, discountPercentage, discountAmount) fully integrated into bookingFormData state across all initialization points (initial state, openAddBookingDialog, openEditBookingDialog, saveBookingMutation reset)
- **Data Type Consistency**: String-to-number conversions handled properly in API submission to ensure validation passes

**User Discount System**: Comprehensive discount tracking and display across bookings and invoices:
- Added discount fields to bookings table (regularPrice, discountPercentage, discountAmount)
- Added discount fields to invoices table for transparent billing
- Price calculation API now returns detailed breakdown: regular price, discount amount, final price
- BookingDetailsDialog displays discount breakdown with green-themed UI when applicable
- All pricing flows now store and display discount information for complete transparency

**Pricing Enhancements**: Hourly services now have feature parity with transfer services:
- Added Airport Fees configuration for hourly bookings (airport code, fee, waiver minutes)
- Added Surge Pricing functionality for hourly bookings (day/time-based multipliers)
- "All Days" option (-1 value) in surge pricing for week-wide rules
- Schema validation updated to support -1 to 6 range for day selection

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