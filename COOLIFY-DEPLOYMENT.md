# Coolify Deployment Guide - USA Luxury Limo

## 🚨 EMERGENCY FIX FOR 503 ERRORS

**If your production site is showing 503 errors right now:**
1. See **QUICK-FIX.md** for 2-minute solution
2. See **DEPLOYMENT-FIX-GUIDE.md** for complete step-by-step fix

---

## 🚀 Otomatik Database Migration ile Production Deployment

Bu guide, Ubuntu server'da Coolify kullanarak Docker Compose deployment için hazırlanmıştır.

---

## ✅ Yapılan Değişiklikler

### 1. **entrypoint.sh** - Startup Script
Container başlarken otomatik olarak:
- ✅ Database migration çalıştırır (`drizzle-kit push --force`)
- ✅ Email templates seed eder
- ✅ Application başlatır

### 2. **Dockerfile** - Production Container
- ✅ `drizzle-kit` production image'a eklendi
- ✅ `entrypoint.sh` executable yapılıp kopyalandı
- ✅ `drizzle.config.ts` ve migration dosyaları container'a kopyalandı

### 3. **Server Startup** - Simplified
- Migration mantığı `entrypoint.sh`'a taşındı
- Server sadece email template seeding ve route registration yapıyor

---

## 📋 Coolify'da Deployment Adımları

### 1. Repository'yi Push Edin
```bash
git add .
git commit -m "Add Coolify deployment with auto-migrations"
git push origin main
```

### 2. Coolify'da Yeni Proje Oluşturun

#### Option A: Dockerfile Deployment (ÖNERİLEN)
1. **Coolify Dashboard** → **New Resource** → **Application**
2. **Git Repository** → Repository URL'inizi girin
3. **Build Pack**: `Dockerfile`
4. **Dockerfile Location**: `./Dockerfile`

#### Option B: Docker Compose Deployment
1. **Build Pack**: `Docker Compose`
2. **Compose File**: `docker-compose.yml` (veya kullandığınız dosya)

### 3. Environment Variables (ÇOK ÖNEMLİ!)

Coolify UI'da şu environment variable'ları ekleyin:

```env
# Database Connection
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Node Environment
NODE_ENV=production
PORT=5000

# Email Configuration (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourdomain.com

# SMS Configuration (Twilio)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Object Storage (MinIO/S3)
MINIO_ENDPOINT=your-minio-endpoint
MINIO_ACCESS_KEY=your-access-key
MINIO_SECRET_KEY=your-secret-key
MINIO_BUCKET=your-bucket-name
MINIO_USE_SSL=true

# Payment Providers
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
# Add PayPal, Square, etc. as needed

# Flight API
AERODATABOX_API_KEY=your-api-key

# Geolocation
TOMTOM_API_KEY=your-api-key

# Session Secret
SESSION_SECRET=your-very-long-random-secret-string

# Admin Access (Optional)
ADMIN_PANEL_HOSTS=admin.yourdomain.com,yourdomain.com
```

**CRITICAL**: `DATABASE_URL`'yi doğru ayarlayın!

### 4. Network Configuration

Eğer Coolify'da ayrı bir PostgreSQL database service kullanıyorsanız:

1. **Database Service** → Connection String'i kopyalayın
2. **Application** → **Advanced** → **Connect to Predefined Network** → **ENABLE**
3. Database hostname'ini internal Docker network hostname'i olarak kullanın:
   ```
   DATABASE_URL=postgresql://user:pass@postgres-abc123def456:5432/dbname
   ```

### 5. Deploy!

**Deploy** butonuna tıklayın. Log'larda şunu görmelisiniz:

```bash
🚀 Starting USA Luxury Limo deployment...
📊 Running database migrations...
drizzle-kit: Pushing changes to database...
✅ Migration completed
📧 Database ready, starting application...
Ensuring email templates are seeded...
🌱 [SEED] Checking email templates...
  ✓ Template ready: booking_confirmation
  ✓ Template ready: password_reset
  ...
✅ [SEED] All email templates ready!
Server running on port 5000 (production mode)
```

---

## 🔍 Troubleshooting

### Problem 1: "relation 'email_templates' does not exist"
**Çözüm**: Migration çalışmadı
- Container log'larını kontrol edin
- `DATABASE_URL` doğru mu?
- `entrypoint.sh` executable mı? (`chmod +x entrypoint.sh`)

### Problem 2: "drizzle-kit: command not found"
**Çözüm**: Production dependencies'e eklenmemiş
- Dockerfile'da `RUN npm install drizzle-kit --no-save` satırı var mı kontrol edin

### Problem 3: Database connection timeout
**Çözüm**: Network configuration
- Coolify'da **"Connect to Predefined Network"** aktif mi?
- Database hostname doğru mu? (Internal Docker network hostname kullanılmalı)

### Problem 4: Environment variables eksik
**Çözüm**: Coolify UI'dan kontrol edin
- Tüm gerekli environment variables set edilmiş mi?
- SMTP, Twilio, Storage credentials doğru mu?

### Problem 5: 503 error on /favicon.ico when accessing admin panel ✅ FIX EDİLDİ
**Çözüm**: Bu FIX edildi! ✅

**Root Cause**: Favicon route async startup'tan SONRA register oluyordu. App startup sırasında veya crash durumunda route ulaşılamaz hale geliyordu → 503 error!

