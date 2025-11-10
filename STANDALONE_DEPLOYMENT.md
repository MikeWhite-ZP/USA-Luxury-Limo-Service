# USA Luxury Limo - Standalone Server Deployment

Complete guide for deploying USA Luxury Limo on a standalone Linux server using the automated deployment script.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Quick Start (5 Minutes)](#quick-start-5-minutes)
4. [Detailed Deployment Steps](#detailed-deployment-steps)
5. [Using the Script Over SSH](#using-the-script-over-ssh)
6. [Post-Deployment](#post-deployment)
7. [Managing Your Deployment](#managing-your-deployment)
8. [Troubleshooting](#troubleshooting)

---

## Overview

The automated deployment script (`deploy.sh`) handles everything for you:

- ✅ Checks system requirements
- ✅ Installs Docker and Docker Compose
- ✅ Configures environment variables
- ✅ Sets up MinIO object storage
- ✅ Deploys the application containers
- ✅ Runs database migrations
- ✅ Verifies application health

**No manual configuration needed!** Just answer a few questions and the script does the rest.

---

## Prerequisites

### Server Requirements

- **OS**: Ubuntu 20.04+ or Debian 10+
- **RAM**: Minimum 2GB (4GB recommended)
- **Disk**: Minimum 20GB free space
- **CPU**: 2+ cores recommended
- **Root Access**: Required for initial setup

### External Services

You'll need accounts for these services (get them before deployment):

1. **PostgreSQL Database** - [Neon](https://neon.tech) (free tier available) or your own PostgreSQL server
2. **Stripe Account** - [stripe.com](https://stripe.com) for payment processing
3. **Optional Services**:
   - Twilio (SMS notifications)
   - TomTom API (geocoding)
   - RapidAPI (flight search)

---

## Quick Start (5 Minutes)

### Step 1: Connect to Your Server

```bash
# SSH into your Linux server
ssh root@your-server-ip

# Or if using a regular user with sudo
ssh username@your-server-ip
```

### Step 2: Download the Deployment Package

**Option A: Clone from GitHub** (Recommended)

```bash
# Clone the repository
git clone https://github.com/MikeWhite-ZP/USA-Luxury-Limo-Service.git
cd USA-Luxury-Limo-Service
```

**Option B: Upload Files Manually**

```bash
# On your local machine, create a tarball
tar -czf usa-limo-deploy.tar.gz deploy.sh deploy.config.example Dockerfile docker-compose.yml .env.example package*.json server/ client/ shared/

# Upload to server
scp usa-limo-deploy.tar.gz root@your-server-ip:/root/

# On the server, extract
tar -xzf usa-limo-deploy.tar.gz
cd USA-Luxury-Limo-Service
```

### Step 3: Configure Your Deployment

```bash
# Copy the configuration template
cp deploy.config.example deploy.config

# Edit the configuration file
nano deploy.config
```

**Minimum Required Settings:**

```bash
# Database (Get from Neon or your PostgreSQL provider)
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"

# Generate with: openssl rand -base64 32
SESSION_SECRET="your-generated-secret-here"

# Get from Stripe Dashboard
STRIPE_SECRET_KEY="sk_live_your_key"
VITE_STRIPE_PUBLIC_KEY="pk_live_your_key"

# Set a strong password for MinIO
MINIO_SECRET_KEY="strong-password-here"
```

**Tip:** Generate a strong session secret:
```bash
openssl rand -base64 32
```

### Step 4: Run the Deployment Script

```bash
# Make the script executable
chmod +x deploy.sh

# Run as root or with sudo
sudo ./deploy.sh
```

The script will:
1. Check if you're running as root ✓
2. Detect your OS ✓
3. Ask if you want to update packages (recommended: yes)
4. Install Docker and Docker Compose ✓
5. Create environment files ✓
6. Build and start containers ✓
7. Set up MinIO bucket ✓
8. Run database migrations ✓
9. Verify health ✓

**Total time: ~5-10 minutes** (depending on your server speed)

### Step 5: Access Your Application

Once complete, you'll see:

```
==========================================
Deployment Complete!
==========================================

Access your application:
  • Application: http://YOUR-SERVER-IP:5000
  • MinIO Console: http://YOUR-SERVER-IP:9001

Default MinIO credentials:
  • Username: minioadmin (or your MINIO_ACCESS_KEY from deploy.config)
  • Password: [your MINIO_SECRET_KEY from deploy.config]
```

Visit the application URL and create your first admin account!

---

## Detailed Deployment Steps

### Using the Script Over SSH

#### Method 1: Direct SSH Execution (Most Common)

```bash
# 1. Connect to server
ssh root@your-server-ip

# 2. Navigate to deployment directory
cd /path/to/USA-Luxury-Limo-Service

# 3. Configure deployment
nano deploy.config  # Edit your settings

# 4. Run deployment
./deploy.sh
```

#### Method 2: Execute from Local Machine

If you prefer to run the script from your local machine via SSH:

```bash
# Upload deployment files
scp -r USA-Luxury-Limo-Service/ root@your-server-ip:/opt/

# Execute script remotely
ssh root@your-server-ip 'cd /opt/USA-Luxury-Limo-Service && ./deploy.sh'
```

#### Method 3: Automated Deployment (CI/CD Style)

Create a deployment pipeline:

```bash
#!/bin/bash
# local-deploy.sh - Run this from your local machine

SERVER_IP="your-server-ip"
SERVER_USER="root"
DEPLOY_DIR="/opt/usa-luxury-limo"

# Upload files
echo "Uploading files to server..."
rsync -avz --exclude 'node_modules' \
  . ${SERVER_USER}@${SERVER_IP}:${DEPLOY_DIR}/

# Run deployment
echo "Running deployment script..."
ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
  cd /opt/usa-luxury-limo
  chmod +x deploy.sh
  ./deploy.sh
ENDSSH

echo "Deployment complete!"
```

### Configuration File Deep Dive

The `deploy.config` file controls all aspects of your deployment:

```bash
# ==================================
# Application Settings
# ==================================
PORT=5000                           # Application port
APP_DIR="/opt/usa-luxury-limo"      # Installation directory
GITHUB_REPO=""                       # Leave empty if using local files
DOMAIN="yourdomain.com"              # Your production domain

# ==================================
# Database Configuration (REQUIRED)
# ==================================
DATABASE_URL="postgresql://neondb_owner:npg_XXXX@ep-XXXX.us-east-1.aws.neon.tech/neondb?sslmode=require"

# ==================================
# Security (REQUIRED)
# ==================================
SESSION_SECRET="$(openssl rand -base64 32)"

# ==================================
# Stripe (REQUIRED)
# ==================================
STRIPE_SECRET_KEY="sk_live_51..."
VITE_STRIPE_PUBLIC_KEY="pk_live_51..."

# ==================================
# MinIO (REQUIRED)
# ==================================
MINIO_SECRET_KEY="$(openssl rand -base64 24)"

# ==================================
# Email (OPTIONAL)
# ==================================
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
EMAIL_FROM_ADDRESS="noreply@yourdomain.com"

# ==================================
# SMS (OPTIONAL)
# ==================================
TWILIO_ACCOUNT_SID="ACxxxx"
TWILIO_AUTH_TOKEN="your_token"
TWILIO_PHONE_NUMBER="+1234567890"

# ==================================
# APIs (OPTIONAL)
# ==================================
TOMTOM_API_KEY="your_key"
RAPIDAPI_KEY="your_key"
```

### What the Script Does (Under the Hood)

1. **System Check**
   ```bash
   - Verifies root/sudo access
   - Detects OS (Ubuntu/Debian)
   - Checks available disk space
   ```

2. **Docker Installation**
   ```bash
   - Adds Docker's official GPG key
   - Sets up Docker repository
   - Installs docker-ce, docker-ce-cli, containerd.io
   - Installs docker-compose-plugin
   - Starts and enables Docker service
   ```

3. **Application Setup**
   ```bash
   - Creates .env file from deploy.config
   - Builds Docker images (frontend + backend)
   - Starts containers: MinIO + Application
   - Waits for services to be ready
   ```

4. **MinIO Configuration**
   ```bash
   - Waits for MinIO to be healthy
   - Runs minio/mc client container to configure buckets
   - Creates bucket: usa-luxury-limo (or your configured bucket name)
   - Sets up public directory with download permissions
   - Configures access using credentials from deploy.config
   ```

5. **Database Setup**
   ```bash
   - Runs Drizzle migrations
   - Pushes schema to database
   - Verifies connection
   ```

6. **Health Verification**
   ```bash
   - Checks /health endpoint
   - Verifies container status
   - Tests database connectivity
   ```

---

## Post-Deployment

### Create Your First Admin Account

1. Visit your application URL: `http://YOUR-SERVER-IP:5000`
2. Click "Get Started" or "Admin Login"
3. Create your admin account
4. Configure system settings in the admin dashboard

### Configure Payment Providers

1. Log in as admin
2. Go to **Settings** → **Payment Systems**
3. Enable and configure:
   - Stripe (already configured from environment)
   - PayPal (optional - add credentials)
   - Square (optional - add credentials)

### Upload Your Logo and Branding

1. Go to **Settings** → **CMS / Branding**
2. Upload your company logo
3. Upload hero image for homepage
4. Customize colors and text

### Set Up Domain Name (Optional but Recommended)

#### Option A: Using Nginx Reverse Proxy

```bash
# Install Nginx
sudo apt install nginx -y

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/usa-luxury-limo

# Add this configuration:
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/usa-luxury-limo /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Install SSL certificate with Certbot
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

#### Option B: Using Caddy (Easier Auto-SSL)

```bash
# Install Caddy
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy

# Create Caddyfile
sudo nano /etc/caddy/Caddyfile
```

```
yourdomain.com, www.yourdomain.com {
    reverse_proxy localhost:5000
}
```

```bash
# Restart Caddy (SSL configured automatically!)
sudo systemctl restart caddy
```

### Configure DNS

Point your domain to your server:

```
Type: A Record
Name: @
Value: YOUR-SERVER-IP
TTL: 3600

Type: A Record
Name: www
Value: YOUR-SERVER-IP
TTL: 3600
```

---

## Managing Your Deployment

### Useful Commands

```bash
# View application logs
docker logs usa-luxury-limo -f

# View MinIO logs
docker logs usa-limo-minio -f

# Check container status
docker ps

# Restart application
docker restart usa-luxury-limo

# Restart MinIO
docker restart usa-limo-minio

# Stop all services
docker compose down

# Start all services
docker compose up -d

# Rebuild and restart
docker compose up -d --build

# View resource usage
docker stats
```

### Updating Your Application

When you have code updates:

```bash
# Pull latest code
cd /opt/usa-luxury-limo
git pull

# Rebuild and restart
docker compose down
docker compose build --no-cache
docker compose up -d

# Run migrations if schema changed
docker exec usa-luxury-limo npm run db:push
```

### Backup Your Data

#### Automatic Backup Script

Create `/root/backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p ${BACKUP_DIR}

# Backup MinIO data
echo "Backing up MinIO data..."
docker run --rm \
  -v /var/lib/docker/volumes/usa-luxury-limo_minio-data/_data:/data \
  -v ${BACKUP_DIR}:/backup \
  alpine tar czf /backup/minio_${TIMESTAMP}.tar.gz /data

# Keep only last 7 days of backups
find ${BACKUP_DIR} -name "*.tar.gz" -mtime +7 -delete

echo "Backup complete: minio_${TIMESTAMP}.tar.gz"
```

```bash
# Make executable
chmod +x /root/backup.sh

# Add to cron (daily at 2 AM)
crontab -e
# Add this line:
0 2 * * * /root/backup.sh >> /var/log/backup.log 2>&1
```

### Monitor Your Application

```bash
# Check application health
curl http://localhost:5000/health

# Check if containers are running
docker ps | grep usa-luxury-limo

# View container resource usage
docker stats --no-stream usa-luxury-limo usa-limo-minio

# Check disk space
df -h

# View system resources
htop  # (install with: sudo apt install htop)
```

---

## Troubleshooting

### Application Won't Start

**Check logs:**
```bash
docker logs usa-luxury-limo --tail 100
```

**Common issues:**

1. **Database connection failed**
   ```
   Error: Connection refused
   Solution: Verify DATABASE_URL in deploy.config is correct
   ```

2. **Port already in use**
   ```
   Error: Port 5000 is already allocated
   Solution: Stop the conflicting service or change PORT in deploy.config
   ```

3. **Out of memory**
   ```
   Error: Container killed (OOM)
   Solution: Upgrade server to at least 2GB RAM or add swap space
   ```

### MinIO Not Accessible

```bash
# Check if MinIO is running
docker ps | grep minio

# Check MinIO logs
docker logs usa-limo-minio --tail 50

# Test MinIO connection
curl http://localhost:9000/minio/health/live

# Restart MinIO
docker restart usa-limo-minio
```

### Database Migration Fails

```bash
# Check database connectivity
docker exec usa-luxury-limo npm run db:push

# If fails, verify DATABASE_URL
docker exec usa-luxury-limo env | grep DATABASE_URL

# Test database connection manually
docker exec -it usa-luxury-limo sh
# Inside container:
node -e "const { neon } = require('@neondatabase/serverless'); const sql = neon(process.env.DATABASE_URL); sql\`SELECT NOW()\`.then(console.log)"
```

### Can't Access Application Remotely

**Check firewall:**
```bash
# Ubuntu/Debian with UFW
sudo ufw status
sudo ufw allow 5000/tcp
sudo ufw allow 9001/tcp

# CentOS/RHEL with firewalld
sudo firewall-cmd --permanent --add-port=5000/tcp
sudo firewall-cmd --permanent --add-port=9001/tcp
sudo firewall-cmd --reload
```

**Check if application is listening:**
```bash
netstat -tlnp | grep 5000
# or
ss -tlnp | grep 5000
```

### Script Fails During Installation

**If Docker installation fails:**
```bash
# Manual Docker installation
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo systemctl start docker
sudo systemctl enable docker
```

**If script stops with "Permission denied":**
```bash
# Ensure script is executable
chmod +x deploy.sh

# Run with sudo
sudo ./deploy.sh
```

### Rollback Deployment

If something goes wrong:

```bash
# Stop and remove all containers
docker compose down

# Remove images
docker rmi usa-luxury-limo:latest

# Clean up volumes (WARNING: This deletes data!)
docker volume rm usa-luxury-limo_minio-data

# Re-run deployment
./deploy.sh
```

---

## Security Recommendations

1. **Change Default Passwords**
   - Update MINIO_SECRET_KEY to a strong password
   - Use strong SESSION_SECRET

2. **Configure Firewall**
   ```bash
   sudo ufw default deny incoming
   sudo ufw default allow outgoing
   sudo ufw allow 22/tcp   # SSH
   sudo ufw allow 80/tcp   # HTTP
   sudo ufw allow 443/tcp  # HTTPS
   sudo ufw enable
   ```

3. **Enable SSL/HTTPS**
   - Use Nginx or Caddy with Let's Encrypt
   - Never run in production without SSL

4. **Regular Updates**
   ```bash
   # Update system packages monthly
   sudo apt update && sudo apt upgrade -y
   
   # Update Docker images
   docker compose pull
   docker compose up -d
   ```

5. **Secure SSH**
   ```bash
   # Disable root login
   sudo nano /etc/ssh/sshd_config
   # Set: PermitRootLogin no
   
   # Use SSH keys instead of passwords
   ssh-copy-id user@your-server-ip
   ```

6. **Monitor Logs**
   ```bash
   # Set up log rotation
   sudo nano /etc/docker/daemon.json
   ```
   ```json
   {
     "log-driver": "json-file",
     "log-opts": {
       "max-size": "10m",
       "max-file": "3"
     }
   }
   ```

---

## Getting Help

If you encounter issues:

1. **Check the logs** (see commands above)
2. **Review this troubleshooting section**
3. **Verify your configuration** (deploy.config)
4. **Test each service individually**:
   - Database: Check connection from application
   - MinIO: Access console at http://YOUR-IP:9001
   - Application: Check /health endpoint

5. **Common solutions**:
   - Restart containers: `docker compose restart`
   - Rebuild images: `docker compose build --no-cache`
   - Check disk space: `df -h`
   - Check memory: `free -h`

---

## Summary

You now have USA Luxury Limo deployed on your standalone server!

**What you've accomplished:**
- ✅ Installed Docker and Docker Compose
- ✅ Deployed application and MinIO containers
- ✅ Configured environment variables
- ✅ Set up object storage
- ✅ Ran database migrations
- ✅ Verified application health

**Next steps:**
- Create your admin account
- Configure payment providers
- Set up your domain with SSL
- Customize branding and settings
- Start accepting bookings!

**Need more help?**
- Review [DEPLOYMENT.md](DEPLOYMENT.md) for Coolify-specific deployment
- Check [ARCHITECTURE.md](ARCHITECTURE.md) for system architecture
- See [QUICK_START.md](QUICK_START.md) for rapid deployment guide
