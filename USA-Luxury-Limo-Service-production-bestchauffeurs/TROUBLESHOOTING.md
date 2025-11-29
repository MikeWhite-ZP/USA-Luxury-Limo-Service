# USA Luxury Limo Service - Troubleshooting Guide

## Quick Fixes for Common Issues

### 🔴 Issue 1: 502 Bad Gateway (Coolify/Production)

**Symptoms:**
- White screen on deployed app
- 502 Bad Gateway error
- App works locally but not in production

**Root Causes & Fixes:**

1. **App not binding to 0.0.0.0**
   ```typescript
   // ❌ WRONG
   server.listen(5000, 'localhost');
   
   // ✅ CORRECT - Use the fixed server/index.ts
   server.listen(5000, '0.0.0.0');
   ```

2. **Missing trust proxy setting**
   ```typescript
   // Add this to server/index.ts
   app.set('trust proxy', 1);
   ```

3. **Environment variable issues**
   ```bash
   # Check these are set in Coolify:
   NODE_ENV=production
   PORT=5000
   HOST=0.0.0.0
   DATABASE_URL=postgresql://...
   ```

---

### 🔴 Issue 2: White Screen / Assets Not Loading

**Symptoms:**
- Blank white page
- Console errors about missing files
- 404 for CSS/JS files

**Fixes:**

1. **Build the frontend properly**
   ```bash
   npm run build
   ```

2. **Verify dist folder structure**
   ```
   dist/
   ├── index.js          # Server
   └── public/           # Frontend assets
       ├── index.html
       ├── assets/
       └── ...
   ```

3. **Check Dockerfile copies correctly**
   ```dockerfile
   # Use the fixed Dockerfile provided
   COPY --from=builder /app/dist ./dist
   ```

4. **Verify static file serving**
   ```typescript
   // In production mode, serve static files
   if (app.get("env") !== "development") {
     serveStatic(app);
   }
   ```

---

### 🔴 Issue 3: Database Connection Failed

**Symptoms:**
- "Connection refused" errors
- "Database does not exist"
- App crashes on startup

**Fixes:**

1. **Verify DATABASE_URL format**
   ```bash
   # Correct format:
   postgresql://user:password@host:5432/database?sslmode=require
   
   # For Neon, Supabase, etc., SSL is required
   ```

2. **Check database exists**
   ```sql
   CREATE DATABASE usa_luxury_limo;
   ```

3. **Run migrations**
   ```bash
   npm run db:push
   ```

4. **Test connection**
   ```bash
   # Install psql client
   psql $DATABASE_URL
   ```

5. **Check firewall rules**
   - Whitelist your server's IP in database provider (Neon, Supabase, etc.)

---

### 🔴 Issue 4: File Upload Failures

**Symptoms:**
- Cannot upload documents
- "Storage error" messages
- MinIO connection failed

**Fixes:**

1. **Check storage provider is set**
   ```bash
   # For MinIO:
   STORAGE_PROVIDER=minio
   MINIO_ENDPOINT=http://minio:9000
   MINIO_ACCESS_KEY=minioadmin
   MINIO_SECRET_KEY=your-secret
   MINIO_BUCKET=usa-luxury-limo
   ```

2. **Ensure bucket exists**
   ```bash
   # Docker Compose automatically creates it
   docker-compose up -d
   
   # Or manually via MinIO console at http://localhost:9001
   ```

3. **Check permissions**
   ```bash
   # Bucket must be public or have correct policy
   mc anonymous set download myminio/usa-luxury-limo
   ```

4. **For production with S3**
   ```bash
   STORAGE_PROVIDER=s3
   AWS_S3_BUCKET=your-bucket
   AWS_ACCESS_KEY_ID=your-key
   AWS_SECRET_ACCESS_KEY=your-secret
   AWS_REGION=us-east-1
   ```

---

### 🔴 Issue 5: Authentication Not Working

**Symptoms:**
- Cannot log in
- Session expires immediately
- "Unauthorized" errors

**Fixes:**

1. **Set strong session secret**
   ```bash
   # Generate one:
   openssl rand -base64 32
   
   # Set in .env:
   SESSION_SECRET=your-generated-secret
   ```

2. **Check session store**
   ```typescript
   // Verify session table exists in database
   SELECT * FROM session;
   ```

3. **Cookie settings for production**
   ```typescript
   cookie: {
     secure: true,              // HTTPS only
     httpOnly: true,            // Prevent XSS
     sameSite: 'strict',        // CSRF protection
     maxAge: 30 * 24 * 60 * 60 * 1000  // 30 days
   }
   ```

4. **Trust proxy is set**
   ```typescript
   app.set('trust proxy', 1);
   ```

---

### 🔴 Issue 6: Payment Processing Fails

**Symptoms:**
- Stripe errors
- Payment not going through
- Webhook verification failed

**Fixes:**