**Fix**:
- ✅ `client/public/favicon.ico` dosyası eklendi (static file serving için)
- ✅ `server/static.ts`'te MIME type handling eklendi (`.ico`, `.png`, `.jpg`, `.svg`, `.webp`)
- ✅ **CRITICAL FIX**: `server/index.ts`'te favicon route **ERKEN** eklendi - async startup'tan ÖNCE!
- ✅ Route order: Health → **Favicon** → Middleware → Async Startup → Routes → Static Files

**Why This Works**:
```javascript
// server/index.ts - Line 44
// ✅ Favicon route registered BEFORE async operations
app.get("/favicon.ico", (_req, res) => {
  res.status(204).end();
});

// Later: async startup (email templates, routes, etc.)
(async () => { ... })();
```

**Result**: Favicon route **ALWAYS** responds, even:
- ❌ App is starting up
- ❌ Database migration fails
- ❌ Email template seeding fails
- ❌ Routes fail to register
- ✅ Browser NEVER sees 503 for favicon!

**Deploy için**: 
1. `npm run build` → Verify `dist/public/favicon.ico` exists
2. Git push → Coolify auto-deploys
3. Test: `curl -I https://adminaccess.best-chauffeurs.com/favicon.ico` → Should return `204 No Content`

### Problem 6: MinIO self-signed certificate error ✅ FIX EDİLDİ
**Çözüm**: Bu FIX edildi! ✅
- `server/objectStorageAdapter.ts`'te HTTPS agent eklendi
- Self-signed certificate validation bypass (`rejectUnauthorized: false`)
- MinIO dev/test environment'lar için otomatik SSL bypass
- **Deploy için**: `npm run build` → Git push → Coolify'da deploy
- Artık MinIO presigned URL generation çalışır

### Problem 7: MinIO 503 Service Unavailable
**Sebep**: MinIO server DOWN, restarting, veya unreachable
**Detaylı Log Örneği**:
```
[STORAGE] Error checking bucket 'replit': {
  name: '503',
  message: 'UnknownError',
  code: 503,
  endpoint: 'https://minio.best-chauffeurs.com',
  bucket: 'replit'
}
[STORAGE] Assuming bucket 'replit' exists despite check failure.
```

**Troubleshooting**:
1. **MinIO Server Status Kontrol Edin**:
   - MinIO container çalışıyor mu? → `docker ps | grep minio`
   - MinIO log'lara bakın → `docker logs <minio-container-id>`
   
2. **Network Connectivity**:
   - MinIO endpoint'e erişebiliyor musunuz? → `curl https://minio.best-chauffeurs.com`
   - Firewall/Security Group kuralları doğru mu?
   
3. **MinIO Credentials**:
   - Admin Dashboard → System Settings → MinIO credentials doğru mu?
   - Access Key ve Secret Key güncel mi?
   
4. **MinIO Restart**:
   - Coolify'da MinIO service'i restart edin
   - Veya: `docker restart <minio-container-id>`

5. **Alternatif Storage**:
   - Geçici olarak Replit Object Storage kullanabilirsiniz
   - Admin Dashboard → System Settings → Storage Provider → Replit

**Not**: App artık MinIO unreachable olsa bile **crash etmez**! Gracefully handle eder ve çalışmaya devam eder. Sadece image/file upload özellikleri çalışmaz.

---

## 📊 Production Startup Flow

```
┌─────────────────────────────────────────┐
│  1. Container Başlatılır               │
│     └─ entrypoint.sh çalışır           │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  2. Database Migration                  │
│     └─ npx drizzle-kit push --force    │
│     └─ Tüm table'lar oluşturulur       │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  3. Node.js Application Başlar         │
│     └─ node dist/index.js              │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  4. Email Templates Seed Edilir        │
│     └─ 15 email template database'de   │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  5. Server Çalışmaya Başlar ✅         │
│     └─ Port 5000                       │
└─────────────────────────────────────────┘
```

---

## 🧪 Test Checklist

Deployment sonrası test edin:

- [ ] Application açılıyor mu? (Health check: `/health`)
- [ ] Database connection çalışıyor mu?
- [ ] Admin Dashboard'a giriş yapabiliyor musunuz?
- [ ] Email Templates sayfası açılıyor mu? (15 template görünmeli)
- [ ] Test email gönderilebiliyor mu?
- [ ] Logo email'de görünüyor mu?
- [ ] Booking sistemi çalışıyor mu?
- [ ] MinIO/Object Storage bağlantısı var mı?

---

## 📚 Docker Compose Örneği

Eğer kendi Docker Compose dosyanızı kullanıyorsanız:

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "5000:5000"
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://user:pass@postgres:5432/dbname
      PORT: 5000
      # Diğer environment variables...
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:5000/health"]
      interval: 30s
      timeout: 3s
      start_period: 40s
      retries: 3

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: dbname
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user"]
      interval: 5s
      timeout: 5s
      retries: 5

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin123
    volumes:
      - minio_data:/data
    ports:
      - "9000:9000"
      - "9001:9001"

volumes:
  postgres_data:
  minio_data:
```

---

## ✅ Artık Hazırsınız!

Her deployment'ta otomatik olarak:
- ✅ Database schema güncellenecek
- ✅ Email templates seed edilecek
- ✅ Application güvenli şekilde başlayacak

Başarılar! 🚀
