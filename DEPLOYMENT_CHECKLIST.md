# Deployment Checklist

Use this checklist to ensure your USA Luxury Limo application is deployed correctly and ready for production.

## Pre-Deployment Checklist

### 1. GitHub Repository Setup
- [ ] Repository created: `new-usa-luxury-limo-service`
- [ ] All files committed and pushed to GitHub
- [ ] `.env` file is NOT in repository (check .gitignore)
- [ ] `node_modules/` is NOT in repository
- [ ] README.md displays correctly on GitHub
- [ ] Repository is accessible (private or public as intended)

### 2. Environment Variables Prepared
- [ ] `DATABASE_URL` - PostgreSQL connection string ready
- [ ] `SESSION_SECRET` - Random secret generated (use `openssl rand -base64 32`)
- [ ] `STRIPE_SECRET_KEY` - Stripe secret key (production mode)
- [ ] `VITE_STRIPE_PUBLIC_KEY` - Stripe public key (production mode)
- [ ] `MINIO_ENDPOINT` - MinIO/S3 endpoint configured
- [ ] `MINIO_ACCESS_KEY` - Storage access key
- [ ] `MINIO_SECRET_KEY` - Storage secret key
- [ ] `MINIO_BUCKET` - Bucket name decided (e.g., `usa-luxury-limo`)

### 3. External Services Setup
- [ ] **Database**: Neon or PostgreSQL server accessible
- [ ] **Stripe**: Account in production mode (not test mode)
- [ ] **Email** (optional): SMTP credentials ready
- [ ] **SMS** (optional): Twilio account configured
- [ ] **APIs** (optional): TomTom and RapidAPI keys obtained

### 4. Coolify Server Ready
- [ ] Coolify installed on Ubuntu VPS
- [ ] Coolify accessible via web interface
- [ ] GitHub connected to Coolify account
- [ ] Sufficient server resources (2GB RAM minimum recommended)
- [ ] Domain name configured (optional but recommended)

## Deployment Steps Checklist

### Phase 1: Deploy MinIO Storage (5 minutes)
- [ ] MinIO service created in Coolify
- [ ] Service name: `usa-limo-minio`
- [ ] Root password set and saved
- [ ] MinIO Console accessible (port 9001)
- [ ] Bucket `usa-luxury-limo` created
- [ ] Bucket policy set (if needed)
- [ ] Test upload/download works in MinIO Console

### Phase 2: Deploy Application (10 minutes)
- [ ] Application created in Coolify
- [ ] GitHub repository connected
- [ ] Build pack set to **Dockerfile**
- [ ] Port configured: `5000`
- [ ] Health check configured: `/health`
- [ ] All environment variables added
- [ ] `VITE_STRIPE_PUBLIC_KEY` marked as **Build Variable**
- [ ] First deployment initiated
- [ ] Build logs reviewed for errors
- [ ] Build completed successfully
- [ ] Container is running

### Phase 3: Database Initialization (5 minutes)
- [ ] Connected to application container terminal
- [ ] Ran `npm run db:push` successfully
- [ ] Database tables created
- [ ] No migration errors in logs

