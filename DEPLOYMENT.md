# USA Luxury Limo - Coolify Deployment Guide

Complete step-by-step guide to deploy your USA Luxury Limo application on Coolify using your Hostinger VPS server.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Prepare Your GitHub Repository](#prepare-your-github-repository)
3. [Setup MinIO for Object Storage](#setup-minio-for-object-storage)
4. [Deploy Application on Coolify](#deploy-application-on-coolify)
5. [Configure Environment Variables](#configure-environment-variables)
6. [Post-Deployment Configuration](#post-deployment-configuration)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### What You Need

✅ **Coolify** installed on your Hostinger VPS  
✅ **GitHub account** with your code repository  
✅ **PostgreSQL database** (from Neon or your own server)  
✅ **Domain name** (optional, but recommended for production)

### Services Required

- **Stripe Account** - Payment processing ([stripe.com](https://stripe.com))
- **Twilio Account** - SMS notifications ([twilio.com](https://twilio.com))
- **TomTom API Key** - Geocoding ([developer.tomtom.com](https://developer.tomtom.com))
- **RapidAPI Key** - Flight search ([rapidapi.com](https://rapidapi.com))

---

## 1. Prepare Your GitHub Repository

### Step 1: Push Your Code to GitHub

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit your changes
git commit -m "Prepare for Coolify deployment"

# Add your GitHub repository as remote
git remote add origin https://github.com/yourusername/usa-luxury-limo.git

# Push to GitHub
git push -u origin main
```

### Step 2: Verify Required Files

Make sure these files exist in your repository:
- ✅ `Dockerfile` - For building the production image
- ✅ `.dockerignore` - To exclude unnecessary files
- ✅ `.env.example` - Environment variables template
- ✅ `docker-compose.yml` - Local testing (optional for Coolify)

---

## 2. Setup MinIO for Object Storage

MinIO will store your uploaded files (driver documents, profile pictures, CMS media).

### Option A: Deploy MinIO in Coolify (Recommended)

1. **In Coolify Dashboard**:
   - Click **+ New Resource** → **Service**
   - Search for **"MinIO"**
   - Click **Deploy**

2. **Configure MinIO**:
   - **Service Name**: `usa-limo-minio`
   - **Root User**: `minioadmin` (default)
   - **Root Password**: Generate a strong password (save this!)
   
3. **After Deployment**:
   - Note the internal service URL (e.g., `http://usa-limo-minio:9000`)
   - Access MinIO Console at: `https://your-minio-domain.com` (if you set up a domain)

4. **Create Bucket**:
   - Open MinIO Console (port 9001)
   - Login with root credentials
   - Click **Buckets** → **Create Bucket**
   - Bucket Name: `usa-luxury-limo`
   - Click **Create**

### Option B: Use External S3 Storage

If you prefer AWS S3 or another S3-compatible service, skip MinIO and use those credentials instead in your environment variables.

---

## 3. Deploy Application on Coolify

### Step 1: Create New Application

1. **In Coolify Dashboard**:
   - Navigate to your Project/Environment
   - Click **+ New Resource** → **Application**

2. **Choose Source**:
   - Select **GitHub** (connect your account if not already connected)
   - Choose your repository: `yourusername/usa-luxury-limo`
   - Select branch: `main` (or your production branch)
   - Click **Continue**

### Step 2: Configure Build Settings

1. **Build Pack**: 
   - Select **Dockerfile**
   - Dockerfile Location: `/Dockerfile` (default)

2. **Port Configuration**:
   - **Port**: `5000`
   - **Protocol**: HTTP

3. **Health Check** (Optional but recommended):
   - **Path**: `/api/health`
   - **Port**: `5000`
   - **Interval**: `30s`
   - **Timeout**: `5s`
   - **Retries**: `3`

### Step 3: Configure Deployment

1. **Auto Deploy**:
   - ✅ Enable "Auto Deploy on Commit" (optional)
   - This will automatically redeploy when you push to GitHub

2. **Domain** (Optional):
   - Add your custom domain or use Coolify's generated domain
   - Coolify will automatically provision SSL certificate via Let's Encrypt

3. Click **Save**

---

## 4. Configure Environment Variables

Critical step! Your app won't work without these.

### In Coolify UI

1. Go to your application
2. Click **Environment Variables** tab
3. Click **+ Add**
4. Add each variable below

### Required Environment Variables

#### Core Configuration
```bash
NODE_ENV=production
PORT=5000
```

#### Database (REQUIRED)
```bash
DATABASE_URL=postgresql://user:password@host:5432/database
```
Get this from your Neon dashboard or PostgreSQL provider.

#### Session Secret (REQUIRED)
```bash
SESSION_SECRET=generate-a-random-32-char-secret-here
```
Generate with: `openssl rand -base64 32`

#### Stripe Payment (REQUIRED)
```bash
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
VITE_STRIPE_PUBLIC_KEY=pk_live_your_stripe_public_key
```
Mark `STRIPE_SECRET_KEY` as **Build Variable** in Coolify.

#### MinIO Object Storage (REQUIRED)
```bash
MINIO_ENDPOINT=http://usa-limo-minio:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=your-strong-password-from-minio-setup
MINIO_BUCKET=usa-luxury-limo
```
**Important**: Use the internal Docker service name (e.g., `usa-limo-minio`) not external domain!

#### Email Configuration (Optional but Recommended)
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
EMAIL_FROM_NAME=USA Luxury Limo
EMAIL_FROM_ADDRESS=noreply@usaluxurylimo.com
```

#### SMS Configuration (Optional but Recommended)
```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

#### API Keys (Optional but Recommended)
```bash
TOMTOM_API_KEY=your_tomtom_api_key
RAPIDAPI_KEY=your_rapidapi_key
```

#### Domain Configuration (Optional)
```bash
REPLIT_DEV_DOMAIN=your-domain.com
```
Set this to your production domain for email links and payment redirects.

### Step 4: Mark Build Variables

In Coolify, mark these as **Build Variables** (checkbox):
- `VITE_STRIPE_PUBLIC_KEY` (any variable starting with `VITE_`)

### Step 5: Save and Deploy

1. Click **Update** to save environment variables
2. Click **Deploy** to start your first deployment
3. Monitor the build logs in real-time

---

## 5. Post-Deployment Configuration

### Step 1: Run Database Migrations

After first successful deployment:

1. **Connect to your application container**:
   ```bash
   # In Coolify, go to your app → Logs/Terminal
   # Or SSH into your VPS and run:
   docker exec -it usa-luxury-limo sh
   ```

2. **Push database schema**:
   ```bash
   npm run db:push
   ```

3. **Verify database connection**:
   Check your app logs to ensure database connected successfully.

### Step 2: Create Admin Account

1. Visit your application: `https://your-domain.com`
2. Click **Login** and choose role: **Admin**
3. Create your first admin account

### Step 3: Test File Upload

1. Login as admin
2. Go to **CMS** settings
3. Try uploading a logo or hero image
4. Verify it displays correctly (this tests MinIO integration)

### Step 4: Configure Payment Providers

1. Go to **Admin Dashboard** → **System Settings**
2. Add your payment provider credentials (Stripe, PayPal, Square)
3. Test a booking to ensure payment flow works

---

## 6. Troubleshooting

### Application Won't Start

**Check logs in Coolify**:
- Look for errors related to missing environment variables
- Verify `DATABASE_URL` is correct
- Ensure `STRIPE_SECRET_KEY` is set

**Common issues**:
```
❌ "DATABASE_URL must be set"
   → Add DATABASE_URL to environment variables

❌ "Object Storage not configured"
   → Verify MINIO_* variables are set correctly

❌ "Missing required Stripe secret"
   → Add STRIPE_SECRET_KEY
```

### Files Not Uploading

**Check MinIO connection**:
```bash
# In app container:
curl http://usa-limo-minio:9000/minio/health/live
```

**Common issues**:
- ❌ Bucket doesn't exist → Create bucket in MinIO console
- ❌ Wrong MINIO_ENDPOINT → Use internal Docker name, not external domain
- ❌ Wrong credentials → Verify MINIO_ACCESS_KEY and MINIO_SECRET_KEY

### Database Connection Errors

**Check if database is accessible**:
```bash
# Test connection (replace with your DATABASE_URL)
psql "postgresql://user:password@host:5432/database"
```

**Common issues**:
- ❌ Firewall blocking connection → Allow Coolify server IP in database firewall
- ❌ SSL issues → Check if your database requires SSL connection string parameter

### Build Failures

**Check Dockerfile**:
- Ensure all dependencies are in `package.json`
- Verify `npm run build` works locally

**Check build logs**:
- Look for missing packages or TypeScript errors
- Ensure `shared` folder is copied in Dockerfile

### Email Not Sending

**Test SMTP connection**:
- Login as admin
- Go to **System Settings** → **Email Configuration**
- Click **Test Email Connection**

**Common issues**:
- ❌ Gmail blocking: Enable "App Passwords" in Google Account settings
- ❌ Wrong port: Try 587 (TLS) or 465 (SSL)
- ❌ Authentication failed: Double-check SMTP_USER and SMTP_PASS

---

## 7. Production Checklist

Before going live, verify:

- [ ] All environment variables are set
- [ ] Database migrations are up to date (`npm run db:push`)
- [ ] MinIO bucket is created and accessible
- [ ] SSL certificate is active (HTTPS)
- [ ] Stripe is in production mode (not test mode)
- [ ] Admin account is created
- [ ] Test booking works end-to-end
- [ ] Email notifications are sending
- [ ] SMS notifications are working (if configured)
- [ ] Custom domain is pointing to Coolify (if using)
- [ ] Backup strategy is in place for database and MinIO data

---

## 8. Updating Your Application

### To Deploy New Changes:

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Your update message"
   git push origin main
   ```

2. **In Coolify**:
   - If auto-deploy is enabled, it will deploy automatically
   - Otherwise, click **Deploy** button manually

3. **Monitor deployment**:
   - Watch build logs for any errors
   - Test the new features after deployment

### Rollback if Needed:

1. In Coolify, go to **Deployments** tab
2. Find the last working deployment
3. Click **Redeploy**

---

## 9. Maintenance Tips

### Regular Tasks

- **Backup Database**: Schedule regular PostgreSQL backups
- **Backup MinIO Data**: Export MinIO volumes periodically
- **Monitor Logs**: Check Coolify logs for errors weekly
- **Update Dependencies**: Keep packages updated (`npm update`)
- **Security Updates**: Monitor for security advisories

### Scaling

If your app grows:
- **Horizontal Scaling**: Deploy multiple app instances behind a load balancer
- **Database**: Upgrade to larger Neon plan or dedicated PostgreSQL server
- **MinIO**: Consider switching to AWS S3 for better scalability

---

## Support

Need help? Check these resources:

- **Coolify Documentation**: [coolify.io/docs](https://coolify.io/docs)
- **MinIO Docs**: [min.io/docs](https://min.io/docs)
- **Neon Database Docs**: [neon.tech/docs](https://neon.tech/docs)
- **Stripe Integration**: [stripe.com/docs](https://stripe.com/docs)

---

## Summary

You've successfully deployed USA Luxury Limo to Coolify! 🎉

Your stack:
- ✅ **App**: Node.js + React running in Docker
- ✅ **Database**: PostgreSQL (Neon or self-hosted)
- ✅ **Storage**: MinIO (or S3)
- ✅ **Deployment**: Coolify on Hostinger VPS
- ✅ **SSL**: Automatic with Let's Encrypt
- ✅ **Payments**: Stripe integration
- ✅ **Notifications**: Email (SMTP) + SMS (Twilio)

Enjoy your production-ready luxury limo booking platform!
