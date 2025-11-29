# Quick Start - Deploy to Coolify in 5 Minutes

This is a simplified guide to get your USA Luxury Limo application deployed quickly on Coolify. For detailed troubleshooting, see [DEPLOYMENT.md](DEPLOYMENT.md).

## Prerequisites

Before starting, make sure you have:
- ✅ Coolify installed on your Ubuntu VPS
- ✅ GitHub repository with your code (see [GITHUB_SETUP.md](GITHUB_SETUP.md))
- ✅ PostgreSQL database URL (from Neon or your provider)
- ✅ Stripe API keys (for payments)

## Step 1: Deploy MinIO (2 minutes)

MinIO stores your uploaded files (driver documents, logos, etc.).

1. In Coolify: Click **+ New Resource** → **Service**
2. Search for **"MinIO"** and click **Deploy**
3. Configure:
   - Service Name: `usa-limo-minio`
   - Root Password: Generate strong password (save it!)
4. After deployment, open **MinIO Console** (port 9001)
5. Create a bucket named: `usa-luxury-limo`

**Save these for later:**
- MinIO endpoint: `http://usa-limo-minio:9000`
- Access Key: `minioadmin`
- Secret Key: (your password from step 3)

## Step 2: Deploy Application (3 minutes)

1. In Coolify: Click **+ New Resource** → **Application**

2. **Connect GitHub:**
   - Select **GitHub**
   - Choose: `yourusername/new-usa-luxury-limo-service`
   - Branch: `main`
   - Click **Continue**

3. **Build Settings:**
   - Build Pack: **Dockerfile**
   - Port: `5000`
   - Health Check Path: `/health`

4. **Environment Variables:** Click **Environment Variables** tab and add:

   **Required variables** (replace with real values - see [COOLIFY_ENV_SETUP.md](COOLIFY_ENV_SETUP.md) for detailed instructions):

   ```bash
   # Database
   DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
   
   # Security (generate with: openssl rand -base64 32)
   SESSION_SECRET=<generate-secure-random-string>
   
   # Payment
   STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxx
   VITE_STRIPE_PUBLIC_KEY=pk_test_xxxxxxxxxxxx
   
   # Storage (use values from Step 1)
   MINIO_ENDPOINT=http://usa-limo-minio:9000
   MINIO_ACCESS_KEY=minioadmin
   MINIO_SECRET_KEY=<your-minio-password>
   MINIO_BUCKET=usa-luxury-limo
   
   # System
   NODE_ENV=production
   PORT=5000
   HOST=0.0.0.0
   ```

   **⚠️ Important**: 
   - Generate a secure `SESSION_SECRET` with `openssl rand -base64 32`
   - Use your Neon database URL for `DATABASE_URL`
   - Start with Stripe test keys (`sk_test_` / `pk_test_`)
   - For detailed setup instructions, see [COOLIFY_ENV_SETUP.md](COOLIFY_ENV_SETUP.md)

5. **Mark Build Variables:**
   - Check "Build Variable" for: `VITE_STRIPE_PUBLIC_KEY`

6. Click **Deploy** and wait 2-3 minutes

## Step 3: Initialize Database (1 minute)

After deployment succeeds:

1. In Coolify, go to your app → **Terminal** tab
2. Run migration:
   ```bash
   npm run db:push
   ```
3. Exit terminal

## Step 4: Verify Deployment

1. Visit your app URL (provided by Coolify)
2. Click **Login** → **Admin**
3. Create your first admin account
4. Go to **CMS** and test uploading a logo

**Done!** Your app is live 🎉

## Quick Troubleshooting

### App won't start?
- Check logs: Go to your app → **Logs** tab
- Common fix: Verify `DATABASE_URL` is correct

### 502 Bad Gateway?
- App must listen on `0.0.0.0:5000` (already configured ✓)
- Check environment variables are saved

### File uploads fail?
- Verify MinIO bucket exists: `usa-luxury-limo`
- Check `MINIO_ENDPOINT` uses internal name: `http://usa-limo-minio:9000`

### Database connection error?
- Allow Coolify server IP in database firewall (Neon/your provider)

## Optional: Add Custom Domain

1. In Coolify app settings → **Domains**
2. Click **+ Add Domain**
3. Enter your domain: `usaluxurylimo.com`
4. Coolify auto-generates SSL certificate (Let's Encrypt)

## Optional: Email & SMS Notifications

Add these environment variables for full functionality:

```bash
# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM_NAME=USA Luxury Limo
EMAIL_FROM_ADDRESS=noreply@usaluxurylimo.com

# SMS
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=your-token
TWILIO_PHONE_NUMBER=+1234567890

# APIs
TOMTOM_API_KEY=your-key
RAPIDAPI_KEY=your-key
```

Redeploy after adding variables.

## Next Steps

- ✅ [Deployment Checklist](DEPLOYMENT_CHECKLIST.md) - Verify everything works
- 📘 [Full Deployment Guide](DEPLOYMENT.md) - Comprehensive troubleshooting
- 🏗️ [Architecture Guide](ARCHITECTURE.md) - Understand the system

## Need Help?

Check [DEPLOYMENT.md](DEPLOYMENT.md) for:
- Detailed troubleshooting (502 errors, database issues, etc.)
- Production checklist
- Scaling recommendations
- Security best practices

---

**Estimated Total Time:** 5-10 minutes