1. **Use correct Stripe keys**
   ```bash
   # Development:
   STRIPE_SECRET_KEY=sk_test_...
   VITE_STRIPE_PUBLIC_KEY=pk_test_...
   
   # Production:
   STRIPE_SECRET_KEY=sk_live_...
   VITE_STRIPE_PUBLIC_KEY=pk_live_...
   ```

2. **Set webhook secret**
   ```bash
   # From Stripe Dashboard > Developers > Webhooks
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

3. **Configure webhook endpoint**
   ```
   https://yourdomain.com/api/payment/webhook
   
   # Events to listen for:
   - payment_intent.succeeded
   - payment_intent.payment_failed
   ```

---

## Performance Issues

### Slow Database Queries

1. **Add indexes** (use database-indexes.sql provided)
   ```bash
   psql $DATABASE_URL < database-indexes.sql
   ```

2. **Enable query logging**
   ```typescript
   // In db/index.ts
   logger: process.env.DEBUG === 'true'
   ```

3. **Use connection pooling**
   ```typescript
   // Drizzle automatically pools, but verify:
   max: 20,
   idleTimeoutMillis: 30000
   ```

### Slow Page Load

1. **Enable compression**
   ```typescript
   import compression from 'compression';
   app.use(compression());
   ```

2. **Add caching headers**
   ```typescript
   app.use(express.static('dist/public', {
     maxAge: '1y',
     immutable: true
   }));
   ```

3. **Use CDN for assets**
   - Upload images to CloudFlare, Cloudinary, etc.

---

## Security Hardening

### Essential Security Checklist

- [ ] Change SESSION_SECRET to random value
- [ ] Enable HTTPS (Coolify does this automatically)
- [ ] Set secure cookies (secure: true)
- [ ] Add Content Security Policy headers
- [ ] Use environment variables for all secrets
- [ ] Enable rate limiting
- [ ] Validate all user inputs
- [ ] Use prepared statements (Drizzle does this)
- [ ] Keep dependencies updated
- [ ] Enable SQL injection protection
- [ ] Add CSRF tokens for forms
- [ ] Sanitize file uploads
- [ ] Use strong password hashing (scrypt)

---

## Docker Issues

### Container Won't Start

1. **Check logs**
   ```bash
   docker logs usa-limo-app
   docker-compose logs -f
   ```

2. **Verify environment variables**
   ```bash
   docker exec usa-limo-app env
   ```

3. **Test health check**
   ```bash
   docker exec usa-limo-app curl http://localhost:5000/health
   ```

### Database Connection in Docker

1. **Use service names, not localhost**
   ```bash
   # ❌ WRONG
   DATABASE_URL=postgresql://user:pass@localhost:5432/db
   
   # ✅ CORRECT
   DATABASE_URL=postgresql://user:pass@postgres:5432/db
   ```

2. **Check network**
   ```bash
   docker network inspect usa-limo-network
   ```

---

## Development Issues

### Hot Reload Not Working

1. **Restart dev server**
   ```bash
   npm run dev
   ```

2. **Clear cache**
   ```bash
   rm -rf node_modules/.vite
   npm run dev
   ```

### TypeScript Errors

1. **Regenerate types**
   ```bash
   npm run db:push
   ```

2. **Check TypeScript version**
   ```bash
   npm list typescript
   # Should be 5.x
   ```

---

## Monitoring & Debugging

### Enable Debug Logging

```bash
# .env
DEBUG=true
LOG_LEVEL=debug
```

### Check Application Health

```bash
# Health endpoint
curl https://yourdomain.com/health

# Should return:
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "env": "production"
}
```

### Monitor Database

```sql
-- Active connections
SELECT count(*) FROM pg_stat_activity;

-- Slow queries
SELECT query, calls, total_time, mean_time 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

---

## Getting Help

If issues persist after trying these fixes:

1. **Check logs first**
   - Browser console (F12)
   - Server logs
   - Database logs

2. **Verify environment variables**
   - Are all required vars set?
   - Are they in the correct format?

3. **Test in isolation**
   - Does database connect?
   - Can you access storage?
   - Are API keys valid?

4. **Check documentation**
   - README.md
   - DEPLOYMENT.md
   - API documentation

5. **Create detailed bug report**
   - What were you trying to do?
   - What happened instead?
   - Error messages
   - Environment details
   - Steps to reproduce

---

## Prevention Tips

- **Always test in staging before production**
- **Use health checks and monitoring**
- **Keep dependencies updated**
- **Have database backups**
- **Document configuration changes**
- **Use version control (git)**
- **Test after deployments**
- **Monitor error rates**

---

## Emergency Recovery

### Complete Reset

```bash
# Stop everything
docker-compose down -v

# Remove all data
rm -rf uploads/ logs/

# Rebuild from scratch
docker-compose build --no-cache
docker-compose up -d

# Re-run migrations
npm run db:push

# Create admin user
# (through API or database directly)
```

### Database Restore

```bash
# From backup
psql $DATABASE_URL < backup.sql

# Or from Neon/Supabase dashboard
```

---

**Remember:** Most issues are due to environment variables or Docker networking. Double-check those first!
