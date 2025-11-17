# USA Luxury Limo - Coolify Deployment Guide

Complete guide to deploy USA Luxury Limo on Coolify using docker-compose.

## 🚀 Quick Deploy (For Current Issue - Asset Mismatch Fix)

### Problem: White screen with JavaScript MIME type errors

**Cause:** Old build assets (Nov 10) don't match new index.html (Nov 16)

**Solution:** Force rebuild to regenerate all assets

### Fix Steps:

1. **In Coolify Dashboard:**
   - Navigate to your application → **"Deployments"** tab
   - Click **"Force Rebuild & Redeploy"** button
   - Wait 3-5 minutes for completion

2. **Verify Build Logs Show:**
   ```
   ✓ Frontend build verification: PASSED
   ✓ Backend build verification: PASSED
   ```

3. **Clear Browser Cache:**
   - Chrome/Edge: `Ctrl+Shift+Delete`
   - Safari: `Cmd+Option+E`
   - Or use Incognito/Private window

4. **Test:** Visit https://best-chauffeurs.com

---

## 📋 Full Coolify Deployment Setup

### Prerequisites

- Coolify installed on your VPS (Ubuntu/Debian)
- GitHub repository with your code
- Domain name (e.g., best-chauffeurs.com)
- MinIO or S3 for object storage
- PostgreSQL database (Neon or self-hosted)

---

## Step 1: Create Application in Coolify

### 1.1 Add New Resource

1. Login to **Coolify Dashboard**
2. Click **"+ New"** → **"Application"**
3. Select **"Public Repository"** or connect your GitHub account
4. Enter repository URL: `https://github.com/yourusername/usaluxurylimo`
5. Select branch: `main`

### 1.2 Configure Build Settings

- **Build Pack:** Docker Compose
- **Docker Compose File:** `docker-compose-best-chauffeurs.yml`
- **Base Directory:** `/` (root)
- **Publish Directory:** Not needed (Docker handles this)

### 1.3 Set Domains

Add your domains (Coolify auto-configures Caddy for SSL):

```
best-chauffeurs.com
www.best-chauffeurs.com
adminaccess.best-chauffeurs.com
```

**Important:** These must match the domains in your docker-compose file's Caddy labels.

---

## Step 2: Configure Environment Variables

Go to **"Environment Variables"** tab and add all required variables:

### Core Configuration (REQUIRED)

```bash
NODE_ENV=production
PORT=5000
```

### Database (REQUIRED)

```bash
DATABASE_URL=postgresql://username:password@host:5432/database_name
```

**Example for Neon:**
```bash
DATABASE_URL=postgresql://user:pass@ep-example.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### Session Security (REQUIRED)

```bash
SESSION_SECRET=your-very-long-random-secret-here-min-32-chars
```

Generate with: `openssl rand -hex 32`

### Object Storage - MinIO (REQUIRED)

```bash
MINIO_ENDPOINT=http://minio:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=your-minio-password-here
MINIO_BUCKET=best-chauffeurs
```

**Note:** If MinIO is on same Coolify instance, use `http://minio:9000`. If external, use full URL like `https://minio.example.com`.

### Payment Processing (REQUIRED)

```bash
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
VITE_STRIPE_PUBLIC_KEY=pk_live_xxxxxxxxxxxxx
```

**Development/Testing:**
```bash
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
VITE_STRIPE_PUBLIC_KEY=pk_test_xxxxxxxxxxxxx
```

### Database Encryption (REQUIRED for Admin DB Config)

```bash
SETTINGS_ENCRYPTION_KEY=your-64-character-hex-string-here
```

Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### Email Notifications (OPTIONAL but recommended)

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM_NAME=USA Luxury Limo
EMAIL_FROM_ADDRESS=noreply@best-chauffeurs.com
```

### SMS Notifications (OPTIONAL but recommended)

```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

### API Keys (OPTIONAL but recommended)

