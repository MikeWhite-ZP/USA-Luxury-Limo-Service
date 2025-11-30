# Deployment Guide

Complete guide for deploying the White-Label Limo Service as a multi-tenant platform.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Quick Start](#quick-start)
4. [Central Infrastructure Setup](#central-infrastructure-setup)
5. [Adding New Tenants](#adding-new-tenants)
6. [Environment Variables](#environment-variables)
7. [Post-Deployment](#post-deployment)
8. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

This is a **multi-tenant architecture** where:

- **One central PostgreSQL server** hosts all company databases
- **One central MinIO server** hosts all company storage buckets
- **Each company** gets their own app container, database, and storage bucket

```
┌─────────────────────────────────────────────────────────────┐
│                    CENTRAL INFRASTRUCTURE                    │
│                                                             │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │   PostgreSQL    │    │     MinIO       │                │
│  │   (Port 5432)   │    │   (Port 9000)   │                │
│  └────────┬────────┘    └────────┬────────┘                │
└───────────┼──────────────────────┼──────────────────────────┘
            │                      │
    ┌───────┴──────────────────────┴───────┐
    │                                      │
┌───┴───┐  ┌───────┐  ┌───────┐  ┌───────┐
│ App 1 │  │ App 2 │  │ App 3 │  │ App N │
│ :5001 │  │ :5002 │  │ :5003 │  │ :500N │
└───────┘  └───────┘  └───────┘  └───────┘
```

---

## Prerequisites

### Server Requirements
- Ubuntu 20.04+ or Debian 10+
- 2GB RAM minimum (4GB recommended)
- 20GB storage
- Public IP address

### Required Software
- Docker and Docker Compose

---

## Quick Start

### 1. Deploy Central Infrastructure (Once)

```bash
cd deployment/infrastructure
./deploy.sh
```

This starts PostgreSQL and MinIO on your server.

### 2. Provision New Tenant

```bash
cd deployment/scripts
./provision-tenant.sh acme-limo
```

This creates database and bucket for the company.

### 3. Deploy Tenant App

```bash
cd deployment/app/tenants/acme-limo
./deploy.sh
```

Done! Access at `http://your-server:5000`

---

## Central Infrastructure Setup

### Step 1: Clone Repository

```bash
git clone https://github.com/yourusername/limo-service.git
cd limo-service
```

### Step 2: Configure Infrastructure

```bash
cd deployment/infrastructure
cp .env.example .env
nano .env  # Set your server IP and secure passwords
```

### Step 3: Deploy Services

```bash
chmod +x deploy.sh
./deploy.sh
```

The script will:
- Install Docker if needed
- Generate secure admin passwords
- Start PostgreSQL (port 5432)
- Start MinIO (ports 9000, 9001)

### Step 4: Verify Services

```bash
./deploy.sh status
```

---

## Adding New Tenants

For each new company deployment:

### Step 1: Provision Resources

```bash
cd deployment/scripts
./provision-tenant.sh <company-slug>
```

Example:
```bash
./provision-tenant.sh acme-limo
./provision-tenant.sh vip-transport
./provision-tenant.sh elite-cars
```

The slug should be:
- Lowercase letters, numbers, and hyphens only
- Unique for each company

This creates:
- PostgreSQL database: `<slug>_db`
- PostgreSQL user: `<slug>_user`
- MinIO bucket: `<slug>-uploads`
- Config file: `deployment/app/tenants/<slug>/.env`

### Step 2: Configure Tenant

```bash
cd deployment/app/tenants/<company-slug>
nano .env
```

Add optional API keys:
- Stripe (for payments)
- Twilio (for SMS)
- SMTP (for email)
- Set custom port if running multiple apps

### Step 3: Deploy App

```bash
./deploy.sh
```

### Step 4: Run Migrations

```bash
docker exec <company-slug>-app npm run db:push
```

---

## Multiple Apps on Same Server

Each tenant runs on a different port. Edit each tenant's `.env`:

```bash
# Tenant 1: acme-limo
APP_PORT=5001

# Tenant 2: vip-transport
APP_PORT=5002

# Tenant 3: elite-cars
APP_PORT=5003
```

### Reverse Proxy Setup (Nginx)

```nginx
server {
    server_name acme-limo.com;
    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}

server {
    server_name vip-transport.com;
    location / {
        proxy_pass http://localhost:5002;
        # ... same headers
    }
}
```

### Reverse Proxy Setup (Caddy)

```
acme-limo.com {
    reverse_proxy localhost:5001
}

vip-transport.com {
    reverse_proxy localhost:5002
}
```

---

## Environment Variables

### Infrastructure Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `POSTGRES_ADMIN_USER` | Yes | PostgreSQL superuser |
| `POSTGRES_ADMIN_PASSWORD` | Yes | Admin password |
| `POSTGRES_HOST` | Yes | Server IP/domain |
| `MINIO_ROOT_USER` | Yes | MinIO admin |
| `MINIO_ROOT_PASSWORD` | Yes | MinIO password |

### Tenant Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `COMPANY_SLUG` | Yes | Unique identifier |
| `DATABASE_URL` | Yes | PostgreSQL connection |
| `SESSION_SECRET` | Yes | Session encryption |
| `MINIO_ENDPOINT` | Yes | MinIO server URL |
| `MINIO_ACCESS_KEY` | Yes | Storage access key |
| `MINIO_SECRET_KEY` | Yes | Storage secret |
| `MINIO_BUCKET` | Yes | Company bucket |
| `APP_PORT` | Yes | Container port |
| `STRIPE_SECRET_KEY` | No | Payments |
| `TWILIO_ACCOUNT_SID` | No | SMS |

---

## Post-Deployment

### Default Admin Login

- **Username**: mikewhite
- **Password**: admin123

**Change this immediately after first login!**

### Configure Branding

1. Login as admin
2. Go to **Settings** > **Branding**
3. Upload logo and set company name
4. Configure colors and theme

### Set Up Fleet

1. Go to **Admin** > **Fleet**
2. Add vehicle types with pricing
3. Upload vehicle images

---

## Management Commands

### Infrastructure

```bash
cd deployment/infrastructure

# Status
./deploy.sh status

# View logs
docker logs limo-central-postgres -f
docker logs limo-central-minio -f

# Stop
./deploy.sh stop
```

### Tenant Apps

```bash
cd deployment/app/tenants/<company-slug>

# Status
./deploy.sh status

# View logs
./deploy.sh logs

# Update
./deploy.sh update

# Stop
./deploy.sh stop
```

---

## Backup & Recovery

### Database Backup

```bash
# Backup all databases
docker exec limo-central-postgres pg_dumpall -U postgres > all_databases.sql

# Backup single tenant
docker exec limo-central-postgres pg_dump -U postgres <db_name> > tenant.sql
```

### Database Restore

```bash
# Restore single tenant
cat tenant.sql | docker exec -i limo-central-postgres psql -U postgres <db_name>
```

---

## Troubleshooting

### App Not Starting

```bash
docker logs <company-slug>-app -f
```

### Database Connection Failed

- Verify `DATABASE_URL` format
- Check PostgreSQL is running: `docker logs limo-central-postgres`
- Ensure tenant database exists

### Storage Errors

- Verify MinIO is running: `curl http://localhost:9000/minio/health/live`
- Check bucket exists in MinIO console (port 9001)
- Verify credentials in `.env`

### Health Check

```bash
curl http://localhost:<port>/health
```

---

## Directory Structure

```
deployment/
├── infrastructure/          # Central services
│   ├── docker-compose.yml
│   ├── deploy.sh
│   └── .env.example
│
├── app/                     # Per-tenant deployment
│   ├── docker-compose.yml
│   ├── Dockerfile
│   ├── deploy.sh
│   ├── .env.example
│   └── tenants/             # Generated configs
│       └── <company-slug>/
│           └── .env
│
├── scripts/                 # Tools
│   └── provision-tenant.sh
│
└── README.md
```

---

## Support

- Check detailed docs: `deployment/README.md`
- Container logs: `docker logs <container-name> -f`
- Health endpoint: `http://your-domain/health`
