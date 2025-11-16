# 🚨 Quick Fix: White Screen / JavaScript Errors in Coolify

## Your Current Problem

Browser console shows:
```
Failed to load module script: Expected a JavaScript-or-Wasm module script 
but the server responded with a MIME type of "text/html"
```

**Root Cause:** Old build assets (November 10) don't match new index.html (November 16)

---

## ✅ Fix in 3 Steps (5 minutes)

### Step 1: Force Rebuild in Coolify

1. **Open Coolify Dashboard** → Navigate to your **LIMO APPLICATION**
2. Click **"Deployments"** tab (left sidebar)
3. Click **"Force Rebuild & Redeploy"** button (top right)
4. **Wait 3-5 minutes** for build to complete

### Step 2: Verify Build Succeeded

Watch the build logs. You should see:

```
✓ Frontend build verification: PASSED
✓ Backend build verification: PASSED
```

And at the end:

```
Deployment successful
Server running on port 5000 (production mode)
```

### Step 3: Clear Cache & Test

1. **Clear your browser cache:**
   - Chrome/Edge: Press `Ctrl+Shift+Delete` → Clear "Cached images and files"
   - Safari: Press `Cmd+Option+E`
   - **Or just use Incognito/Private window**

2. **Visit your site:** https://best-chauffeurs.com

3. **Open browser console** (Press F12):
   - ✅ Should see: "Service Worker registered successfully"
   - ✅ No MIME type errors
   - ✅ Site loads correctly

---

## 🎯 Expected Results

After the fix:

- ✅ Site loads without white screen
- ✅ All JavaScript files load with `200 OK` status
- ✅ No console errors
- ✅ Theme switcher works (Light/Dark/System)
- ✅ Navigation works
- ✅ Can log in and access dashboards

---

## 🆘 Still Not Working?

### Check Build Logs

If build fails, check for:
- Missing environment variables
- Database connection errors
- Out of disk space

### Verify Environment Variables

Required variables in Coolify:
- `NODE_ENV=production`
- `DATABASE_URL=postgresql://...`
- `SESSION_SECRET=...`
- `MINIO_SECRET_KEY=...`
- `STRIPE_SECRET_KEY=...`

### Get More Help

1. **Full Coolify Guide:** Read [COOLIFY_DEPLOYMENT.md](COOLIFY_DEPLOYMENT.md)
2. **Troubleshooting:** Read [TROUBLESHOOTING_DEPLOYMENT.md](TROUBLESHOOTING_DEPLOYMENT.md)
3. **Check logs in Coolify:** Go to "Logs" tab to see application errors

---

## 🔧 Alternative: Deploy via SSH

If Coolify UI doesn't work, SSH to your server:

```bash
# SSH into server
ssh root@your-server-ip

# Navigate to project
cd /path/to/usaluxurylimo

# Pull latest code
git pull origin main

# Force rebuild
docker-compose -f docker-compose-best-chauffeurs.yml build --no-cache

# Redeploy
docker-compose -f docker-compose-best-chauffeurs.yml up -d

# Check logs
docker-compose -f docker-compose-best-chauffeurs.yml logs -f app
```

---

**Last Updated:** November 16, 2024
