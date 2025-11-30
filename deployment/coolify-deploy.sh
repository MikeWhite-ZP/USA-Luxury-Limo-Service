#!/bin/bash
# ============================================
# White-Label Limo Service - Coolify Deployment
# Quick setup for Coolify-managed servers
# ============================================

set -euo pipefail

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }

echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║      Coolify Deployment Configuration Guide        ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════╝${NC}"
echo ""

cat << 'EOF'
This application is designed to work seamlessly with Coolify.

STEP 1: Create New Project in Coolify
======================================
1. Open your Coolify dashboard
2. Click "New Project" or "Add Resource"
3. Select "Docker Compose"
4. Point to your Git repository

STEP 2: Configure Build Settings
=================================
In Coolify, set these build options:

  • Build Path: deployment/
  • Dockerfile: deployment/Dockerfile
  • Docker Compose: deployment/docker-compose.coolify.yml

STEP 3: Add Environment Variables
==================================
In Coolify's environment section, add these REQUIRED variables:

  DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
  SESSION_SECRET=<generate-with-openssl-rand-base64-32>
  
For object storage (choose one):

Option A - External MinIO:
  STORAGE_PROVIDER=minio
  MINIO_ENDPOINT=https://your-minio.com
  MINIO_ACCESS_KEY=your-key
  MINIO_SECRET_KEY=your-secret
  MINIO_BUCKET=limo-uploads
  MINIO_USE_SSL=true

Option B - AWS S3:
  STORAGE_PROVIDER=s3
  AWS_ACCESS_KEY_ID=your-key
  AWS_SECRET_ACCESS_KEY=your-secret
  AWS_S3_BUCKET=your-bucket
  AWS_REGION=us-east-1

OPTIONAL environment variables:
  STRIPE_SECRET_KEY=sk_live_...
  VITE_STRIPE_PUBLIC_KEY=pk_live_...
  TWILIO_ACCOUNT_SID=AC...
  TWILIO_AUTH_TOKEN=...
  SMTP_HOST=smtp.gmail.com
  SMTP_USER=your@email.com
  SMTP_PASS=app-password

STEP 4: Configure Domain
========================
1. In Coolify, add your domain
2. Enable "Auto SSL" for HTTPS
3. Coolify handles reverse proxy automatically

STEP 5: Deploy
==============
1. Click "Deploy" in Coolify
2. Monitor build logs
3. Access via your configured domain

RECOMMENDED: External Database
==============================
Use a managed PostgreSQL service:
  • Neon (neon.tech) - Free tier available
  • Supabase - Free tier available  
  • AWS RDS
  • DigitalOcean Managed Database

This ensures data persistence across container rebuilds.

RECOMMENDED: External Object Storage
====================================
  • MinIO (self-hosted or cloud)
  • AWS S3
  • Cloudflare R2
  • DigitalOcean Spaces

EOF

echo ""
echo -e "${GREEN}Need help? Check DEPLOYMENT.md for detailed instructions.${NC}"
echo ""
