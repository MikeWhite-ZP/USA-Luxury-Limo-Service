# Deployment Troubleshooting Guide

This guide helps you diagnose and fix common deployment issues, especially white screens and 404 errors.

## 🔥 CRITICAL: JavaScript MIME Type Errors (NEW - Nov 16, 2024)

### Symptoms
```
Failed to load module script: Expected a JavaScript-or-Wasm module script 
but the server responded with a MIME type of "text/html"
```

Browser console shows errors for all JavaScript files (index-XXXXX.js, etc).

### Root Cause
**Static file path resolution bug in bundled production code.** When esbuild bundles the server, `__dirname` doesn't resolve to the correct location, causing the Express server to serve the SPA fallback HTML for all asset requests.

### Fix (ALREADY IN LATEST CODE)

**The fix has been deployed to the codebase on November 16, 2024.**

**To apply the fix to your production server:**

1. **Pull latest code:**
   ```bash
   git pull origin main
   ```

2. **In Coolify Dashboard:**
   - Go to your LIMO APPLICATION
   - Click **"Force Rebuild & Redeploy"**
   - Wait 3-5 minutes for completion

3. **Verify in application logs:**
   Look for this line confirming correct path:
   ```
   [STATIC] Serving static files from: /app/dist/public
   ```

4. **Test:**
   - Clear browser cache (Ctrl+Shift+Delete)
   - Visit your site
   - Console should show NO MIME type errors

**What was changed:**
File `server/static.ts` now uses `process.cwd()` in production to correctly resolve the static files directory.

---

## 🚨 White Screen on Production

### Symptoms
- Browser shows blank white screen
- Browser console shows errors like: `GET https://yourdomain.com/assets/index-XXXXX.js 404 (Not Found)`
- Application worked before but stopped after updating code

### Root Cause
The browser is trying to load JavaScript/CSS files that don't exist on the server. This happens when:
1. **Stale build artifacts** - Coolify is serving an old build that doesn't match the current `index.html`
2. **Build failed** - The frontend build didn't complete successfully during deployment
3. **Asset path mismatch** - Static files aren't being served from the correct directory

### Fix Steps

#### Step 1: Force Rebuild in Coolify

1. **Go to Coolify Dashboard** → Your LIMO APPLICATION
2. **Click "Deployments" tab** in the left sidebar
3. **Click "Force Rebuild & Redeploy"** button (this ensures a fresh build from scratch)
4. **Wait for build to complete** (monitor logs in real-time)

#### Step 2: Verify Build Succeeded

1. **Check build logs** in Coolify:
   ```
   Look for these success messages:
   ✓ Frontend build verification: PASSED
   ✓ Backend build verification: PASSED
   ```

2. **If build failed**, look for error messages:
   - Syntax errors in code
   - Missing dependencies
   - Out of memory (increase container RAM if needed)

#### Step 3: Verify Environment Variables

Make sure these **REQUIRED** variables are set in Coolify:

```bash
NODE_ENV=production          # CRITICAL - must be "production"
DATABASE_URL=postgresql://... # Your Neon/PostgreSQL URL
SESSION_SECRET=...           # Random 32+ character string
MINIO_ENDPOINT=...           # MinIO storage endpoint
MINIO_ACCESS_KEY=...         # MinIO access key
MINIO_SECRET_KEY=...         # MinIO secret key
MINIO_BUCKET=...             # Your bucket name
STRIPE_SECRET_KEY=...        # Stripe API key
VITE_STRIPE_PUBLIC_KEY=...   # Stripe public key
```

**⚠️ Common Mistake**: Not setting `NODE_ENV=production` causes session/auth issues!

#### Step 4: Check Application Logs

1. **In Coolify** → Application → **Logs tab**
2. **Look for startup messages**:
   ```
   ✅ Good:
   Starting in production mode...
   Server running on port 5000 (production mode)
   
   ❌ Bad:
   Error: Cannot find module '/app/dist/index.js'
   Error: ENOENT: no such file or directory
   ```

#### Step 5: Verify Static Assets Are Served

