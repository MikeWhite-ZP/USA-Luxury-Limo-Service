# USA Luxury Limo Service

A comprehensive, full-stack Progressive Web Application (PWA) for luxury transportation booking. Built with modern technologies to provide a seamless booking experience for passengers, drivers, and dispatchers.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-20.x-green.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.x-blue.svg)

## 🚀 Deployment

- **Coolify (Production):** [COOLIFY_DEPLOYMENT.md](COOLIFY_DEPLOYMENT.md) - Complete guide for VPS deployment
- **Quick Fix:** [QUICK_FIX_COOLIFY.md](QUICK_FIX_COOLIFY.md) - Fix white screen / asset errors
- **Troubleshooting:** [TROUBLESHOOTING_DEPLOYMENT.md](TROUBLESHOOTING_DEPLOYMENT.md) - Common issues

## Features

### For Passengers
- 🚗 **Real-time Pricing** - Instant quotes for transfers and hourly bookings
- ✈️ **Flight Integration** - Automatic flight tracking and driver coordination
- 💳 **Flexible Payments** - Pay Now (Stripe), Pay Later, or Cash options
- 📱 **Mobile-First PWA** - Install on your device for app-like experience
- 🗺️ **Live Tracking** - Track your driver in real-time
- 📧 **Instant Notifications** - Email and SMS updates for booking status

### For Drivers
- 📍 **GPS Navigation** - Turn-by-turn directions to pickup/dropoff
- 📄 **Document Management** - Upload and track certifications
- 💰 **Payment Tracking** - View earnings and payment history
- 🔔 **Job Alerts** - Real-time notifications for new assignments
- ✅ **Two-Stage Acceptance** - Accept and confirm jobs with ETA updates

### For Dispatchers & Admins
- 🎯 **Smart Dispatch** - Intelligent driver assignment based on availability
- 📊 **Analytics Dashboard** - Real-time booking and revenue insights
- 👥 **User Management** - Manage passengers, drivers, and their roles
- 🚙 **Fleet Management** - Vehicle types, pricing rules, and availability
- 🎨 **CMS** - Customize branding, logos, and hero images
- 📧 **Communication Hub** - Send notifications and manage customer support

## Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: Wouter
- **State Management**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod validation
- **UI Components**: Shadcn/ui (Radix UI) + Tailwind CSS
- **Maps**: React Leaflet
- **PWA**: Installable with offline support

### Backend
- **Runtime**: Node.js 20
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: OpenID Connect (Replit Auth) with fallback
- **Session Storage**: PostgreSQL-backed sessions
- **Object Storage**: MinIO (S3-compatible) / AWS S3 / Replit Storage

### External Services
- **Payments**: Stripe, PayPal, Square
- **SMS**: Twilio
- **Email**: Nodemailer (SMTP)
- **Geocoding**: TomTom API
- **Flight Data**: AeroDataBox via RapidAPI

### DevOps
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Docker Compose
- **Deployment**: Coolify-ready (Ubuntu VPS)
- **Database Hosting**: Neon PostgreSQL
- **SSL**: Let's Encrypt (via Coolify)

## Quick Start

### Prerequisites
- Node.js 20.x or higher
- PostgreSQL database
- MinIO or S3-compatible storage (for production)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/new-usa-luxury-limo-service.git
   cd new-usa-luxury-limo-service
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Push database schema**
   ```bash
   npm run db:push
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open in browser**
   ```
   http://localhost:5000
   ```

### Docker Compose (Local Testing)

```bash
# Start MinIO and the app
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Deployment

This application is ready for deployment on Coolify (Ubuntu VPS) or any Docker-based platform.

### Quick Deployment Guides
- 📘 [Quick Start Guide](QUICK_START.md) - Deploy in 5 minutes
- 📗 [GitHub Setup Guide](GITHUB_SETUP.md) - Create and upload to GitHub
- 📕 [Full Deployment Guide](DEPLOYMENT.md) - Comprehensive Coolify deployment
- ✅ [Deployment Checklist](DEPLOYMENT_CHECKLIST.md) - Pre/post-deployment validation
- 🏗️ [Architecture Guide](ARCHITECTURE.md) - System architecture and design

### Deployment Options

#### Option 1: Coolify (Recommended for VPS)
- Automatic SSL with Let's Encrypt
- Zero-downtime deployments
- Built-in monitoring and logs
- See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions

#### Option 2: Replit
- Native Replit Auth support
- Automatic environment setup
- One-click deployment

#### Option 3: Manual Docker
- Deploy Docker image to any host
- Configure reverse proxy (Caddy/Nginx)
- Manage SSL certificates manually

## Environment Variables

Key environment variables needed for deployment:

```bash
# Required
DATABASE_URL=postgresql://user:password@host:5432/database
SESSION_SECRET=your-random-session-secret
STRIPE_SECRET_KEY=sk_live_your_stripe_key
VITE_STRIPE_PUBLIC_KEY=pk_live_your_public_key

# Storage (choose one)
MINIO_ENDPOINT=http://minio:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=your-minio-password
MINIO_BUCKET=usa-luxury-limo

# Optional but recommended
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TOMTOM_API_KEY=your-tomtom-key
```

