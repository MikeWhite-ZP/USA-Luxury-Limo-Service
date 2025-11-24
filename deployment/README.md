# USA Luxury Limo - Deployment Guide

Production deployment folder for USA Luxury Limo application on Coolify + Ubuntu Server.

## 📦 Contents

- `Dockerfile` - Production-optimized multi-stage build
- `docker-compose.yml` - Coolify deployment configuration with Caddy labels
- `entrypoint.sh` - Container startup script with auto-migrations
- `healthcheck.sh` - Container health monitoring
- `deploy.sh` - Local build and test script
- `.env.example` - Complete environment variables template
- `.dockerignore` - Build optimization
- `COOLIFY-DEPLOYMENT-GUIDE.md` - **Detailed Coolify setup instructions (Turkish)**
- `PRODUCTION-CHECKLIST.md` - Pre-deployment verification

## 🚀 Quick Start

### Prerequisites

- Ubuntu server with Coolify installed
- Caddy proxy configured in Coolify
- External PostgreSQL container running
- External MinIO container running
- Git repository connected to Coolify

### Deployment Steps

1. **Read the detailed guide:**
   ```bash
   cat COOLIFY-DEPLOYMENT-GUIDE.md
   ```

2. **Configure environment variables** in Coolify UI (see `.env.example`)

3. **Deploy:**
   - Push code to Git repository
   - Coolify auto-deploys on push
   - OR manually trigger deployment in Coolify UI

## 🔄 Updating the Application

Every time you upgrade your application:

1. **Update your code** (make changes in main project)

2. **Test locally** (optional):
   ```bash
   cd deployment/
   ./deploy.sh
   ```

3. **Commit and push:**
   ```bash
   git add .
   git commit -m "Update application"
   git push origin main
   ```

4. **Coolify auto-deploys** the new version

## 📋 Important Files

### Environment Variables

Copy `.env.example` and configure in Coolify UI:
- Database connection (URL-encode special characters!)
- MinIO credentials
- API keys (TomTom, AeroDataBox)
- Payment providers (Stripe, PayPal, Square)
- Twilio SMS
- Email SMTP

### Docker Compose

The `docker-compose.yml` includes:
- ✅ Caddy labels for automatic SSL
- ✅ Health checks
- ✅ Environment variable injection
- ✅ External service connections (PostgreSQL, MinIO)

### Dockerfile

Multi-stage build:
1. **Frontend builder** - Builds React app
2. **Backend builder** - Prepares Node.js server
3. **Production runtime** - Minimal final image

## 🔍 Health Checks

The application includes:
- `/health` endpoint (returns 200 OK)
- Container health check every 30s
- Automatic restart on failure

## 📚 Documentation

- **[COOLIFY-DEPLOYMENT-GUIDE.md](./COOLIFY-DEPLOYMENT-GUIDE.md)** - Step-by-step Coolify setup (Turkish)
- **[PRODUCTION-CHECKLIST.md](./PRODUCTION-CHECKLIST.md)** - Pre-deployment verification

## 🐛 Troubleshooting

See `COOLIFY-DEPLOYMENT-GUIDE.md` for detailed troubleshooting:
- 502 Bad Gateway errors
- Network configuration
- Caddy label issues
- Database connection problems
- MinIO connection issues

## 🔒 Security Notes

1. **DATABASE_URL**: URL-encode special characters (e.g., `?` → `%3F`)
2. **Secrets**: Never commit `.env` file to git
3. **SESSION_SECRET**: Use strong random value
4. **API Keys**: Store in Coolify environment variables

## 📞 Support

For issues:
1. Check Coolify logs in UI
2. Review `PRODUCTION-CHECKLIST.md`
3. See troubleshooting in `COOLIFY-DEPLOYMENT-GUIDE.md`

---

**Last Updated:** November 2025