1. **Open your production site** in browser (https://yourdomain.com)
2. **Open Developer Console** (F12)
3. **Go to Network tab**
4. **Refresh page** (Ctrl+R or Cmd+R)
5. **Check for 404 errors**:
   - If you see `404` for JS/CSS files → Static files aren't being served correctly
   - If all files load with `200` → Different issue (check Console tab for JS errors)

### Advanced Debugging

#### Verify Container File Structure

If you have SSH access to your Coolify server:

```bash
# Find your container
docker ps | grep limo

# Access container shell (replace CONTAINER_ID)
docker exec -it CONTAINER_ID sh

# Verify build structure inside container
ls -la /app/dist/
ls -la /app/dist/public/
ls -la /app/dist/public/assets/

# You should see:
# /app/dist/index.js (backend)
# /app/dist/public/index.html (frontend)
# /app/dist/public/assets/*.js (hashed JS files)
# /app/dist/public/assets/*.css (hashed CSS files)
```

If any of these are missing, the build failed.

#### Check Docker Build Logs

In Coolify build logs, verify:
```bash
# Frontend build should show:
> npx vite build
✓ built in XXXms
Frontend build verification: PASSED

# Backend build should show:
> npx esbuild server/index.ts ...
Backend build verification: PASSED
```

## 🔧 Other Common Issues

### Issue: "500 Internal Server Error"

**Symptoms**: Page loads but shows 500 error

**Causes**:
- Database connection failed (`DATABASE_URL` incorrect or database unreachable)
- Missing required environment variables
- Application crash on startup

**Fix**:
1. Check application logs for error stack traces
2. Verify `DATABASE_URL` is correct and database is accessible
3. Test database connection from Coolify server:
   ```bash
   docker exec -it CONTAINER_ID sh
   wget -qO- https://yourdatabase.com # Should connect
   ```

### Issue: "Session/Authentication Not Working"

**Symptoms**: Can't login, session doesn't persist

**Causes**:
- `NODE_ENV` not set to `production`
- `SESSION_SECRET` not set
- Database session table not created

**Fix**:
1. Set `NODE_ENV=production` in Coolify
2. Set `SESSION_SECRET` to a random string (min 32 characters)
3. Restart application
4. Check logs for: `[SESSION] Using PostgreSQL session store`

### Issue: "Images/Assets Not Loading"

**Symptoms**: Text loads but images show broken icon

**Causes**:
- MinIO/S3 storage not configured
- `MINIO_ENDPOINT` incorrect
- Bucket doesn't exist

**Fix**:
1. Verify MinIO environment variables are set correctly
2. Check MinIO is running: Access `http://your-minio-domain:9000`
3. Create bucket if it doesn't exist
4. Verify bucket name matches `MINIO_BUCKET` variable

## 🎯 Quick Checklist

Before deploying, verify:

- [ ] All code changes committed and pushed to GitHub
- [ ] `NODE_ENV=production` is set in Coolify
- [ ] All required environment variables are set (see [DEPLOYMENT.md](./DEPLOYMENT.md))
- [ ] Database is accessible from Coolify server
- [ ] MinIO/S3 storage is configured and accessible
- [ ] Coolify has latest code from GitHub (check branch matches)
- [ ] Force rebuild if you recently changed `index.html` or Vite config

## 📞 Still Not Working?

If you've tried everything above:

1. **Check Coolify Dashboard** → Application → **Metrics**
   - Is container running? (should show "Running")
   - Is memory usage normal? (not maxed out)
   - Is CPU usage reasonable?

2. **Check Recent Changes**
   - Did you modify `Dockerfile`?
   - Did you modify `vite.config.ts`?
   - Did you modify `server/static.ts`?
   - Roll back recent changes to identify the issue

3. **Test Locally**
   ```bash
   # Build locally to verify build works
   npm run build
   
   # Verify build output
   bash scripts/verify-build.sh
   
   # Test production mode locally
   NODE_ENV=production node dist/index.js
   ```

4. **Rebuild from Scratch**
   - Delete application in Coolify
   - Create new application
   - Reconfigure all environment variables
   - Redeploy

## 🆘 Emergency: Rollback to Working Version

If you need to quickly restore a working version:

1. **In Coolify** → Application → **Deployments**
2. **Find last successful deployment** (green checkmark)
3. **Click "Redeploy"** on that version
4. **Wait for deployment to complete**

This restores your application to the last known working state.