```bash
TOMTOM_API_KEY=your-tomtom-api-key
RAPIDAPI_KEY=your-rapidapi-key
```

### Admin Panel Access (OPTIONAL)

```bash
ADMIN_PANEL_HOSTS=adminaccess.best-chauffeurs.com
VITE_ADMIN_PANEL_HOSTS=adminaccess.best-chauffeurs.com
```

### Domain Configuration (OPTIONAL)

```bash
REPLIT_DEV_DOMAIN=best-chauffeurs.com
```

---

## Step 3: Deploy

### 3.1 Initial Deployment

1. Click **"Deploy"** button (top right)
2. Monitor build logs in real-time
3. Wait for "Deployment successful" message (3-5 minutes)

### 3.2 Verify Build Success

Check logs for these confirmations:

```
✓ Frontend build verification: PASSED
✓ Backend build verification: PASSED
✓ Health check passed
Server running on port 5000 (production mode)
```

### 3.3 Check Application Logs

1. Go to **"Logs"** tab
2. Should see:
   ```
   Server running on port 5000 (production mode)
   [SCHEDULED JOBS] Starting scheduled jobs...
   ```

---

## Step 4: DNS Configuration

### 4.1 Point Your Domains to Coolify

Add these DNS records at your domain registrar:

**For best-chauffeurs.com:**
```
Type: A
Name: @
Value: YOUR_SERVER_IP
TTL: 3600
```

**For www subdomain:**
```
Type: A
Name: www
Value: YOUR_SERVER_IP
TTL: 3600
```

**For admin subdomain:**
```
Type: A
Name: adminaccess
Value: YOUR_SERVER_IP
TTL: 3600
```

### 4.2 Wait for SSL

Coolify automatically provisions SSL certificates via Caddy. This takes 1-5 minutes after DNS propagates.

---

## Step 5: Post-Deployment Verification

### 5.1 Health Check

Visit: `https://best-chauffeurs.com/health`

Should return:
```json
{"status":"ok","timestamp":"2024-11-16T17:00:00.000Z"}
```

### 5.2 Test Main Site

1. Visit `https://best-chauffeurs.com`
2. Should load without white screen
3. Open browser console (F12) - no JavaScript errors
4. Test theme switcher (Light/Dark/System)

### 5.3 Test Admin Panel

1. Visit `https://adminaccess.best-chauffeurs.com`
2. Should redirect to admin login
3. Log in with admin credentials
4. Verify dashboard loads

### 5.4 Test API

```bash
curl https://best-chauffeurs.com/api/health
```

Should return `200 OK`

---

## Troubleshooting

### Issue: White Screen / JavaScript Errors

**Symptoms:**
```
Failed to load module script: Expected JavaScript but got text/html
```

**Cause:** Asset mismatch (old build files with new index.html)

**Fix:**
1. Go to **"Deployments"** tab
2. Click **"Force Rebuild & Redeploy"**
3. Clear browser cache
4. Retry

### Issue: 502 Bad Gateway

**Cause:** Application not running or wrong port

**Fix:**
1. Check **"Logs"** tab for errors
2. Verify `PORT=5000` in environment variables
3. Verify application started: "Server running on port 5000"
4. Restart deployment if needed

### Issue: Database Connection Failed

**Symptoms:**
```
Connection terminated unexpectedly
Error: ECONNREFUSED
```

**Fix:**
1. Verify `DATABASE_URL` is correct
2. Check database server is accessible from Coolify
3. For Neon: Ensure `?sslmode=require` is in connection string
4. Check database firewall allows Coolify server IP

### Issue: Session Errors / Cannot Login

**Cause:** Missing `NODE_ENV=production` or `SESSION_SECRET`

**Fix:**
1. Add `NODE_ENV=production` to environment variables
2. Add `SESSION_SECRET` (32+ characters)
3. Redeploy application
4. Check logs for: "Using PostgreSQL session store"

### Issue: MinIO/Object Storage Not Working