### Phase 4: SSL & Domain (Optional, 5 minutes)
- [ ] Custom domain added in Coolify
- [ ] DNS A record pointing to server IP
- [ ] SSL certificate auto-generated (Let's Encrypt)
- [ ] HTTPS working correctly
- [ ] HTTP redirects to HTTPS

## Post-Deployment Verification

### 1. Application Accessibility
- [ ] Application loads in browser
- [ ] No 502 Bad Gateway error
- [ ] No 500 Internal Server Error
- [ ] Home page displays correctly
- [ ] Logo and hero image load (if configured)

### 2. Authentication & User Management
- [ ] Login page accessible
- [ ] Can create new admin account
- [ ] Can login successfully
- [ ] Session persists across page refreshes
- [ ] Can logout successfully
- [ ] Can create passenger account
- [ ] Can create driver account

### 3. Core Features Test
- [ ] **Booking Flow**: Can create test booking
- [ ] **Pricing**: Quote calculator works
- [ ] **Vehicle Types**: Display correctly
- [ ] **Payment**: Stripe integration working
- [ ] **File Upload**: Can upload driver document
- [ ] **CMS**: Can update logo/hero image
- [ ] **Admin Dashboard**: Loads without errors
- [ ] **Driver Dashboard**: Loads without errors
- [ ] **Dispatcher Dashboard**: Loads without errors

### 4. Storage Integration
- [ ] MinIO/S3 connection working
- [ ] File upload succeeds
- [ ] Uploaded files viewable
- [ ] File download works
- [ ] Profile pictures display
- [ ] Driver documents accessible
- [ ] CMS media displays correctly

### 5. Database Operations
- [ ] Data persists across container restarts
- [ ] Can create new records
- [ ] Can update existing records
- [ ] Can delete records
- [ ] Relationships working correctly
- [ ] No database connection errors in logs

### 6. Email Notifications (If Configured)
- [ ] SMTP connection successful
- [ ] Booking confirmation emails send
- [ ] Password reset emails send
- [ ] Email formatting correct
- [ ] Links in emails work
- [ ] Logo displays in emails

### 7. SMS Notifications (If Configured)
- [ ] Twilio connection successful
- [ ] Booking SMS notifications send
- [ ] Driver job alerts send
- [ ] Phone number formatting correct

### 8. Payment Processing
- [ ] Stripe public key loaded
- [ ] Payment form displays
- [ ] Test payment processes successfully
- [ ] Payment confirmation received
- [ ] Payment recorded in database
- [ ] Invoice generated correctly

### 9. API Integrations (If Configured)
- [ ] **TomTom**: Geocoding works
- [ ] **TomTom**: Address autocomplete works
- [ ] **RapidAPI**: Flight search works
- [ ] **RapidAPI**: Flight data displays
- [ ] API rate limits considered

### 10. Performance & Security
- [ ] Page load times acceptable (<3 seconds)
- [ ] Images optimized and loading
- [ ] No console errors in browser
- [ ] HTTPS enabled (if custom domain)
- [ ] Security headers present
- [ ] Session cookies secure
- [ ] Environment secrets not exposed in frontend

## Production Readiness Checklist

### Security
- [ ] All API keys are production (not test) keys
- [ ] `SESSION_SECRET` is strong and random
- [ ] Database uses SSL connection (if available)
- [ ] Stripe webhooks configured (if needed)
- [ ] CORS configured appropriately
- [ ] Rate limiting enabled (if implemented)
- [ ] Input validation working

### Backup & Recovery
- [ ] Database backup strategy defined
- [ ] MinIO data backup planned
- [ ] Environment variables documented
- [ ] Rollback plan prepared
- [ ] Latest code tagged in GitHub

### Monitoring
- [ ] Coolify health checks passing
- [ ] Application logs accessible
- [ ] Database connection monitored
- [ ] Error tracking configured (if implemented)
- [ ] Uptime monitoring setup (optional)

### Documentation
- [ ] Admin credentials securely stored
- [ ] Database credentials documented
- [ ] API keys inventory maintained
- [ ] Deployment runbook available
- [ ] Team members have access

## Final Verification Commands

### Check Application Health
```bash
# From your computer
curl https://your-domain.com/health
# Expected: {"status": "ok"}

curl https://your-domain.com/api/health
# Expected: {"status": "ok", "timestamp": ...}
```

### Check MinIO Connection
```bash
# From container terminal
curl http://usa-limo-minio:9000/minio/health/live
# Expected: 200 OK
```

### Check Database Connection
View application logs and confirm:
```
✅ "Database connected successfully"
✅ No "database connection failed" errors
```

### Check Build Version
```bash
# View container environment
docker exec -it <container-id> env | grep NODE_ENV
# Expected: NODE_ENV=production
```

## Troubleshooting Quick Reference

### Issue: 502 Bad Gateway
**Fix:**
- Verify app listens on `0.0.0.0:5000` ✅ (already configured)
- Check container is running: `docker ps`
- Review startup logs for errors

### Issue: Database Connection Error
**Fix:**
- Verify `DATABASE_URL` format
- Check database firewall allows Coolify server IP
- Test connection from container terminal

### Issue: Files Won't Upload
**Fix:**
- Verify MinIO bucket exists: `usa-luxury-limo`
- Check `MINIO_ENDPOINT` uses internal name
- Test MinIO health endpoint

### Issue: Payment Not Working
**Fix:**
- Verify `STRIPE_SECRET_KEY` and `VITE_STRIPE_PUBLIC_KEY` are set
- Check Stripe is in production mode (not test)
- Review browser console for errors

### Issue: Build Fails
**Fix:**
- Check Dockerfile syntax
- Verify all dependencies in package.json
- Review build logs for specific error
- Ensure `shared/` folder copied in Dockerfile

## Deployment Sign-Off

Once all items are checked:

- [ ] All critical features tested and working
- [ ] No errors in application logs
- [ ] No errors in browser console
- [ ] Performance acceptable
- [ ] Security measures in place
- [ ] Backup strategy defined
- [ ] Documentation complete

**Deployment Completed By:** _______________  
**Date:** _______________  
**Environment:** Production / Staging  
**Domain:** _______________  

---

## Post-Launch Monitoring (First 48 Hours)

- [ ] Monitor application logs every 4 hours
- [ ] Check for database connection issues
- [ ] Verify file uploads working
- [ ] Monitor payment success rate
- [ ] Check email/SMS delivery
- [ ] Review user feedback
- [ ] Monitor server resources (CPU, RAM, disk)

## Need Help?

Refer to:
- [DEPLOYMENT.md](DEPLOYMENT.md) - Comprehensive troubleshooting
- [QUICK_START.md](QUICK_START.md) - Quick deployment guide
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture

---

**Remember:** Test thoroughly in staging before production deployment!
