# White-Label Limo Service

A comprehensive, full-stack Progressive Web Application (PWA) for luxury transportation booking. White-label ready for any transportation business.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-20.x-green.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.x-blue.svg)
![Docker](https://img.shields.io/badge/docker-ready-blue.svg)

## Quick Deploy

### Option 1: Coolify (Recommended)
```bash
# In Coolify, point to this repository
# Use deployment/docker-compose.coolify.yml
# See deployment/coolify-deploy.sh for setup guide
```

### Option 2: Ubuntu VPS (Docker)
```bash
cd deployment
chmod +x deploy.sh
sudo ./deploy.sh
```

### Option 3: Local Development
```bash
npm install
npm run dev
# Open http://localhost:5000
```

## Features

### For Passengers
- Real-time pricing with instant quotes
- Flight integration with automatic tracking
- Flexible payments (Stripe, Pay Later, Cash)
- Mobile-first PWA experience
- Live driver tracking

### For Drivers
- GPS navigation integration
- Document management
- Payment tracking
- Real-time job alerts
- Two-stage job acceptance

### For Dispatchers & Admins
- Smart driver dispatch
- Analytics dashboard
- Fleet management
- CMS for branding
- Multi-role user management

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend | Node.js 20, Express.js, TypeScript |
| Database | PostgreSQL + Drizzle ORM |
| Storage | MinIO / AWS S3 |
| Payments | Stripe (optional) |
| SMS | Twilio (optional) |
| Container | Docker with multi-stage builds |

## Deployment

Full documentation in the `deployment/` folder:

| File | Purpose |
|------|---------|
| `deployment/deploy.sh` | Automated Ubuntu VPS deployment |
| `deployment/update.sh` | Update existing deployments |
| `deployment/coolify-deploy.sh` | Coolify setup guide |
| `deployment/docker-compose.yml` | Standalone Docker setup |
| `deployment/docker-compose.coolify.yml` | Coolify-optimized setup |
| `deployment/.env.example` | Environment variable template |

For detailed instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

## Environment Variables

Required variables:
```bash
DATABASE_URL=postgresql://user:pass@host:5432/db
SESSION_SECRET=<generate-with-openssl-rand-base64-32>
MINIO_SECRET_KEY=<your-storage-password>
```

Optional (for full features):
```bash
STRIPE_SECRET_KEY=sk_live_...
TWILIO_ACCOUNT_SID=AC...
SMTP_HOST=smtp.gmail.com
TOMTOM_API_KEY=...
```

See `deployment/.env.example` for complete list.

## Project Structure

```
limo-service/
├── client/           # React frontend
├── server/           # Express backend
├── shared/           # Shared types & schemas
├── deployment/       # Docker & deployment scripts
├── Dockerfile        # Production build
└── docker-compose.yml
```

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Push database schema
npm run db:push
```

## Mobile Apps

Native mobile apps can be built using Ionic Capacitor:

```bash
# iOS
npm run mobile:ios

# Android
npm run mobile:android
```

See [MOBILE_APP_GUIDE.md](MOBILE_APP_GUIDE.md) for setup instructions.

## Security

- Password hashing with scrypt
- Session-based authentication
- SQL injection prevention via Drizzle ORM
- Input validation with Zod
- Environment-based secret management

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

## License

MIT License - See LICENSE file for details.

---

Made with care for luxury transportation services
