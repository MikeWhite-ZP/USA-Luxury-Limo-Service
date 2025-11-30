# Deployment Guide

Complete guide for deploying the White-Label Limo Service on Ubuntu VPS with Coolify or standalone Docker.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Coolify Deployment](#coolify-deployment)
4. [Standalone Docker Deployment](#standalone-docker-deployment)
5. [Environment Variables](#environment-variables)
6. [External Services Setup](#external-services-setup)
7. [Post-Deployment](#post-deployment)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Server Requirements
- Ubuntu 20.04+ or Debian 10+
- 2GB RAM minimum (4GB recommended)
- 20GB storage
- Public IP address

### External Services (Recommended)
- **Database**: Neon PostgreSQL (free tier available) or Supabase
- **Domain**: Your own domain name
- **Optional**: Stripe account for payments

---

## Quick Start

### Fastest Way (Ubuntu VPS)

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/limo-service.git
cd limo-service/deployment

# 2. Run automated deployment
chmod +x deploy.sh
sudo ./deploy.sh

# 3. Follow the prompts
```

The script will:
- Install Docker and dependencies
- Generate secure passwords
- Build and start all containers
- Configure the database

---

## Coolify Deployment

Coolify is a self-hosted PaaS that simplifies deployment with automatic SSL and easy management.

### Step 1: Install Coolify

```bash
# On your VPS
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

Access Coolify at `http://your-server-ip:8000`

### Step 2: Create New Application

1. Go to **Projects** > **New Project**
2. Add new **Resource** > **Docker Compose**
3. Connect your Git repository

### Step 3: Configure Build Settings

In Coolify application settings:

```
Build Path: deployment/
Docker Compose File: deployment/docker-compose.coolify.yml
```

### Step 4: Add Environment Variables

In **Environment Variables** section, add:

**Required:**
```
DATABASE_URL=postgresql://user:pass@host:5432/database?sslmode=require
SESSION_SECRET=your-secret-here
```

**Storage (choose one):**

*Option A - MinIO:*
```
STORAGE_PROVIDER=minio
MINIO_ENDPOINT=https://your-minio-server.com
MINIO_ACCESS_KEY=your-access-key
MINIO_SECRET_KEY=your-secret-key
MINIO_BUCKET=limo-uploads
MINIO_USE_SSL=true
```

*Option B - AWS S3:*
```
STORAGE_PROVIDER=s3
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=your-secret
AWS_S3_BUCKET=your-bucket-name
AWS_REGION=us-east-1
```

**Optional:**
```
STRIPE_SECRET_KEY=sk_live_...
VITE_STRIPE_PUBLIC_KEY=pk_live_...
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
SMTP_HOST=smtp.gmail.com
SMTP_USER=your@email.com
SMTP_PASS=your-app-password
```

### Step 5: Configure Domain

1. In **Domains** section, add your domain
2. Enable **Auto SSL** for HTTPS
3. Save and deploy

### Step 6: Deploy

Click **Deploy** and monitor the build logs.

---

## Standalone Docker Deployment

For servers without Coolify.

### Step 1: Clone Repository

```bash
git clone https://github.com/yourusername/limo-service.git
cd limo-service
```

### Step 2: Configure Environment

```bash
cd deployment
cp .env.example .env
nano .env  # Edit with your values
```

### Step 3: Run Deployment Script

```bash
chmod +x deploy.sh
sudo ./deploy.sh
```

Or manually with Docker Compose:

```bash
docker compose -f docker-compose.yml up -d
```

### Step 4: Run Database Migrations

```bash
docker exec limo-app npm run db:push
```

### Step 5: Set Up Reverse Proxy (Optional)

For SSL/HTTPS, use Nginx or Caddy:

**Caddy Example (with automatic SSL):**
```
your-domain.com {
    reverse_proxy localhost:5000
}
```

---

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `SESSION_SECRET` | Session encryption key | Generate with `openssl rand -base64 32` |
| `MINIO_SECRET_KEY` | Object storage password | Secure random string |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `STRIPE_SECRET_KEY` | Stripe API key | (disabled if empty) |
| `VITE_STRIPE_PUBLIC_KEY` | Stripe public key | (disabled if empty) |
| `TWILIO_ACCOUNT_SID` | Twilio account SID | (SMS disabled if empty) |
| `TWILIO_AUTH_TOKEN` | Twilio auth token | |
| `TWILIO_PHONE_NUMBER` | Twilio phone number | |
| `SMTP_HOST` | Email server | |
| `SMTP_PORT` | Email port | 587 |
| `SMTP_USER` | Email username | |
| `SMTP_PASS` | Email password | |
| `TOMTOM_API_KEY` | TomTom geocoding API | |
| `RAPIDAPI_KEY` | RapidAPI for flights | |

---

## External Services Setup

### Neon Database (Recommended)

1. Go to [neon.tech](https://neon.tech)
2. Create free account
3. Create new project
4. Copy connection string to `DATABASE_URL`

### MinIO Object Storage

**Option A: Self-hosted MinIO**
```bash
docker run -d \
  -p 9000:9000 -p 9001:9001 \
  -v minio_data:/data \
  -e MINIO_ROOT_USER=admin \
  -e MINIO_ROOT_PASSWORD=your-password \
  minio/minio server /data --console-address ":9001"
```

**Option B: MinIO Cloud**
1. Go to [min.io/cloud](https://min.io/cloud)
2. Create bucket
3. Generate access keys
4. Add credentials to environment

### Stripe Payments (Optional)

1. Go to [stripe.com/dashboard](https://stripe.com/dashboard)
2. Get API keys from **Developers** > **API keys**
3. Add `STRIPE_SECRET_KEY` and `VITE_STRIPE_PUBLIC_KEY`

### Twilio SMS (Optional)

1. Go to [console.twilio.com](https://console.twilio.com)
2. Get Account SID and Auth Token
3. Buy a phone number
4. Add credentials to environment

---

## Post-Deployment

### Create Admin Account

1. Access your deployed application
2. Click "Sign Up" or "Register"
3. Create first account
4. Default admin: `mikewhite` / `admin123` (change immediately)

### Configure Branding

1. Login as admin
2. Go to **Settings** > **Branding**
3. Upload logo and set company name
4. Configure colors and theme

### Set Up Vehicle Types

1. Go to **Admin** > **Fleet**
2. Add vehicle types with pricing
3. Upload vehicle images

---

## Troubleshooting

### Application Not Starting

```bash
# Check container logs
docker logs limo-app -f

# Check all containers
docker compose ps
```

### Database Connection Failed

Common fixes:
- Verify `DATABASE_URL` format
- Check database firewall allows connections
- Ensure SSL mode is correct (`?sslmode=require` for Neon)

### 502 Bad Gateway

- Application might still be starting (wait 30-60 seconds)
- Check if port 5000 is correctly mapped
- Verify `HOST=0.0.0.0` in environment

### Storage Upload Errors

- Verify MinIO credentials
- Check bucket exists
- Ensure `MINIO_USE_SSL` matches your setup

### Health Check

```bash
curl http://localhost:5000/health
```

Should return:
```json
{"status": "ok", "database": "connected"}
```

---

## Updating

To update an existing deployment:

```bash
cd deployment
./update.sh
```

Or manually:

```bash
git pull
docker compose build --no-cache app
docker compose up -d app
```

---

## Backup & Restore

### Database Backup

```bash
# Create backup
docker exec limo-postgres pg_dump -U limo limo_service > backup.sql

# Restore backup
cat backup.sql | docker exec -i limo-postgres psql -U limo limo_service
```

---

## Deployment Files

All deployment resources are in the `deployment/` folder:

| File | Purpose |
|------|---------|
| `Dockerfile` | Optimized production Docker image |
| `docker-compose.yml` | Standalone deployment with all services |
| `docker-compose.coolify.yml` | Coolify-optimized (external DB/storage) |
| `.env.example` | Environment variable template |
| `deploy.sh` | Automated deployment script |
| `update.sh` | Update existing deployments |
| `coolify-deploy.sh` | Coolify setup guide |

---

## Support

- Check logs: `docker logs limo-app -f`
- Health endpoint: `http://your-domain/health`
- [Coolify Docs](https://coolify.io/docs)
- [Neon Docs](https://neon.tech/docs)
- [Docker Docs](https://docs.docker.com)
