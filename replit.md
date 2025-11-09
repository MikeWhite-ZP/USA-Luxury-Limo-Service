# USA Luxury Limo

## Overview
USA Luxury Limo is a full-stack Progressive Web Application (PWA) designed as a comprehensive luxury transportation booking platform. It aims to streamline the booking process by offering real-time pricing, fleet management, and multi-role user authentication for passengers, drivers, and dispatchers. Key capabilities include flight search integration, advanced payment options, and driver document management, providing an efficient solution for luxury transportation services. The project's ambition is to be a leading solution in the luxury transportation market, offering an intuitive and efficient booking experience.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX
The frontend is built with React 18, TypeScript, and Vite, utilizing Shadcn/ui components (Radix UI) styled with Tailwind CSS. It functions as a PWA with installable capabilities and offline support. Role-based login provides distinct dashboards: passenger dashboard uses a professional light red/white/black theme matching main website branding with clean logo presentation (no gradient backgrounds or effects), driver dashboard uses a green theme, and dispatcher dashboard uses a purple theme. The design emphasizes a modern, professional aesthetic with consistent rounded corners and cohesive color schemes. All styling uses Tailwind utility classes, avoiding hardcoded hex values. Device detection and auto-redirection manage mobile and desktop views, with user overrides.

### Technical Implementation
- **Frontend**: React 18, TypeScript, Vite, Wouter for routing, React Hook Form with Zod for validation, TanStack Query for server state. Features include optimistic updates, touch-optimized interfaces, and lazy loading for all page components using React.lazy() and Suspense for improved performance.
- **Backend**: Node.js with Express.js, TypeScript, RESTful JSON APIs. API routes are registered before Vite middleware to ensure proper request handling.
- **Database**: PostgreSQL (Neon for hosting) with Drizzle ORM.
- **Authentication**: Replit Auth with OpenID Connect, PostgreSQL-backed session management, and scrypt hashing for multi-role access (passenger, driver, admin).
- **Object Storage**: Replit Object Storage with custom Buffer normalization for all downloads. Object storage returns data in serialized format (array-wrapped or plain objects with numeric keys) which is converted to proper Buffers for binary file serving. All download endpoints (driver documents, CMS media, email logos) use consistent conversion logic with strict error handling.
- **Core Features**:
    - **Notifications**: Comprehensive email and SMS notification system (Twilio, Nodemailer) for all booking lifecycle events, using a fire-and-forget async pattern.
    - **Payment**: Integration with multiple providers (Stripe, PayPal, Square), supporting "Pay Now", "Pay Later", and "Pay with Cash" options. Includes surcharge management.
    - **Geolocation & Flight Data**: TomTom API for geocoding and AeroDataBox API for real-time flight information.
    - **Booking & Dispatch**: A 4-step booking flow, intelligent driver assignment, and a two-stage job acceptance workflow. Supports itemized pricing for transfer and hourly services.
    - **Driver Management**: Document upload/tracking, real-time GPS tracking, navigation integration, and driver payment/credential management.
    - **User/Admin Features**: User account management with cascading delete, support, system settings, a Dispatcher Dashboard, and API credential management.
    - **Invoice Management**: Complete invoice system with modern light-themed interface for both admin and passengers, allowing viewing, editing, printing, and emailing of detailed invoices.
    - **CMS**: Component-based Content Management System for brand identity and media asset management (Logo and Hero Image), with CRUD operations. Media stored in Replit Object Storage.

## External Dependencies
- **Twilio**: SMS messaging.
- **Stripe**: Payment processing.
- **PayPal**: Payment processing.
- **Square**: Payment processing.
- **TomTom**: Geocoding and location services.
- **Neon Database**: PostgreSQL hosting.
- **Replit Auth**: User authentication (optional, falls back to regular auth).
- **Shadcn/ui**: UI component library.
- **TanStack Query**: Server state management.
- **Drizzle ORM**: Database ORM.
- **Tailwind CSS**: Styling.
- **Wouter**: React router.
- **React Hook Form**: Form management.
- **AeroDataBox API (via RapidAPI)**: Flight search.
- **Object Storage**: Flexible storage backend - supports Replit Object Storage, MinIO, or AWS S3.
- **react-datepicker**: Date and time selection.
- **AWS SDK**: For S3-compatible storage (MinIO/S3) integration.

## Deployment Options

The application is prepared for multiple deployment scenarios:

### Replit Deployment (Default)
- Uses Replit Auth for authentication
- Uses Replit Object Storage for file storage
- Environment variables automatically managed by Replit

### External Deployment (Coolify/VPS)
Complete preparation for deployment on Coolify or other Docker-based platforms:

#### Key Files:
- **Dockerfile**: Simplified multi-stage production build (Node 20, runs directly on port 5000)
- **docker-compose.yml**: Local testing with MinIO service
- **.env.example**: Comprehensive environment variable documentation
- **DEPLOYMENT.md**: Step-by-step Coolify deployment guide for Hostinger VPS

#### Recent Optimizations (November 2025):
- **Simplified Dockerfile**: Removed Caddy reverse proxy; Node.js runs directly on port 5000 for easier Coolify deployment
- **Health Check Endpoints**: Added `/health` and `/api/health` for container monitoring
- **Code Splitting**: Implemented lazy loading for all 49+ page components, reducing initial bundle size
- **Server Optimization**: Fixed middleware order to prevent API route interception

