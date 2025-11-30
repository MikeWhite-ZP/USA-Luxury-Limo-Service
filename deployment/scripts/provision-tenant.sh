#!/bin/bash
# ============================================
# Tenant Provisioning Script
# Creates database + MinIO bucket for a new company
# ============================================
# Usage: ./provision-tenant.sh <company-slug>
# Example: ./provision-tenant.sh acme-limo
# ============================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "\n${CYAN}==> $1${NC}"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="${SCRIPT_DIR}/../infrastructure"
APP_DIR="${SCRIPT_DIR}/../app"

# ============================================
# VALIDATION
# ============================================

if [ $# -lt 1 ]; then
    echo "Usage: $0 <company-slug>"
    echo ""
    echo "Example: $0 acme-limo"
    echo ""
    echo "The company slug should be:"
    echo "  - Lowercase letters, numbers, and hyphens only"
    echo "  - No spaces or special characters"
    echo "  - Unique for each company"
    exit 1
fi

COMPANY_SLUG="$1"

# Validate slug format
if ! [[ "$COMPANY_SLUG" =~ ^[a-z0-9][a-z0-9-]*[a-z0-9]$ ]] && ! [[ "$COMPANY_SLUG" =~ ^[a-z0-9]$ ]]; then
    log_error "Invalid company slug: $COMPANY_SLUG"
    echo "Slug must be lowercase letters, numbers, and hyphens only"
    exit 1
fi

# Convert slug to valid identifiers
DB_NAME="${COMPANY_SLUG//-/_}_db"
DB_USER="${COMPANY_SLUG//-/_}_user"
BUCKET_NAME="${COMPANY_SLUG}-uploads"

print_banner() {
    echo ""
    echo -e "${CYAN}╔═══════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║         Tenant Provisioning: ${COMPANY_SLUG}${NC}"
    echo -e "${CYAN}╚═══════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "This will create:"
    echo "  - PostgreSQL database: $DB_NAME"
    echo "  - PostgreSQL user: $DB_USER"
    echo "  - MinIO bucket: $BUCKET_NAME"
    echo ""
}

load_infra_config() {
    log_step "Loading Infrastructure Configuration"
    
    if [ ! -f "${INFRA_DIR}/.env" ]; then
        log_error "Infrastructure .env not found at ${INFRA_DIR}/.env"
        echo "Run infrastructure/deploy.sh first"
        exit 1
    fi
    
    set -a
    source "${INFRA_DIR}/.env"
    set +a
    
    log_success "Configuration loaded"
}

create_database() {
    log_step "Creating PostgreSQL Database"
    
    # Generate secure password
    DB_PASSWORD=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9' | head -c 16)
    
    # Check if database already exists
    if docker exec limo-central-postgres psql -U ${POSTGRES_ADMIN_USER} -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
        log_warning "Database $DB_NAME already exists"
        read -p "Drop and recreate? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker exec limo-central-postgres psql -U ${POSTGRES_ADMIN_USER} -c "DROP DATABASE IF EXISTS ${DB_NAME};"
            docker exec limo-central-postgres psql -U ${POSTGRES_ADMIN_USER} -c "DROP USER IF EXISTS ${DB_USER};"
        else
            log_info "Skipping database creation"
            return 0
        fi
    fi
    
    log_info "Creating user and database..."
    
    # Create user and database
    docker exec limo-central-postgres psql -U ${POSTGRES_ADMIN_USER} << EOF
CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';
CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
EOF
    
    log_success "Database created: $DB_NAME"
    
    # Build connection string
    DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${DB_NAME}"
}

create_minio_bucket() {
    log_step "Creating MinIO Bucket"
    
    # Install mc client if not in container
    log_info "Configuring MinIO client..."
    
    # Use MinIO mc from Docker
    docker run --rm --network limo-infrastructure \
        minio/mc alias set infra http://limo-central-minio:9000 ${MINIO_ROOT_USER} ${MINIO_ROOT_PASSWORD} 2>/dev/null || true
    
    # Check if bucket exists
    if docker run --rm --network limo-infrastructure \
        minio/mc ls infra/${BUCKET_NAME} 2>/dev/null; then
        log_warning "Bucket $BUCKET_NAME already exists"
    else
        log_info "Creating bucket..."
        docker run --rm --network limo-infrastructure \
            minio/mc mb infra/${BUCKET_NAME} --ignore-existing
    fi
    
    # Generate access key for this tenant
    MINIO_ACCESS_KEY="${COMPANY_SLUG//-/_}_access"
    MINIO_SECRET_KEY=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32)
    
    # Create service account with bucket access
    log_info "Creating tenant access credentials..."
    
    # Create policy for this bucket
    cat > /tmp/${COMPANY_SLUG}-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::${BUCKET_NAME}",
                "arn:aws:s3:::${BUCKET_NAME}/*"
            ]
        }
    ]
}
EOF
    
    # For simplicity, use root credentials in tenant config
    # In production, you'd create scoped service accounts
    MINIO_ACCESS_KEY="${MINIO_ROOT_USER}"
    MINIO_SECRET_KEY="${MINIO_ROOT_PASSWORD}"
    
    log_success "Bucket created: $BUCKET_NAME"
}

