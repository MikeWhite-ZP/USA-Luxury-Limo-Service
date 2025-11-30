# White-Label Limo Service - Deployment Guide

## Multi-Tenant Architecture

This deployment setup supports multiple company deployments from a single codebase:

```
┌─────────────────────────────────────────────────────────────┐
│                    CENTRAL INFRASTRUCTURE                    │
│  (Deploy once on your main server)                          │
│                                                             │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │   PostgreSQL    │    │     MinIO       │                │
│  │   (Port 5432)   │    │   (Port 9000)   │                │
│  └────────┬────────┘    └────────┬────────┘                │
│           │                      │                          │
└───────────┼──────────────────────┼──────────────────────────┘
            │                      │
    ┌───────┴──────────────────────┴───────┐
    │                                      │
┌───┴───┐  ┌───────┐  ┌───────┐  ┌───────┐
│ App 1 │  │ App 2 │  │ App 3 │  │ App N │
│ :5001 │  │ :5002 │  │ :5003 │  │ :500N │
└───────┘  └───────┘  └───────┘  └───────┘
  acme      bestlimo    viplimo    ...
```

Each company gets:
- Their own database on the shared PostgreSQL server
- Their own bucket on the shared MinIO server
- Their own app container on a unique port

## Quick Start

### Step 1: Deploy Central Infrastructure (Once)

```bash
cd deployment/infrastructure
./deploy.sh
```

This starts:
- PostgreSQL database server (port 5432)
- MinIO object storage server (ports 9000, 9001)

### Step 2: Provision a New Tenant

For each new company deployment:

```bash
cd deployment/scripts
./provision-tenant.sh acme-limo
```

This creates:
- Database: `acme_limo_db`
- MinIO bucket: `acme-limo-uploads`
- Config file: `deployment/app/tenants/acme-limo/.env`

### Step 3: Deploy the Tenant App

```bash
cd deployment/app/tenants/acme-limo
./deploy.sh
```

## Directory Structure

```
deployment/
├── infrastructure/          # Central services (deploy once)
│   ├── docker-compose.yml   # PostgreSQL + MinIO
│   ├── deploy.sh            # Setup script
│   └── .env.example         # Admin credentials template
│
├── app/                     # Per-tenant app deployment
│   ├── docker-compose.yml   # App container template
│   ├── Dockerfile           # Production build
│   ├── deploy.sh            # Deployment script
│   ├── .env.example         # Tenant config template
│   └── tenants/             # Generated tenant configs
│       ├── acme-limo/
│       │   ├── .env
│       │   └── docker-compose.yml
│       └── another-company/
│           ├── .env
│           └── docker-compose.yml
│
├── scripts/                 # Provisioning tools
│   └── provision-tenant.sh  # Create new tenant
│
└── README.md                # This file
```

## Detailed Instructions

### Infrastructure Setup

1. **Copy and configure environment:**
   ```bash
   cd deployment/infrastructure
   cp .env.example .env
   # Edit .env with your server IP and secure passwords
   ```

2. **Deploy services:**
   ```bash
   ./deploy.sh
   ```

3. **Verify services:**
   ```bash
   ./deploy.sh status
   ```

### Adding a New Company

1. **Run provisioning script:**
   ```bash
   cd deployment/scripts
   ./provision-tenant.sh <company-slug>
   ```
   
   The slug should be:
   - Lowercase letters, numbers, and hyphens only
   - Unique for each company
   - Example: `acme-limo`, `vip-transport`, `elite-cars`

2. **Configure the tenant:**
   ```bash
   cd deployment/app/tenants/<company-slug>
   nano .env
   ```
   
   Add optional settings:
   - Stripe API keys
   - Twilio credentials
   - SMTP settings
   - Custom domain

3. **Deploy the app:**
   ```bash
   ./deploy.sh
   ```

4. **Run database migrations:**
   ```bash
   docker exec <company-slug>-app npm run db:push
   ```

### Multiple Apps on Same Server

Each tenant app runs on a different port. Configure in `.env`:

```bash
# Tenant 1: acme-limo
APP_PORT=5001

# Tenant 2: vip-transport
APP_PORT=5002

# Tenant 3: elite-cars
APP_PORT=5003
```

Use a reverse proxy (Nginx/Caddy) to route domains:
- `acme-limo.com` → localhost:5001
- `vip-transport.com` → localhost:5002
- `elite-cars.com` → localhost:5003

## Environment Variables

### Infrastructure (.env)

| Variable | Required | Description |
|----------|----------|-------------|
| `POSTGRES_ADMIN_USER` | Yes | PostgreSQL superuser |
| `POSTGRES_ADMIN_PASSWORD` | Yes | PostgreSQL admin password |
| `POSTGRES_HOST` | Yes | Server IP or domain |
| `MINIO_ROOT_USER` | Yes | MinIO admin user |
| `MINIO_ROOT_PASSWORD` | Yes | MinIO admin password |

### Tenant App (.env)

| Variable | Required | Description |
|----------|----------|-------------|
| `COMPANY_SLUG` | Yes | Unique company identifier |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `MINIO_ENDPOINT` | Yes | MinIO server URL |
| `MINIO_ACCESS_KEY` | Yes | MinIO access key |
| `MINIO_SECRET_KEY` | Yes | MinIO secret key |
| `MINIO_BUCKET` | Yes | Company's bucket name |
| `SESSION_SECRET` | Yes | Express session secret |
| `APP_PORT` | Yes | App container port |
| `STRIPE_SECRET_KEY` | No | Stripe payments |
| `TWILIO_ACCOUNT_SID` | No | SMS notifications |

## Management Commands

### Infrastructure

```bash
cd deployment/infrastructure

# View status
./deploy.sh status

# View logs
docker logs limo-central-postgres -f
docker logs limo-central-minio -f

# Stop services
./deploy.sh stop

# Restart
docker compose restart
```

### Tenant Apps

```bash
cd deployment/app/tenants/<company-slug>

# View status
./deploy.sh status

# View logs
./deploy.sh logs

# Restart
docker restart <company-slug>-app

# Stop
./deploy.sh stop

# Update (rebuild)
./deploy.sh update
```

## Backup & Recovery

### Database Backup

```bash
# Backup all databases
docker exec limo-central-postgres pg_dumpall -U postgres > backup.sql

# Backup single tenant
docker exec limo-central-postgres pg_dump -U postgres <db_name> > tenant_backup.sql
```

### MinIO Backup

```bash
# Using mc client
docker run --rm -v /backup:/backup --network limo-infrastructure \
  minio/mc mirror infra/<bucket-name> /backup/<bucket-name>
```

## Security Recommendations

1. **Firewall**: Only expose necessary ports
2. **SSL**: Use Nginx/Caddy with Let's Encrypt
3. **Passwords**: Use strong, unique passwords
4. **Updates**: Regularly update Docker images
5. **Backups**: Schedule automated backups

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL status
docker logs limo-central-postgres

# Test connection
docker exec limo-central-postgres psql -U postgres -l
```

### MinIO Issues

```bash
# Check MinIO status
docker logs limo-central-minio

# Test MinIO health
curl http://localhost:9000/minio/health/live
```

### App Not Starting

```bash
# Check app logs
docker logs <company-slug>-app

# Verify environment
docker exec <company-slug>-app env | grep DATABASE
```