#### Storage Abstraction:
- **server/objectStorageAdapter.ts**: Unified storage interface
- Automatic backend detection based on environment variables
- Supports three storage options:
  1. **MinIO** (recommended for VPS) - Self-hosted S3-compatible storage
  2. **AWS S3** - Cloud-based object storage
  3. **Replit Object Storage** - For Replit deployments

#### Authentication Flexibility:
- **Replit Auth**: Automatically disabled when REPLIT_DOMAINS/REPL_ID not set
- **Fallback**: Uses regular authentication (auth.ts) for non-Replit deployments
- Graceful degradation ensures app works in any environment

#### Production Features:
- Health check endpoint for container monitoring
- Automatic SSL via Let's Encrypt (when using Coolify)
- MinIO console for file management
- Complete environment variable documentation
- PostgreSQL session storage
- Docker networking and volume management

## Deployment Troubleshooting

### Common Deployment Issues

#### 1. Vite Import Error in Production

**Symptom:**
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'vite' imported from /app/dist/index.js
```

**Cause**: esbuild was bundling server code and marking `vite` as an external dependency, but Vite is a dev dependency not installed in production.

**Solution (Fixed in Dockerfile)**:
The Dockerfile now uses explicit build commands that exclude Vite and related dependencies from the production bundle:
```dockerfile
RUN npx vite build
RUN npx esbuild server/index.ts --platform=node --bundle --format=esm --outdir=dist \
  --packages=external \
  --external:vite \
  --external:@vitejs/* \
  --external:./server/vite.ts \
  --external:./server/vite.js
```

**Why these externals are required**:
- `--external:vite` - Excludes the vite package
- `--external:@vitejs/*` - Excludes vite plugins (@vitejs/plugin-react, etc.)
- `--external:./server/vite.ts` and `--external:./server/vite.js` - Keeps the vite setup module external (only used in development mode)

**If you encounter this error**: Update your Dockerfile from GitHub repository and redeploy.

#### 2. Placeholder Environment Variables

**Symptom**: Application starts but fails when trying to connect to database or storage.

**Cause**: Using placeholder values from `.env.example` instead of real credentials.

**Solution**: 
1. Review [COOLIFY_ENV_SETUP.md](COOLIFY_ENV_SETUP.md) for detailed setup instructions
2. Generate real credentials for each environment variable
3. Critical variables to update:
   - `DATABASE_URL` - Use real Neon database connection string
   - `SESSION_SECRET` - Generate with `openssl rand -base64 32`
   - `MINIO_SECRET_KEY` - Use your MinIO password
   - `STRIPE_SECRET_KEY` and `VITE_STRIPE_PUBLIC_KEY` - Use real Stripe keys

#### 3. Database Connection Failures

**Symptom**: 
```
Error: Connection timed out
Error: SSL required
```

**Solution**:
- Ensure `?sslmode=require` is appended to `DATABASE_URL` for Neon
- Check database firewall allows connections from Coolify server IP
- Verify database credentials are correct

#### 4. MinIO Connection Issues

**Symptom**: File uploads fail, 502 errors on logo/document uploads.

**Solution**:
- Ensure MinIO service is running: Check Coolify → MinIO service status
- Verify `MINIO_ENDPOINT` uses internal Docker network name: `http://usa-limo-minio:9000`
- Check bucket `usa-luxury-limo` exists in MinIO console
- Confirm `MINIO_ACCESS_KEY` and `MINIO_SECRET_KEY` match MinIO configuration

#### 5. Build Failures

**Symptom**: Deployment fails during build stage.

**Common causes and solutions**:
- **npm install fails**: Check package.json is valid and not corrupted
- **TypeScript errors**: Run `npm run check` locally to verify types
- **Out of memory**: Increase container memory in Coolify settings (recommended: 2GB+)

#### 6. Container Health Check Failures

**Symptom**: Container marked as unhealthy, application restarts repeatedly.

**Diagnosis**:
1. Check container logs in Coolify: App → Logs
2. Look for startup errors
3. Verify health endpoint responds: `curl http://localhost:5000/health`

**Common fixes**:
- Ensure port 5000 is not blocked
- Verify `HOST=0.0.0.0` environment variable is set
- Check application starts without errors

### Deployment Verification Checklist

After deployment, verify:

1. **Health Endpoint**: Visit `https://your-app-url.com/health` → Should return `{"status":"ok"}`
2. **Database Connection**: Try logging in → Should work without errors
3. **File Storage**: Upload a logo in CMS → Should succeed
4. **Payment Integration**: Create test booking with Stripe → Should process
5. **Email/SMS**: Trigger notification → Check delivery

### Getting Help

**Deployment Resources**:
- [QUICK_START.md](QUICK_START.md) - 5-minute deployment guide
- [COOLIFY_ENV_SETUP.md](COOLIFY_ENV_SETUP.md) - Comprehensive environment variable setup
- [DEPLOYMENT.md](DEPLOYMENT.md) - Detailed deployment documentation with troubleshooting
- [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) - Pre and post-deployment validation
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture and technical details

**Debug Steps**:
1. Check Coolify application logs for error messages
2. Verify all environment variables are set correctly
3. Test health endpoint: `/health`
4. Check MinIO and database services are running
5. Review recent changes in GitHub repository