See [.env.example](.env.example) for complete documentation.

## Project Structure

```
usa-luxury-limo/
├── client/               # Frontend React application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components (lazy loaded)
│   │   ├── lib/          # Utilities and helpers
│   │   └── hooks/        # Custom React hooks
├── server/               # Backend Express application
│   ├── routes.ts         # API route definitions
│   ├── storage.ts        # Storage interface (MemStorage/DB)
│   ├── auth.ts           # Authentication logic
│   ├── objectStorageAdapter.ts  # Unified storage abstraction
│   └── index.ts          # Server entry point
├── shared/               # Shared types and schemas
│   └── schema.ts         # Drizzle database schema + Zod types
├── Dockerfile            # Production Docker image
├── docker-compose.yml    # Local development with MinIO
└── DEPLOYMENT.md         # Deployment documentation
```

## API Endpoints

### Public Routes
- `GET /api/vehicle-types` - List available vehicle types
- `GET /api/pricing-rules/available` - Get pricing information
- `POST /api/bookings/quote` - Get booking price quote
- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - User registration

### Protected Routes (Passenger)
- `GET /api/bookings` - List user's bookings
- `POST /api/bookings` - Create new booking
- `POST /api/payment/stripe` - Process Stripe payment
- `GET /api/invoices/:id` - View invoice

### Protected Routes (Driver)
- `GET /api/driver/jobs` - Get assigned jobs
- `POST /api/driver/jobs/:id/accept` - Accept job
- `POST /api/driver/location` - Update GPS location
- `POST /api/driver/documents` - Upload documents

### Protected Routes (Admin/Dispatcher)
- `GET /api/admin/users` - Manage users
- `POST /api/admin/dispatch` - Assign drivers
- `GET /api/admin/analytics` - View analytics
- `POST /api/cms/logo` - Update site logo

See [ARCHITECTURE.md](ARCHITECTURE.md) for complete API documentation.

## Database Schema

The application uses PostgreSQL with Drizzle ORM. Key tables:

- **users** - User accounts (passengers, drivers, admins)
- **bookings** - Trip bookings and reservations
- **vehicle_types** - Fleet vehicle categories
- **pricing_rules** - Dynamic pricing configuration
- **driver_documents** - Driver certifications and licenses
- **invoices** - Billing and payment records
- **cms_settings** - Site customization (logo, hero, etc.)

Run migrations with:
```bash
npm run db:push
```

## Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run db:push      # Push schema changes to database
npm run db:studio    # Open Drizzle Studio (database GUI)
```

### Code Style

- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting (via editor)
- Tailwind CSS for styling (no inline styles)

### Testing

End-to-end testing with Playwright:
```bash
npm run test:e2e
```

## Performance Optimizations

- ⚡ **Code Splitting** - All 49+ pages lazy loaded with React.lazy()
- 🗜️ **Bundle Optimization** - Tree shaking and minification
- 🎯 **Query Caching** - TanStack Query for server state
- 🔄 **Optimistic Updates** - Instant UI feedback
- 📦 **Image Optimization** - Sharp for server-side processing
- 💾 **Session Persistence** - PostgreSQL-backed sessions

## Security Features

- 🔐 **Password Hashing** - Scrypt algorithm
- 🛡️ **CSRF Protection** - Express session middleware
- 🔑 **Environment Secrets** - Never committed to repository
- 📜 **Content Security Policy** - Headers configured
- 🚫 **SQL Injection Prevention** - Parameterized queries via Drizzle
- ✅ **Input Validation** - Zod schemas on all forms

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## PWA Features

- 📱 **Installable** - Add to home screen on mobile
- 🔌 **Offline Ready** - Service worker caching
- 🔔 **Push Notifications** - (optional, can be enabled)
- 🎨 **App-Like Experience** - Full-screen mode

## Contributing

This is a private project. For authorized contributors:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Troubleshooting

### Common Issues

**502 Bad Gateway (Coolify)**
- Ensure app listens on `0.0.0.0:5000` (already configured)
- Check environment variables are set correctly

**Database Connection Errors**
- Verify `DATABASE_URL` is correct
- Check database firewall allows connections

**File Upload Failures**
- Confirm MinIO/S3 credentials are correct
- Verify bucket exists and is accessible

See [DEPLOYMENT.md](DEPLOYMENT.md) for comprehensive troubleshooting.

## License

MIT License - See LICENSE file for details

## Support

For deployment assistance:
- 📚 [Coolify Docs](https://coolify.io/docs)
- 📧 [Neon Database Support](https://neon.tech/docs)
- 💬 [Stripe Integration Help](https://stripe.com/docs)

## Acknowledgments

- Built with [React](https://react.dev/)
- UI components from [Shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
- Deployed with [Coolify](https://coolify.io/)

---

Made with ❤️ for luxury transportation services
