# Coolify Environment Variables Setup Guide

Complete guide for configuring environment variables in Coolify for USA Luxury Limo deployment.

## Table of Contents

1. [Overview](#overview)
2. [Required Environment Variables](#required-environment-variables)
3. [Optional Environment Variables](#optional-environment-variables)
4. [Step-by-Step Configuration](#step-by-step-configuration)
5. [Variable Generation Guide](#variable-generation-guide)
6. [MinIO Setup](#minio-setup)
7. [Testing Your Configuration](#testing-your-configuration)

---

## Overview

Environment variables are configuration settings that your application needs to run. In Coolify, you set these through the application's **Environment Variables** section.

**Important**: Never use the placeholder values from `.env.example` in production. Generate real, secure credentials for each variable.

---

## Required Environment Variables

These variables **must** be configured for the application to work:

| Variable | Description | Where to Get It |
|----------|-------------|-----------------|
| `DATABASE_URL` | PostgreSQL connection string | Neon Database Dashboard |
| `SESSION_SECRET` | Secure session encryption key | Generate with OpenSSL |
| `MINIO_ENDPOINT` | MinIO storage server URL | Your MinIO deployment |
| `MINIO_ACCESS_KEY` | MinIO access key | MinIO setup |
| `MINIO_SECRET_KEY` | MinIO secret key | MinIO setup |
| `MINIO_BUCKET` | MinIO bucket name | Create in MinIO |
| `STRIPE_SECRET_KEY` | Stripe payment API key | Stripe Dashboard |
| `VITE_STRIPE_PUBLIC_KEY` | Stripe public key (frontend) | Stripe Dashboard |

---

## Optional Environment Variables

Configure these for full functionality:

| Variable | Description | Default | Where to Get It |
|----------|-------------|---------|-----------------|
| `SMTP_HOST` | Email server hostname | - | Your email provider |
| `SMTP_PORT` | Email server port | 587 | Your email provider |
| `SMTP_USER` | Email username | - | Your email provider |
| `SMTP_PASS` | Email password | - | Your email provider |
| `SMTP_FROM` | Sender email address | - | Your email |
| `TWILIO_ACCOUNT_SID` | Twilio account ID | - | Twilio Console |
| `TWILIO_AUTH_TOKEN` | Twilio auth token | - | Twilio Console |
| `TWILIO_PHONE_NUMBER` | Twilio phone number | - | Twilio Console |
| `TOMTOM_API_KEY` | TomTom maps API key | - | TomTom Developer Portal |
| `RAPIDAPI_KEY` | RapidAPI key (flight data) | - | RapidAPI Account |
| `PAYPAL_CLIENT_ID` | PayPal client ID | - | PayPal Developer |
| `PAYPAL_CLIENT_SECRET` | PayPal secret | - | PayPal Developer |
| `SQUARE_ACCESS_TOKEN` | Square payment token | - | Square Developer |
| `SQUARE_LOCATION_ID` | Square location ID | - | Square Developer |

---

## Step-by-Step Configuration

### 1. Access Environment Variables in Coolify

1. Log in to your Coolify dashboard
2. Navigate to your **USA Luxury Limo** application
3. Click on the **Environment Variables** tab
4. You'll see a list of current variables

### 2. Set Required Variables

For each required variable, click **Add** or **Edit** and enter:

#### DATABASE_URL

**Format:**
```
postgresql://username:password@host:port/database?sslmode=require
```

**Example from Neon:**
```
postgresql://neonuser:abc123xyz@ep-cool-cloud-12345.us-east-2.aws.neon.tech:5432/neondb?sslmode=require
```

**How to get it:**
1. Go to [Neon.tech](https://neon.tech)
2. Navigate to your project
3. Click "Connection Details"
4. Copy the full connection string
5. Make sure `?sslmode=require` is at the end

---

#### SESSION_SECRET

**Generate a secure random string:**

**On macOS/Linux:**
```bash
openssl rand -base64 32
```

**On Windows PowerShell:**
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

**Example output:**
```
kJ8mN2pQ4rS6tU8vW0xY2zA4bC6dE8fG
```

Copy this value and paste it into Coolify.

**Important**: Generate a **new** secret for production. Never reuse secrets across environments.

---

#### MinIO Variables

If you deployed MinIO as a separate service in Coolify:

```
MINIO_ENDPOINT=http://usa-limo-minio:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=<YOUR_SECURE_PASSWORD>
MINIO_BUCKET=usa-luxury-limo
```

**How to set MINIO_SECRET_KEY:**
1. Generate a secure password (20+ characters)
2. Use the same password you set when deploying MinIO
3. You'll need this to log into MinIO console later

**Note**: `usa-limo-minio` is the service name in the docker network. Change it if you named your MinIO service differently.

---

#### Stripe Variables

**Get from Stripe Dashboard:**

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers** → **API Keys**
3. For testing, use **Test mode** keys (they start with `sk_test_` and `pk_test_`)
4. For production, use **Live mode** keys (they start with `sk_live_` and `pk_live_`)

```
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxx
VITE_STRIPE_PUBLIC_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxx
```

**Important**: 
- `STRIPE_SECRET_KEY` is secret - never share it
- `VITE_STRIPE_PUBLIC_KEY` is safe to expose (it's used in frontend)
- Start with test keys, switch to live keys when ready for production

---

### 3. Set Optional Variables

Configure these as needed for full functionality:

#### Email Configuration (SMTP)

**For Gmail:**
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=<your-app-password>
SMTP_FROM=USA Luxury Limo <your-email@gmail.com>
```

**Gmail App Password:**
1. Go to Google Account settings
2. Enable 2-Step Verification
3. Go to Security → App passwords
4. Generate a new app password
5. Use this as `SMTP_PASS`

**For SendGrid:**
```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=<your-sendgrid-api-key>
SMTP_FROM=noreply@yourdomain.com
```

---

#### Twilio (SMS Notifications)

**Get from Twilio Console:**

1. Go to [Twilio Console](https://console.twilio.com)
2. Find your Account SID and Auth Token on the dashboard
3. Get a phone number from **Phone Numbers** → **Manage** → **Active Numbers**

```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+15551234567
```

---

#### TomTom Maps API

**Get API Key:**

1. Go to [TomTom Developer Portal](https://developer.tomtom.com)
2. Create an account or sign in
3. Create a new API key
4. Copy the key

```
TOMTOM_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

#### RapidAPI (Flight Data)

**Get API Key:**

1. Go to [RapidAPI](https://rapidapi.com)
2. Sign up or sign in
3. Subscribe to the **AeroDataBox API**
4. Copy your API key from the dashboard

```
RAPIDAPI_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

### 4. Save and Deploy

After entering all variables:

1. Click **Save** in Coolify
2. Click **Deploy** to restart the application with new variables
3. Wait for deployment to complete

---

## Variable Generation Guide

### Secure Random Strings

For any secret keys or passwords:

**Using OpenSSL (macOS/Linux):**
```bash
# For SESSION_SECRET (32 bytes = ~44 characters base64)
openssl rand -base64 32

# For MINIO_SECRET_KEY (24 bytes = ~32 characters base64)
openssl rand -base64 24
```

**Using Python:**
```python
import secrets
print(secrets.token_urlsafe(32))
```

**Using Node.js:**
```javascript
require('crypto').randomBytes(32).toString('base64')
```

---

## MinIO Setup

### Option 1: Deploy MinIO in Coolify

1. In Coolify, click **+ New Resource**
2. Choose **Docker Image**
3. Use image: `minio/minio:latest`
4. Set environment variables:
   ```
   MINIO_ROOT_USER=minioadmin
   MINIO_ROOT_PASSWORD=<your-secure-password>
   ```
5. Set command: `server /data --console-address :9001`
6. Expose ports:
   - Port 9000 (API)
   - Port 9001 (Console)
7. Add persistent storage volume: `/data`
8. Deploy

### Option 2: Use Docker Compose

Create a separate MinIO service using the `docker-compose.yml` file in the repository:

```bash
docker-compose up -d minio
```

### Create the Bucket

After MinIO is deployed:

1. Access MinIO Console at `http://your-server:9001`
2. Log in with your MINIO_ROOT_USER and MINIO_ROOT_PASSWORD
3. Click **Buckets** → **Create Bucket**
4. Name it `usa-luxury-limo`
5. Click **Create**
6. Set bucket to **Public** (for logos and hero images) or keep private

---

## Testing Your Configuration

### 1. Check Application Logs

After deployment:

1. Go to Coolify → Your Application → **Logs**
2. Look for successful startup messages:
   ```
   Server running on port 5000 (production mode)
   Database connected successfully
   Storage adapter initialized: MinIO
   ```

### 2. Test Health Endpoint

Visit your application URL:
```
https://your-app-url.com/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2025-11-09T..."
}
```

### 3. Test Database Connection

Try logging in or creating an account. If you get database errors, check:
- DATABASE_URL is correct
- Database allows connections from your server's IP
- SSL mode is set (`?sslmode=require` for Neon)

### 4. Test File Storage

Try uploading a logo or driver document. If uploads fail, check:
- MinIO is running and accessible
- MINIO_ENDPOINT uses the correct service name
- MINIO_ACCESS_KEY and MINIO_SECRET_KEY match MinIO settings
- Bucket `usa-luxury-limo` exists

### 5. Test Stripe Integration

Try creating a booking with "Pay Now". If payment fails, check:
- STRIPE_SECRET_KEY is correct and from the right mode (test/live)
- VITE_STRIPE_PUBLIC_KEY matches the secret key mode
- Stripe webhook (if configured) points to your domain

---

## Common Issues and Solutions

### Issue: Application won't start

**Check:**
```
docker logs <container-name>
```

**Common causes:**
- Missing required environment variables
- Incorrect DATABASE_URL format
- Database not accessible
- MinIO endpoint incorrect

### Issue: Database connection fails

**Check:**
```
Error: Connection timed out
Error: SSL required
```

**Solutions:**
- Add `?sslmode=require` to DATABASE_URL for Neon
- Check if database firewall allows connections
- Verify username and password are correct

### Issue: File uploads fail

**Check MinIO logs:**
```
docker logs usa-limo-minio
```

**Solutions:**
- Ensure bucket exists
- Check MINIO_ACCESS_KEY and MINIO_SECRET_KEY match
- Verify MINIO_ENDPOINT uses internal docker network name
- Make sure MinIO service is running

### Issue: Emails not sending

**Check:**
- SMTP credentials are correct
- If using Gmail, you need an App Password (not your regular password)
- SMTP_PORT is correct (usually 587 for TLS, 465 for SSL)

---

## Security Best Practices

### 1. Use Strong Secrets
- Generate random secrets for SESSION_SECRET
- Never reuse secrets across environments
- Minimum 32 characters for SESSION_SECRET

### 2. Rotate Credentials
- Rotate API keys periodically
- Rotate database passwords quarterly
- Update SESSION_SECRET if compromised

### 3. Environment Separation
- Use different credentials for development and production
- Use Stripe test keys for staging, live keys for production
- Never commit `.env` files to git

### 4. Access Control
- Limit who has access to Coolify dashboard
- Use role-based access in your application
- Keep Coolify updated for security patches

---

## Quick Reference: Minimum Required Setup

To get the application running (without email/SMS/payment):

```env
# Database (REQUIRED)
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require

# Security (REQUIRED)
SESSION_SECRET=<generate-with-openssl-rand-base64-32>

# Storage (REQUIRED)
MINIO_ENDPOINT=http://usa-limo-minio:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=<your-secure-password>
MINIO_BUCKET=usa-luxury-limo

# Payment (REQUIRED for bookings)
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxx
VITE_STRIPE_PUBLIC_KEY=pk_test_xxxxxxxxxxxx

# System
NODE_ENV=production
PORT=5000
HOST=0.0.0.0
```

Add the optional variables as you need features like email notifications, SMS alerts, or additional payment methods.

---

## Summary

1. **Required Variables**: DATABASE_URL, SESSION_SECRET, MinIO settings, Stripe keys
2. **Generate Secure Secrets**: Use `openssl rand -base64 32` for SESSION_SECRET
3. **Database**: Get connection string from Neon, include `?sslmode=require`
4. **MinIO**: Deploy separately in Coolify, create bucket, use docker network name for endpoint
5. **Stripe**: Start with test keys, switch to live when ready
6. **Test**: Check logs, visit /health endpoint, try key features

For deployment troubleshooting, see [DEPLOYMENT.md](DEPLOYMENT.md).
For quick deployment, see [QUICK_START.md](QUICK_START.md).