generate_env_file() {
    log_step "Generating Tenant Configuration"
    
    OUTPUT_DIR="${APP_DIR}/tenants/${COMPANY_SLUG}"
    mkdir -p "$OUTPUT_DIR"
    
    SESSION_SECRET=$(openssl rand -base64 32)
    
    cat > "${OUTPUT_DIR}/.env" << EOF
# ============================================
# Tenant: ${COMPANY_SLUG}
# Generated: $(date)
# ============================================

# Company Identification
COMPANY_SLUG=${COMPANY_SLUG}

# Database
DATABASE_URL=${DATABASE_URL}

# Object Storage
MINIO_ENDPOINT=http://${MINIO_HOST}:${MINIO_API_PORT}
MINIO_ACCESS_KEY=${MINIO_ACCESS_KEY}
MINIO_SECRET_KEY=${MINIO_SECRET_KEY}
MINIO_BUCKET=${BUCKET_NAME}
MINIO_USE_SSL=false

# Security
SESSION_SECRET=${SESSION_SECRET}

# Application
APP_PORT=5000
APP_DOMAIN=

# ==========================================
# Optional Services (configure as needed)
# ==========================================

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
VITE_STRIPE_PUBLIC_KEY=

# Email
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM_NAME=${COMPANY_SLUG} Limo Service
EMAIL_FROM_ADDRESS=

# SMS
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# APIs
TOMTOM_API_KEY=
RAPIDAPI_KEY=
EOF

    chmod 600 "${OUTPUT_DIR}/.env"
    
    # Copy docker-compose and deploy script for this tenant
    cp "${APP_DIR}/docker-compose.yml" "${OUTPUT_DIR}/"
    cp "${APP_DIR}/deploy.sh" "${OUTPUT_DIR}/"
    chmod +x "${OUTPUT_DIR}/deploy.sh"
    
    log_success "Configuration saved to: ${OUTPUT_DIR}/.env"
}

run_migrations() {
    log_step "Database Ready for Migrations"
    
    echo ""
    log_info "To run database migrations, deploy the app and then execute:"
    echo -e "  ${YELLOW}docker exec ${COMPANY_SLUG}-app npm run db:push${NC}"
    echo ""
}

show_summary() {
    echo ""
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║         Tenant Provisioned Successfully!              ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${CYAN}Tenant: ${YELLOW}${COMPANY_SLUG}${NC}"
    echo ""
    echo -e "${CYAN}Resources Created:${NC}"
    echo -e "  Database:     ${GREEN}${DB_NAME}${NC}"
    echo -e "  DB User:      ${GREEN}${DB_USER}${NC}"
    echo -e "  MinIO Bucket: ${GREEN}${BUCKET_NAME}${NC}"
    echo ""
    echo -e "${CYAN}Configuration:${NC}"
    echo -e "  ${GREEN}${APP_DIR}/tenants/${COMPANY_SLUG}/.env${NC}"
    echo ""
    echo -e "${CYAN}Next Steps:${NC}"
    echo "  1. Review and customize the .env file"
    echo "  2. Add API keys (Stripe, Twilio, etc.) if needed"
    echo "  3. Deploy the app:"
    echo -e "     ${YELLOW}cd ${APP_DIR}/tenants/${COMPANY_SLUG}${NC}"
    echo -e "     ${YELLOW}docker compose up -d --build${NC}"
    echo ""
    echo "  4. Run database migrations:"
    echo -e "     ${YELLOW}docker exec ${COMPANY_SLUG}-app npm run db:push${NC}"
    echo ""
    echo -e "${CYAN}Default Admin Login:${NC}"
    echo -e "  Username: ${YELLOW}mikewhite${NC}"
    echo -e "  Password: ${YELLOW}admin123${NC}"
    echo ""
}

# ============================================
# MAIN
# ============================================

print_banner

read -p "Continue? (y/n) " -n 1 -r
echo
[[ ! $REPLY =~ ^[Yy]$ ]] && exit 0

load_infra_config
create_database
create_minio_bucket
generate_env_file
run_migrations
show_summary
