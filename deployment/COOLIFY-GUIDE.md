# Coolify Deployment Guide

Complete step-by-step guide for deploying the White-Label Limo Service using Coolify UI on your VPS server.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Part 1: Install Coolify on VPS](#part-1-install-coolify-on-vps)
3. [Part 2: Deploy Central Infrastructure](#part-2-deploy-central-infrastructure)
4. [Part 3: Provision New Tenant](#part-3-provision-new-tenant)
5. [Part 4: Deploy Tenant Application](#part-4-deploy-tenant-application)
6. [Part 5: Configure Domain & SSL](#part-5-configure-domain--ssl)
7. [Part 6: Adding More Companies](#part-6-adding-more-companies)
8. [Maintenance & Updates](#maintenance--updates)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Server Requirements
- **VPS**: Ubuntu 22.04 LTS (recommended)
- **RAM**: 4GB minimum (8GB recommended for multiple tenants)
- **Storage**: 40GB SSD minimum
- **CPU**: 2 cores minimum

### What You'll Need
- SSH access to your VPS
- Domain name(s) for your companies
- Access to DNS settings for your domain(s)

### Recommended VPS Providers
- Hetzner (best value)
- DigitalOcean
- Vultr
- Linode
- AWS Lightsail

---

## Part 1: Install Coolify on VPS

### Step 1.1: Connect to Your VPS

```bash
ssh root@your-server-ip
```

### Step 1.2: Install Coolify

Run the official Coolify installation script:

```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

This will:
- Install Docker and Docker Compose
- Set up Coolify with all dependencies
- Configure the Coolify service

Installation takes 2-5 minutes.

### Step 1.3: Access Coolify Dashboard

1. Open your browser and go to:
   ```
   http://your-server-ip:8000
   ```

2. Create your admin account:
   - Enter your email
   - Create a strong password
   - Click **Register**

3. Complete the initial setup wizard:
   - **Instance Settings**: Keep defaults
   - Click **Save**

### Step 1.4: Add Your Server

1. Go to **Servers** in the left sidebar
2. Click **+ Add** button
3. Select **Localhost** (your current VPS)
4. Click **Validate Connection**
5. Once connected, click **Save**

You now have Coolify ready to deploy applications!

---

## Part 2: Deploy Central Infrastructure

We'll deploy PostgreSQL and MinIO as central services that all tenant apps will share.

### Step 2.1: Create a Project for Infrastructure

1. Go to **Projects** in the left sidebar
2. Click **+ Add**
3. Name it: `Limo Infrastructure`
4. Click **Save**

### Step 2.2: Deploy PostgreSQL Database

1. Inside your project, click **+ New**
2. Select **Database**
3. Choose **PostgreSQL**
4. Configure:
   - **Name**: `limo-central-postgres`
   - **PostgreSQL User**: `postgres`
   - **PostgreSQL Password**: (generate a strong one - save this!)
   - **PostgreSQL Database**: `postgres`
   - **Version**: `16`

5. Under **Network**:
   - Enable **Publicly Accessible** (needed for tenant provisioning)
   - **Port**: `5432`

6. Click **Deploy**

7. **Save these credentials - you'll need them!**
   ```
   POSTGRES_HOST=your-server-ip
   POSTGRES_PORT=5432
   POSTGRES_ADMIN_USER=postgres
   POSTGRES_ADMIN_PASSWORD=[your-generated-password]
   ```

### Step 2.3: Deploy MinIO Object Storage

1. In the same project, click **+ New**
2. Select **Service**
3. Search for **MinIO** and select it
4. Configure:
   - **Name**: `limo-central-minio`
   - **Root User**: `minioadmin`
   - **Root Password**: (generate a strong one - save this!)

5. Under **Network**:
   - **API Port**: `9000`
   - **Console Port**: `9001`
   - Enable both ports to be accessible

6. Click **Deploy**

7. **Save these credentials!**
   ```
   MINIO_HOST=your-server-ip
   MINIO_API_PORT=9000
   MINIO_CONSOLE_PORT=9001
   MINIO_ROOT_USER=minioadmin
   MINIO_ROOT_PASSWORD=[your-generated-password]
   ```

### Step 2.4: Create Infrastructure Config File

SSH to your server and create the infrastructure config:

```bash
ssh root@your-server-ip

# Create deployment directory
mkdir -p /opt/limo-service/deployment/infrastructure

# Create .env file with your credentials
cat > /opt/limo-service/deployment/infrastructure/.env << 'EOF'
# Central Infrastructure Configuration
POSTGRES_HOST=your-server-ip
POSTGRES_PORT=5432
POSTGRES_ADMIN_USER=postgres
POSTGRES_ADMIN_PASSWORD=your-postgres-password

MINIO_HOST=your-server-ip
MINIO_API_PORT=9000
MINIO_CONSOLE_PORT=9001
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=your-minio-password
EOF

chmod 600 /opt/limo-service/deployment/infrastructure/.env
```

Your central infrastructure is now running!

---

## Part 3: Provision New Tenant

For each new company, use the automated provisioning script to create a database and storage bucket.

### Step 3.1: Clone Repository (First Time Only)

```bash
ssh root@your-server-ip

cd /opt/limo-service
git clone https://github.com/yourusername/limo-service.git .
```

### Step 3.2: Run Tenant Provisioning Script

The provisioning script automatically creates:
- PostgreSQL database for the company
- PostgreSQL user with secure password
- MinIO bucket for file storage
- Complete `.env` file with all credentials

```bash
cd /opt/limo-service/deployment/scripts
chmod +x provision-tenant.sh
./provision-tenant.sh acme-limo
```

Replace `acme-limo` with your company slug (lowercase, hyphens only).

### Step 3.3: Script Output

The script will create:

```
deployment/app/tenants/acme-limo/
├── .env              # All environment variables (auto-generated)
└── docker-compose.yml
```

The generated `.env` file contains:
- Database connection string
- MinIO credentials and bucket
- Session secret
- All required environment variables

### Step 3.4: Customize Optional Settings

Edit the generated `.env` file to add optional API keys:

```bash
nano /opt/limo-service/deployment/app/tenants/acme-limo/.env
```

Add any of these optional settings:
```bash
# Payment Processing (Stripe)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
VITE_STRIPE_PUBLIC_KEY=pk_live_...

# SMS Notifications (Twilio)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=app-password
EMAIL_FROM_NAME=ACME Limo
EMAIL_FROM_ADDRESS=bookings@acme-limo.com

# Geocoding
TOMTOM_API_KEY=...
```

---

## Part 4: Deploy Tenant Application

### Step 4.1: Create Project for Company in Coolify

1. In Coolify, go to **Projects**
2. Click **+ Add**
3. Name it: `ACME Limo` (or your company name)
4. Click **Save**

### Step 4.2: Add Application from Git Repository

1. Inside the project, click **+ New**
2. Select **Public Repository** (or Private if using credentials)
3. Enter your repository URL:
   ```
   https://github.com/yourusername/limo-service.git
   ```
4. Click **Check Repository**

### Step 4.3: Configure Build Settings

1. **Build Pack**: Select **Dockerfile**

2. **Dockerfile Location**: 
   ```
   deployment/app/Dockerfile
   ```

3. **Build Context**: Leave as `/` (root)

4. Click **Continue**

### Step 4.4: Add Environment Variables

Copy the variables from the generated tenant `.env` file.

**View generated environment file:**
```bash
cat /opt/limo-service/deployment/app/tenants/acme-limo/.env
```

**Add all variables to Coolify's Environment Variables section.**

Here's the complete list of variables to add:

| Variable | Value | Required |
|----------|-------|----------|
| `NODE_ENV` | `production` | Yes |
| `PORT` | `5000` | Yes |
| `HOST` | `0.0.0.0` | Yes |
| `COMPANY_SLUG` | `acme-limo` | Yes |
| `DATABASE_URL` | (from generated .env) | Yes |
| `SESSION_SECRET` | (from generated .env) | Yes |
| `STORAGE_PROVIDER` | `minio` | Yes |
| `MINIO_ENDPOINT` | (from generated .env) | Yes |
| `MINIO_ACCESS_KEY` | (from generated .env) | Yes |
| `MINIO_SECRET_KEY` | (from generated .env) | Yes |
| `MINIO_BUCKET` | (from generated .env) | Yes |
| `MINIO_USE_SSL` | `false` | Yes |
| `APP_PORT` | `5000` (or 5001, 5002 for multiple apps) | Yes |
| `APP_DOMAIN` | `acme-limo.com` | Recommended |

**Optional variables (add if configured in .env):**

| Variable | Purpose |
|----------|---------|
| `STRIPE_SECRET_KEY` | Payment processing |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhooks |
| `VITE_STRIPE_PUBLIC_KEY` | Stripe frontend |
| `TWILIO_ACCOUNT_SID` | SMS notifications |
| `TWILIO_AUTH_TOKEN` | SMS auth |
| `TWILIO_PHONE_NUMBER` | SMS sender number |
| `SMTP_HOST` | Email server |
| `SMTP_PORT` | Email port (587) |
| `SMTP_USER` | Email username |
| `SMTP_PASS` | Email password |
| `EMAIL_FROM_NAME` | Sender name |
| `EMAIL_FROM_ADDRESS` | Sender email |
| `TOMTOM_API_KEY` | Address geocoding |
| `RAPIDAPI_KEY` | Flight data |

### Step 4.5: Configure Network

1. Under **Network** section:
   - **Port Exposes**: `5000`
   - **Port Mappings**: Use the `APP_PORT` value (e.g., `5001:5000` for first tenant)

2. Enable **Health Check**:
   - **Path**: `/health`
   - **Interval**: `30`
   - **Timeout**: `10`

### Step 4.6: Deploy Application

1. Click **Deploy**
2. Watch the build logs
3. Wait for deployment to complete (3-5 minutes)

### Step 4.7: Run Database Migrations

After deployment succeeds:

1. Go to your deployed application in Coolify
2. Click **Terminal** tab
3. Run:
   ```bash
   npm run db:push
   ```

4. Wait for schema to be applied (should say "Done" when complete)

### Step 4.8: Verify Deployment

1. Open: `http://your-server-ip:5001` (using your APP_PORT)
2. You should see the limo booking page
3. Test login with default admin:
   - **Username**: `mikewhite`
   - **Password**: `admin123`
4. **Change the default password immediately!**

---

## Part 5: Configure Domain & SSL

### Step 5.1: Point Domain to Server

In your domain's DNS settings, add:

| Type | Name | Value |
|------|------|-------|
| A | @ | your-server-ip |
| A | www | your-server-ip |

Wait 5-30 minutes for DNS to propagate.

### Step 5.2: Configure Domain in Coolify

1. Go to your application in Coolify
2. Click **Settings** tab
3. Under **Domains**:
   - Add: `https://acme-limo.com`
   - Add: `https://www.acme-limo.com`

4. Enable **Auto SSL** (Let's Encrypt)

5. Click **Save**

6. Click **Redeploy**

### Step 5.3: Update APP_DOMAIN

1. Go to **Environment Variables**
2. Update `APP_DOMAIN` to your domain:
   ```
   APP_DOMAIN=acme-limo.com
   ```
3. Click **Save** and **Redeploy**

### Step 5.4: Verify HTTPS

1. Wait for SSL certificate to be issued (1-2 minutes)
2. Open: `https://acme-limo.com`
3. Verify the padlock icon shows in browser

---

## Part 6: Adding More Companies

For each new company, follow these quick steps:

### Quick Provisioning Checklist

1. **Run provisioning script:**
   ```bash
   cd /opt/limo-service/deployment/scripts
   ./provision-tenant.sh new-company-slug
   ```

2. **Customize the generated .env file:**
   ```bash
   nano /opt/limo-service/deployment/app/tenants/new-company-slug/.env
   ```
   - Update `APP_PORT` to next available port (5002, 5003, etc.)
   - Add optional API keys (Stripe, Twilio, etc.)

3. **Create new project in Coolify**

4. **Add application from Git repo**

5. **Copy environment variables from generated .env**

6. **Configure network with correct port mapping**

7. **Deploy and run migrations**

8. **Configure domain and SSL**

### Port Management for Multiple Apps

Each tenant runs on a different port:

| Company | APP_PORT | Port Mapping | Domain |
|---------|----------|--------------|--------|
| acme-limo | 5001 | 5001:5000 | acme-limo.com |
| vip-transport | 5002 | 5002:5000 | vip-transport.com |
| elite-cars | 5003 | 5003:5000 | elite-cars.com |

Coolify's reverse proxy routes domains to correct ports automatically when SSL is configured.

---

## Maintenance & Updates

### Updating an Application

**Method 1: Via Coolify UI**
1. Go to application in Coolify
2. Click **Redeploy**
3. Watch build logs

**Method 2: Automatic Webhooks**
1. Go to application **Settings**
2. Enable **Webhooks**
3. Copy the webhook URL
4. Add to GitHub repository settings > Webhooks
5. Deployments now happen automatically on push

### Restarting Application

1. Go to application in Coolify
2. Click **Restart** button
3. Wait for container to restart

### Viewing Logs

1. Go to application in Coolify
2. Click **Logs** tab
3. View real-time logs

### Backup Database

```bash
# SSH to server
ssh root@your-server-ip

# Backup all tenant databases
docker exec limo-central-postgres pg_dumpall -U postgres > backup_all_$(date +%Y%m%d).sql

# Backup single tenant
docker exec limo-central-postgres pg_dump -U postgres acme_limo_db > acme_backup_$(date +%Y%m%d).sql
```

### Restore Database

```bash
# Restore single tenant database
cat acme_backup.sql | docker exec -i limo-central-postgres psql -U postgres acme_limo_db
```

---

## Troubleshooting

### Build Failures in Coolify

**Symptoms**: Build fails with errors in Coolify

**Solutions**:
1. Click **Logs** tab to see full error
2. Verify Dockerfile path is `deployment/app/Dockerfile`
3. Check that build context is `/` (root)
4. Try **Force Rebuild** option
5. Clear build cache: Settings > Clear Build Cache

### Container Won't Start

**Symptoms**: Container starts but immediately stops

**Check logs**:
1. Go to Coolify > Application > **Logs**
2. Look for error messages

**Common causes**:
- Missing required environment variables
- Incorrect `DATABASE_URL` format
- MinIO endpoint unreachable
- Port conflict

**Solutions**:
1. Verify all required environment variables are set
2. Check DATABASE_URL format:
   ```
   postgresql://user:password@host:5432/database
   ```
3. Test MinIO is running:
   ```bash
   curl http://your-server-ip:9000/minio/health/live
   ```

### Application Shows "Not authenticated"

This is normal for unauthenticated users. Login with:
- **Username**: `mikewhite`
- **Password**: `admin123`

### Database Connection Failed

**Symptoms**: "Database connection error" or similar

**Check**:
1. PostgreSQL is running in Coolify
2. DATABASE_URL is correct
3. Database user has correct permissions

**Test connection**:
```bash
# In Coolify terminal for the app
psql $DATABASE_URL -c "SELECT 1"
```

### MinIO/Storage Errors

**Symptoms**: "Upload failed" or "Storage error"

**Check**:
1. MinIO is running in Coolify
2. Bucket exists (check MinIO Console at port 9001)
3. Credentials are correct

**Verify MinIO**:
```bash
curl http://your-server-ip:9000/minio/health/live
```

### SSL Certificate Issues

**Symptoms**: No HTTPS, certificate errors

**Check**:
1. DNS is pointing to server:
   ```bash
   dig +short your-domain.com
   ```
2. Wait 5-10 minutes for Let's Encrypt
3. Domain is correctly added in Coolify Settings

**Force certificate renewal**:
1. Go to application Settings
2. Remove domain
3. Save
4. Add domain back
5. Enable Auto SSL
6. Save and Redeploy

### Health Check Failing

**Symptoms**: Coolify shows unhealthy container

**Solutions**:
1. Verify app responds:
   ```bash
   curl http://localhost:5000/health
   ```
2. Check `PORT` environment variable is `5000`
3. Check `HOST` is `0.0.0.0`
4. Increase health check timeout to `30` seconds
5. Increase start period to `120` seconds

### Application Stuck in "Building"

**Solutions**:
1. Wait up to 10 minutes (first build is slow)
2. Check Coolify server resources (RAM, disk space)
3. Cancel build and try again
4. Check build logs for npm install failures

### "Command not found" in Terminal

**Symptoms**: Commands fail in Coolify terminal

**Solutions**:
1. Use full path: `/app/node_modules/.bin/drizzle-kit`
2. Or run via npm: `npm run db:push`

---

## Environment Variable Reference

### Required Variables

| Variable | Example | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Must be "production" |
| `PORT` | `5000` | Internal container port |
| `HOST` | `0.0.0.0` | Bind to all interfaces |
| `COMPANY_SLUG` | `acme-limo` | Unique company identifier |
| `DATABASE_URL` | `postgresql://...` | Full PostgreSQL connection |
| `SESSION_SECRET` | `abc123...` | 32+ char random string |
| `STORAGE_PROVIDER` | `minio` | Options: `minio`, `s3`, `replit` |
| `MINIO_ENDPOINT` | `http://ip:9000` | MinIO server URL |
| `MINIO_ACCESS_KEY` | `minioadmin` | MinIO access key |
| `MINIO_SECRET_KEY` | `password` | MinIO secret key |
| `MINIO_BUCKET` | `acme-uploads` | Company bucket name |
| `MINIO_USE_SSL` | `false` | `true` if using HTTPS |
| `APP_PORT` | `5001` | External port mapping |

### Optional Variables

| Variable | Description |
|----------|-------------|
| `APP_DOMAIN` | Your company's domain |
| `STRIPE_SECRET_KEY` | Stripe API key (sk_...) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret |
| `VITE_STRIPE_PUBLIC_KEY` | Stripe public key (pk_...) |
| `TWILIO_ACCOUNT_SID` | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | Twilio phone number |
| `SMTP_HOST` | Email server host |
| `SMTP_PORT` | Email server port (587) |
| `SMTP_USER` | Email username |
| `SMTP_PASS` | Email password |
| `EMAIL_FROM_NAME` | Sender name |
| `EMAIL_FROM_ADDRESS` | Sender email |
| `TOMTOM_API_KEY` | TomTom geocoding API |
| `RAPIDAPI_KEY` | RapidAPI for flights |

---

## Post-Deployment Checklist

After successful deployment:

- [ ] Application loads at configured domain/port
- [ ] SSL certificate is active (padlock icon)
- [ ] Admin login works (mikewhite / admin123)
- [ ] **Changed default admin password**
- [ ] Company branding updated (logo, name, colors)
- [ ] Vehicle types configured
- [ ] Pricing rules set up
- [ ] Test booking completes successfully
- [ ] Email notifications working (if configured)
- [ ] SMS notifications working (if configured)
- [ ] Payment processing working (if configured)

---

## Quick Reference Commands

```bash
# Generate secure password/secret
openssl rand -base64 32

# Run tenant provisioning
cd /opt/limo-service/deployment/scripts
./provision-tenant.sh company-slug

# View generated tenant config
cat /opt/limo-service/deployment/app/tenants/company-slug/.env

# Test database connection
psql postgresql://user:pass@host:5432/db -c "SELECT 1"

# Test MinIO health
curl http://your-server:9000/minio/health/live

# Backup all databases
docker exec limo-central-postgres pg_dumpall -U postgres > backup.sql

# View Coolify container logs
docker logs [container-id] -f
```

---

## Support Resources

- **Coolify Docs**: https://coolify.io/docs
- **Health Check**: `https://your-domain.com/health`
- **Coolify Discord**: https://discord.gg/coolify