**Symptoms:** Images not loading, upload failures

**Fix:**
1. Verify MinIO is running (if self-hosted)
2. Check `MINIO_ENDPOINT` is correct
3. Verify `MINIO_ACCESS_KEY` and `MINIO_SECRET_KEY`
4. Test connection: Check admin panel → Media Library

### Issue: Email/SMS Not Sending

**Cause:** Missing or incorrect credentials

**Fix:**
1. Verify all SMTP variables are set
2. For Gmail: Use App Password, not regular password
3. Check Twilio credentials are correct
4. Review application logs for email/SMS errors

---

## Advanced: Custom Docker Compose

If you need to modify the deployment:

### 1. Edit docker-compose-best-chauffeurs.yml

Already configured with all settings. Located at project root.

### 2. Rebuild After Changes

In Coolify:
1. Push changes to GitHub
2. Click **"Redeploy"** (builds with new docker-compose)
3. Or click **"Force Rebuild"** to start fresh

### 3. View Container Details

```bash
# SSH into your server
ssh root@your-server-ip

# List containers
docker ps | grep limo

# View logs
docker logs -f <container-id>

# Enter container
docker exec -it <container-id> sh
```

---

## Monitoring & Maintenance

### Auto-Deploy on Push

Enable in Coolify:
1. Go to **"General"** tab
2. Enable **"Automatic Deployment"**
3. Set branch to `main`
4. Now pushes to GitHub auto-deploy

### Logs & Debugging

- **Application Logs:** Coolify Dashboard → "Logs" tab
- **Build Logs:** Coolify Dashboard → "Deployments" tab
- **Server Logs:** SSH to server, run `docker logs -f <container-name>`

### Backups

**Database Backups:**
- Neon: Automatic daily backups with point-in-time recovery
- Self-hosted: Set up `pg_dump` cron job

**Object Storage Backups:**
- MinIO: Configure bucket replication or periodic backups
- S3: Enable versioning and lifecycle policies

### Updates & Scaling

**Update Application:**
1. Push code to GitHub
2. Coolify auto-deploys (if enabled)
3. Or manually click "Deploy"

**Scale Resources:**
- Coolify Dashboard → "Resources" tab
- Adjust CPU/Memory limits if needed
- For high traffic: Add load balancer (Coolify Pro)

---

## Production Checklist

Before going live:

- [ ] All environment variables set correctly
- [ ] `NODE_ENV=production` is set
- [ ] Database connection works
- [ ] SSL certificates provisioned (https:// works)
- [ ] Admin panel restricted to adminaccess subdomain
- [ ] Object storage (MinIO/S3) configured and tested
- [ ] Email notifications working
- [ ] SMS notifications working (if using)
- [ ] Payment processing tested (Stripe live mode)
- [ ] Health check returns 200 OK
- [ ] Application logs show no errors
- [ ] Database backups configured
- [ ] DNS records correct (A records point to server)
- [ ] All domains resolve correctly
- [ ] Session persistence works (PostgreSQL-backed)
- [ ] Theme system works (Light/Dark/System)

---

## Support & Resources

- **Coolify Docs:** https://coolify.io/docs
- **USA Limo Troubleshooting:** See `TROUBLESHOOTING_DEPLOYMENT.md`
- **Quick Start:** See `QUICK_START.md`
- **GitHub Setup:** See `GITHUB_SETUP.md`

---

## Common Commands

```bash
# View running containers
docker ps

# View app logs
docker logs -f <container-name>

# Rebuild without cache
docker-compose -f docker-compose-best-chauffeurs.yml build --no-cache

# Restart app
docker-compose -f docker-compose-best-chauffeurs.yml restart

# Stop app
docker-compose -f docker-compose-best-chauffeurs.yml down

# Start app
docker-compose -f docker-compose-best-chauffeurs.yml up -d
```

---

**Last Updated:** November 16, 2024
**Version:** 1.0.0
