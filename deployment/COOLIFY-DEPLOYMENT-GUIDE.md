# Coolify Deployment Rehberi - USA Luxury Limo

Bu rehber, USA Luxury Limo uygulamasını Coolify üzerinden Ubuntu sunucuya nasıl deploy edeceğinizi adım adım açıklar.

## 📋 İçindekiler

1. [Gereksinimler](#gereksinimler)
2. [Coolify'da İlk Kurulum](#coolifyda-ilk-kurulum)
3. [Environment Variables (Ortam Değişkenleri)](#environment-variables)
4. [Domain Yapılandırması](#domain-yapılandırması)
5. [Her Güncelleme İçin Yapılacaklar](#her-güncelleme-için-yapılacaklar)
6. [Troubleshooting (Sorun Giderme)](#troubleshooting)

---

## Gereksinimler

### Sunucu Tarafında Hazır Olması Gerekenler

✅ **Ubuntu sunucu** (Coolify kurulu)
✅ **Caddy proxy** (Coolify'da yapılandırılmış)
✅ **PostgreSQL container** (çalışıyor, başka container'da)
✅ **MinIO container** (çalışıyor, başka container'da)
✅ **Git repository** (GitHub, GitLab, veya Bitbucket)

### Önemli Bilgiler

- **PostgreSQL**: Zaten çalışan container'ınız var (`database` veya `postgres-xxx`)
- **MinIO**: Zaten çalışan container'ınız var (`https://minio.best-chauffeurs.com`)
- **Domain**: `adminaccess.best-chauffeurs.com` (Caddy otomatik SSL sağlayacak)

---

## Coolify'da İlk Kurulum

### Adım 1: Yeni Resource Oluştur

1. **Coolify dashboard'a girin**
   ```
   https://your-coolify-server.com
   ```

2. **Project seçin** (veya yeni oluşturun)

3. **"+ Add Resource" butonuna tıklayın**

4. **"Docker Compose" seçin**

### Adım 2: Git Repository Bağlantısı

1. **Repository türünü seçin:**
   - **Public Repository**: Public GitHub repo için
   - **GitHub App**: Private repo için (önerilen)
   - **Deploy Key**: SSH key ile

2. **Repository URL'ini girin:**
   ```
   https://github.com/your-username/usa-luxury-limo.git
   ```

3. **Branch seçin:**
   ```
   main
   ```
   (veya production için kullandığınız branch)

4. **Base Directory:**
   ```
   /
   ```
   (root dizin)

5. **Docker Compose Location:**
   ```
   deployment/docker-compose.yml
   ```

### Adım 3: Build Pack Ayarları

Coolify otomatik olarak algılayacak:
- ✅ **Build Pack**: Docker Compose
- ✅ **Dockerfile**: `deployment/Dockerfile`

**Önemli:** "Dockerfile Location" alanına:
```
deployment/Dockerfile
```

### Adım 4: Network Ayarları

1. **"Connect to Predefined Network"** seçeneğini **AÇIN**

2. **Network seçin:**
   - PostgreSQL ve MinIO container'larının bağlı olduğu network'ü seçin
   - Genellikle `coolify` veya benzer bir isim

   **Nasıl bulunur?**
   ```bash
   # PostgreSQL container'ın network'ünü bul
   docker inspect postgres-container-name | grep NetworkMode
   ```

3. **Container İsimleri:**
   - PostgreSQL: `postgres-abc123` (Coolify UUID ekler)
   - MinIO: Domain üzerinden erişiliyorsa `minio.best-chauffeurs.com`

---

## Environment Variables

### Adım 1: Coolify UI'da Environment Variables Ekle

1. **Resource sayfasında "Environment Variables" sekmesine gidin**

2. **Aşağıdaki değişkenleri ekleyin** (`.env.example` dosyasından)

### Kritik Değişkenler

#### 1. DATABASE_URL (ÇOK ÖNEMLİ!)

```bash
# YANLIŞ ❌ (özel karakterler encode edilmemiş)
DATABASE_URL=postgresql://postgres:Erka75810916?@database:5432/postgres

# DOĞRU ✅ (? karakteri %3F olarak encode edilmiş)
DATABASE_URL=postgresql://postgres:Erka75810916%3F@database:5432/postgres
```

**Özel Karakter Encoding:**
- `?` → `%3F`
- `@` → `%40`
- `#` → `%23`
- `&` → `%26`

**Host Name:**
- Eğer PostgreSQL aynı Coolify stack'te: `postgres` veya `database`
- Eğer farklı stack'te: `postgres-abc123def` (UUID ile)

#### 2. SESSION_SECRET

```bash
# Güçlü random değer oluştur:
openssl rand -base64 32

# Sonuç:
SESSION_SECRET=Abc123XyZ789RandomSecretKeyHere==
```

#### 3. MinIO / Object Storage

```bash
MINIO_ENDPOINT=https://minio.best-chauffeurs.com
MINIO_PORT=443
MINIO_USE_SSL=true
MINIO_ACCESS_KEY=your-minio-access-key
MINIO_SECRET_KEY=your-minio-secret-key
MINIO_BUCKET=replit
```

#### 4. Admin Panel Access

```bash
ADMIN_PANEL_HOSTS=adminaccess.best-chauffeurs.com,localhost:5000
```

#### 5. API Keys

```bash
TOMTOM_API_KEY=your-tomtom-api-key
AERODATABOX_API_KEY=your-aerodatabox-api-key
```

#### 6. Payment Providers

```bash
# Stripe
STRIPE_SECRET_KEY=sk_live_xxx
VITE_STRIPE_PUBLIC_KEY=pk_live_xxx

# PayPal
PAYPAL_CLIENT_ID=xxx
PAYPAL_CLIENT_SECRET=xxx

# Square
SQUARE_ACCESS_TOKEN=xxx
SQUARE_LOCATION_ID=xxx
```

#### 7. Twilio (SMS)

```bash
TWILIO_ACCOUNT_SID=ACxxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+1234567890
```

#### 8. Email (SMTP)

```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=USA Luxury Limo <noreply@best-chauffeurs.com>
```

### Adım 2: Environment Variables Eklerken

1. **Her değişken için:**
   - Key: `DATABASE_URL`
   - Value: `postgresql://...`
   - **"Shared"** seçeneğini işaretleyin (production için)

2. **Hassas değerler için:**
   - "Is Secret" checkbox'ını işaretleyin
   - Log'larda gizlenir

3. **Kaydet ve devam**

---

## Domain Yapılandırması

### Adım 1: Domain Ekle

1. **Resource sayfasında "Domains" sekmesine gidin**

2. **"+ Add Domain" butonuna tıklayın**

3. **Domain girin:**
   ```
   adminaccess.best-chauffeurs.com
   ```

4. **Port (isteğe bağlı):**
   ```
   5000
   ```
   (Eğer uygulama 80 dışında port dinliyorsa)

5. **"Generate Domain" seçeneğini KAPATIN**
   (Kendi domain'inizi kullanıyorsunuz)

### Adım 2: Caddy Labels (Otomatik)

Coolify otomatik olarak şu label'ları ekleyecek:

```yaml
labels:
  - caddy_0=https://adminaccess.best-chauffeurs.com
  - caddy_0.encode=zstd gzip
  - caddy_0.reverse_proxy={{upstreams 5000}}
```

**Bu label'lar:**
- ✅ Otomatik SSL sertifikası (Let's Encrypt)
- ✅ Reverse proxy yapılandırması
- ✅ Compression (gzip + zstd)

### Adım 3: DNS Ayarları

1. **DNS sağlayıcınızda (Cloudflare, etc.):**

2. **A Record oluşturun:**
   ```
   Type: A
   Name: adminaccess
   Value: your-server-ip-address
   TTL: Auto
   Proxy: OFF (Caddy zaten SSL yapıyor)
   ```

3. **Bekleyin** (DNS propagation 5-30 dakika)

### Adım 4: SSL Doğrulama

Deploy ettikten sonra:

```bash
# SSL sertifikası kontrol et
curl -I https://adminaccess.best-chauffeurs.com

# Beklenen:
HTTP/2 200
```

---

## Her Güncelleme İçin Yapılacaklar

### Senaryo: Uygulamanızı güncellediniz ve yeni versiyonu deploy etmek istiyorsunuz

### Adım 1: Kod Değişikliklerini Yapın

```bash
# Geliştirme ortamında değişikliklerinizi yapın
# Örnek: Yeni özellik eklediniz, bug düzeltiniz vs.
```

### Adım 2: Test Edin (İsteğe Bağlı)

```bash
# Local test
npm run dev

# Veya Docker ile test
cd deployment/
./deploy.sh
```

### Adım 3: Git'e Push Edin

```bash
git add .
git commit -m "Update: new feature added"
git push origin main
```

### Adım 4: Coolify Otomatik Deploy

Coolify **otomatik olarak**:
1. ✅ Yeni commit'i algılar
2. ✅ `deployment/Dockerfile` ile build eder
3. ✅ Container'ı yeniden oluşturur
4. ✅ Health check yapar
5. ✅ Trafiği yeni container'a yönlendirir
6. ✅ Eski container'ı durdurur

### Adım 5: Deployment İzle

1. **Coolify UI'da:**
   - "Deployments" sekmesine gidin
   - Canlı log'ları izleyin

2. **Bekleyin:**
   - Build: ~2-5 dakika
   - Health check: ~30-60 saniye
   - Total: ~3-6 dakika

3. **Doğrulayın:**
   ```bash
   curl https://adminaccess.best-chauffeurs.com/health
   # {"status":"ok","timestamp":"..."}
   ```

### Manuel Deploy (Gerekirse)

Eğer otomatik deploy çalışmıyorsa:

1. **Coolify UI'da:**
   - Resource sayfasına gidin
   - "Restart" butonuna tıklayın
   - Veya "Redeploy" seçeneğini kullanın

---

## Troubleshooting

### Problem 1: 502 Bad Gateway

**Semptomlar:**
```
https://adminaccess.best-chauffeurs.com
→ 502 Bad Gateway
```

**Olası Sebepler:**

#### A) Container ayakta değil

```bash
# Container durumunu kontrol et
docker ps | grep usa-luxury-limo

# Eğer yok ise:
docker ps -a | grep usa-luxury-limo

# Log'lara bak
docker logs usa-luxury-limo
```

**Çözüm:**
- Log'lardaki hataları düzeltin
- Genellikle `DATABASE_URL` veya missing env var hatası

#### B) Network problemi

```bash
# Container'ın network'ünü kontrol et
docker inspect usa-luxury-limo | grep NetworkMode

# Caddy ile aynı network'te mi?
docker network inspect coolify
```

**Çözüm:**
- Coolify UI'da "Connect to Predefined Network" açık mı?
- Doğru network seçili mi?

#### C) Port yanlış

**Çözüm:**
- `docker-compose.yml`'de port exposure **OLMAMALI**
- Caddy label'ında port doğru: `reverse_proxy={{upstreams 5000}}`

### Problem 2: DATABASE_URL Hatası

**Semptomlar:**
```
Error: Invalid connection string
FATAL: password authentication failed
```

**Çözüm:**

1. **Özel karakterleri encode edin:**
   ```bash
   # Password: Erka75810916?
   # Encoded: Erka75810916%3F
   
   DATABASE_URL=postgresql://postgres:Erka75810916%3F@database:5432/postgres
   ```

2. **Host doğru mu kontrol edin:**
   ```bash
   # Aynı stack'te:
   @database
   
   # Farklı stack'te:
   @postgres-abc123def
   ```

3. **PostgreSQL container'ı çalışıyor mu:**
   ```bash
   docker ps | grep postgres
   ```

### Problem 3: MinIO Connection Error

**Semptomlar:**
```
[STORAGE] Error checking bucket 'replit': 503 UnknownError
```

**Geçici Çözüm:**
- Bu hata genellikle **önemsizdir**
- Uygulama bucket'in var olduğunu varsayar
- Dosya upload/download çalışıyor mu test edin

**Kalıcı Çözüm:**

1. **MinIO container çalışıyor mu:**
   ```bash
   curl https://minio.best-chauffeurs.com/minio/health/live
   ```

2. **Credentials doğru mu:**
   ```bash
   # Coolify UI'da kontrol edin:
   MINIO_ACCESS_KEY=xxx
   MINIO_SECRET_KEY=xxx
   ```

3. **Bucket mevcut mu:**
   - MinIO console'a girin
   - `replit` bucket'ini kontrol edin

### Problem 4: Caddy Labels Çalışmıyor

**Semptomlar:**
- Domain'e gidince bağlantı yok
- Veya Caddy default page gösteriyor

**Çözüm:**

1. **Label'ları kontrol edin:**
   ```bash
   docker inspect usa-luxury-limo | grep caddy
   ```

2. **Coolify'da domain ekli mi:**
   - Domains sekmesinde domain olmalı
   - `adminaccess.best-chauffeurs.com`

3. **Caddy reload:**
   ```bash
   docker exec coolify-proxy caddy reload --config /etc/caddy/Caddyfile
   ```

### Problem 5: Health Check Fail

**Semptomlar:**
```
Container marked as unhealthy
Deployment failed: health check timeout
```

**Çözüm:**

1. **Health endpoint test edin:**
   ```bash
   # Container içinden
   docker exec usa-luxury-limo curl http://localhost:5000/health
   ```

2. **Start-up süresi uzun mu:**
   - `docker-compose.yml`'de `start_period: 40s` artırın
   - Örnek: `start_period: 60s`

3. **Migration hataları:**
   ```bash
   # Container log'larına bakın
   docker logs usa-luxury-limo | grep ERROR
   ```

### Problem 6: Environment Variable Kayboldu

**Semptomlar:**
```
Error: STRIPE_SECRET_KEY is not defined
```

**Çözüm:**

1. **Coolify UI kontrol:**
   - Environment Variables sekmesi
   - Değişken var mı?
   - "Shared" seçili mi?

2. **Container içinde kontrol:**
   ```bash
   docker exec usa-luxury-limo printenv | grep STRIPE
   ```

3. **Yeniden deploy:**
   - Environment variable eklendikten sonra
   - "Restart" yapın

---

## Docker Compose Label Detayları

### Temel Caddy Label'ları

```yaml
labels:
  # Ana domain
  - "caddy_0=https://adminaccess.best-chauffeurs.com"
  
  # Reverse proxy (port 5000'e yönlendir)
  - "caddy_0.reverse_proxy={{upstreams 5000}}"
  
  # Compression
  - "caddy_0.encode=zstd gzip"
  
  # Security headers
  - "caddy_0.header=-Server"
  - "caddy_0.header.X-Frame-Options=SAMEORIGIN"
```

### Çoklu Domain (WWW Redirect)

```yaml
labels:
  # Ana domain
  - "caddy_0=https://adminaccess.best-chauffeurs.com"
  - "caddy_0.reverse_proxy={{upstreams 5000}}"
  
  # WWW'den redirect
  - "caddy_1.redir=https://adminaccess.best-chauffeurs.com{uri}"
  - "caddy_1=https://www.adminaccess.best-chauffeurs.com"
```

### Path-Based Routing

```yaml
labels:
  # API endpoint
  - "caddy_0=https://adminaccess.best-chauffeurs.com"
  - "caddy_0.handle_path=/api/*"
  - "caddy_0.handle_path.0_reverse_proxy={{upstreams 5000}}"
```

### Özel Karakter Escape

Dollar sign `$` karakteri **iki kez** yazılmalı:

```yaml
# YANLIŞ ❌
- "caddy_0.basicauth=$2a$14$HashValue"

# DOĞRU ✅
- "caddy_0.basicauth=$$2a$$14$$HashValue"
```

---

## Faydalı Komutlar

### Container Kontrolü

```bash
# Çalışan container'ları listele
docker ps

# Tüm container'lar (durmuş olanlar dahil)
docker ps -a

# Belirli container log'larını göster
docker logs usa-luxury-limo

# Canlı log takibi
docker logs -f usa-luxury-limo

# Container içine gir
docker exec -it usa-luxury-limo sh
```

### Network Kontrolü

```bash
# Network'leri listele
docker network ls

# Network detayları
docker network inspect coolify

# Container'ın hangi network'te olduğunu bul
docker inspect usa-luxury-limo | grep NetworkMode
```

### Health Check

```bash
# HTTP health endpoint
curl https://adminaccess.best-chauffeurs.com/health

# Container health status
docker inspect usa-luxury-limo | grep Health -A 10
```

### Caddy Kontrolü

```bash
# Caddy container'ına gir
docker exec -it coolify-proxy sh

# Caddy config kontrol
caddy validate --config /etc/caddy/Caddyfile

# Caddy reload
caddy reload --config /etc/caddy/Caddyfile
```

---

## Güvenlik Kontrol Listesi

### Deployment Öncesi

- [ ] `DATABASE_URL` özel karakterler encode edilmiş mi? (`?` → `%3F`)
- [ ] `SESSION_SECRET` güçlü random değer mi?
- [ ] Tüm API key'ler production key'leri mi?
- [ ] `.env` dosyası git'e commit edilmemiş mi?
- [ ] HTTPS zorlaması aktif mi?
- [ ] Admin panel sadece belirlenen domain'lerden erişilebilir mi?

### Deployment Sonrası

- [ ] SSL sertifikası çalışıyor mu? (https://)
- [ ] Health endpoint erişilebilir mi?
- [ ] Database bağlantısı çalışıyor mu?
- [ ] MinIO bağlantısı çalışıyor mu?
- [ ] Email gönderimi çalışıyor mu?
- [ ] SMS gönderimi çalışıyor mu?
- [ ] Payment gateway'ler test edildi mi?

---

## Ek Kaynaklar

- **Coolify Docs**: https://coolify.io/docs
- **Caddy Docs**: https://caddyserver.com/docs
- **Docker Compose Reference**: https://docs.docker.com/compose/

---

**Son Güncelleme:** Kasım 2025

Bu rehber USA Luxury Limo için özelleştirilmiştir. Sorularınız için deployment klasöründeki diğer dosyalara bakın.
