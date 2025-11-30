#!/bin/bash
# ============================================
# White-Label Limo Service - Automated Deployment
# For fresh Ubuntu 20.04+ / Debian 10+ servers
# ============================================
# This script is for STANDALONE deployments
# For Coolify, see: ./coolify-deploy.sh
# ============================================

set -euo pipefail
IFS=$'\n\t'

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Logging functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "\n${CYAN}==> $1${NC}"; }

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="${SCRIPT_DIR}/docker-compose.yml"

# ============================================
# FUNCTIONS
# ============================================

print_banner() {
    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║   White-Label Limo Service - Standalone Deployment ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "This script deploys with local PostgreSQL and MinIO containers."
    echo "For Coolify deployments, see: ./coolify-deploy.sh"
    echo ""
}

check_root() {
    if [ "$EUID" -ne 0 ]; then
        log_error "This script must be run as root or with sudo"
        exit 1
    fi
    log_success "Running with root privileges"
}

detect_os() {
    log_step "Detecting Operating System"
    
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        OS_VERSION=$VERSION_ID
        log_info "Detected: $PRETTY_NAME"
        
        if [[ "$OS" != "ubuntu" && "$OS" != "debian" ]]; then
            log_warning "Optimized for Ubuntu/Debian. Your OS: $OS"
            read -p "Continue? (y/n) " -n 1 -r
            echo
            [[ ! $REPLY =~ ^[Yy]$ ]] && exit 1
        fi
    else
        log_error "Cannot detect OS"
        exit 1
    fi
}

install_docker() {
    log_step "Setting up Docker"
    
    if command -v docker &> /dev/null; then
        log_success "Docker already installed: $(docker --version)"
        return 0
    fi
    
    log_info "Installing Docker..."
    
    apt-get update -qq
    apt-get install -y -qq ca-certificates curl gnupg lsb-release
    
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/${OS}/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/${OS} $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    apt-get update -qq
    apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    systemctl start docker
    systemctl enable docker
    
    log_success "Docker installed: $(docker --version)"
}

install_utilities() {
    log_step "Installing utilities"
    apt-get install -y -qq git curl wget jq net-tools openssl
    log_success "Utilities installed"
}

setup_env_file() {
    log_step "Configuring Environment"
    
    ENV_FILE="${SCRIPT_DIR}/.env"
    
    if [ -f "$ENV_FILE" ]; then
        log_info ".env file already exists"
        read -p "Overwrite? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Keeping existing .env file"
            return 0
        fi
    fi
    
    log_info "Creating .env file with secure random values..."
    
    # Generate secure secrets
    SESSION_SECRET=$(openssl rand -base64 32)
    MINIO_SECRET=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 24)
    POSTGRES_PASSWORD=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9' | head -c 16)
    
    # Prompt for optional services
    echo ""
    log_info "Optional: Enter your API keys (press Enter to skip)"
    echo ""
    
    read -p "Stripe Secret Key (sk_live_... or leave empty): " STRIPE_KEY
    read -p "Stripe Public Key (pk_live_... or leave empty): " STRIPE_PUBLIC
    read -p "Your domain name (e.g., example.com or leave empty): " DOMAIN
    
    cat > "$ENV_FILE" << EOF
# ============================================
# Generated on $(date)
# Standalone Deployment Configuration
# ============================================

# Database (local container)
POSTGRES_USER=limo
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_DB=limo_service

# Security
SESSION_SECRET=${SESSION_SECRET}

# Object Storage (local MinIO container)
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=${MINIO_SECRET}
MINIO_BUCKET=limo-uploads
MINIO_PORT=9000
MINIO_CONSOLE_PORT=9001

# Application
APP_PORT=5000
APP_DOMAIN=${DOMAIN:-}

# Payment (Stripe)
STRIPE_SECRET_KEY=${STRIPE_KEY:-}
STRIPE_WEBHOOK_SECRET=
VITE_STRIPE_PUBLIC_KEY=${STRIPE_PUBLIC:-}

# Email (configure later in app settings)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM_NAME=Limo Service
EMAIL_FROM_ADDRESS=

# SMS (Twilio - configure later)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# APIs
TOMTOM_API_KEY=
RAPIDAPI_KEY=
EOF

    chmod 600 "$ENV_FILE"
    log_success ".env file created with secure random secrets"
}

build_and_deploy() {
    log_step "Building and Deploying"
    
    cd "$SCRIPT_DIR"
    
    if [ ! -f ".env" ]; then
        log_error ".env file not found. Run setup first."
        exit 1
    fi
    
    # Source environment
    set -a
    source .env
    set +a
    
    log_info "Pulling required Docker images..."
    docker compose -f docker-compose.yml pull postgres minio || true
    
    log_info "Building application image..."
    docker compose -f docker-compose.yml build --no-cache app
    
    log_info "Starting database and storage services..."
    docker compose -f docker-compose.yml up -d postgres minio
    
    # Wait for PostgreSQL
    log_info "Waiting for PostgreSQL to be ready..."
    local max_attempts=30
    local attempt=0
    while [ $attempt -lt $max_attempts ]; do
        if docker compose -f docker-compose.yml exec -T postgres pg_isready -U ${POSTGRES_USER:-limo} > /dev/null 2>&1; then
            log_success "PostgreSQL is ready"
            break
        fi
        attempt=$((attempt + 1))
        sleep 2
    done
    
    if [ $attempt -eq $max_attempts ]; then
        log_error "PostgreSQL failed to start"
        docker compose -f docker-compose.yml logs postgres
        exit 1
    fi
    
    # Wait for MinIO
    log_info "Waiting for MinIO to be ready..."
    attempt=0
    while [ $attempt -lt $max_attempts ]; do
        if docker compose -f docker-compose.yml exec -T minio curl -sf http://localhost:9000/minio/health/live > /dev/null 2>&1; then
            log_success "MinIO is ready"
            break
        fi
        attempt=$((attempt + 1))
        sleep 2
    done
    
    if [ $attempt -eq $max_attempts ]; then
        log_error "MinIO failed to start"
        docker compose -f docker-compose.yml logs minio
        exit 1
    fi
    
    log_info "Starting MinIO bucket initialization..."
    docker compose -f docker-compose.yml up -d minio-init
    sleep 5
    
    log_info "Starting application..."
    docker compose -f docker-compose.yml up -d app
    
    log_success "All services started"
}

run_migrations() {
    log_step "Running Database Migrations"
    
    log_info "Waiting for application to be ready..."
    sleep 10
    
    log_info "Pushing database schema..."
    if docker exec limo-app npm run db:push 2>&1; then
        log_success "Database migrations completed"
    else
        log_warning "Migration command returned non-zero, checking if database is ready..."
    fi
}

check_health() {
    log_step "Checking Application Health"
    
    local max_attempts=15
    local attempt=0
    local port=${APP_PORT:-5000}
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -sf http://localhost:${port}/health > /dev/null 2>&1; then
            log_success "Application is healthy!"
            return 0
        fi
        attempt=$((attempt + 1))
        log_info "Waiting for application... (${attempt}/${max_attempts})"
        sleep 5
    done
    
    log_error "Health check failed"
    log_info "Checking application logs..."
    docker logs limo-app --tail 30
    return 1
}

show_info() {
    local server_ip=$(hostname -I | awk '{print $1}')
    local port=${APP_PORT:-5000}
    
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║          Deployment Complete!                      ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${CYAN}Access your application:${NC}"
    echo -e "  Application:    ${GREEN}http://${server_ip}:${port}${NC}"
    echo -e "  MinIO Console:  ${GREEN}http://${server_ip}:9001${NC}"
    echo ""
    echo -e "${CYAN}Default Admin Login:${NC}"
    echo -e "  Username: ${YELLOW}mikewhite${NC}"
    echo -e "  Password: ${YELLOW}admin123${NC}"
    echo -e "  ${RED}(Change this immediately after login!)${NC}"
    echo ""
    echo -e "${CYAN}Useful commands:${NC}"
    echo -e "  View logs:    ${YELLOW}docker logs limo-app -f${NC}"
    echo -e "  Restart:      ${YELLOW}docker restart limo-app${NC}"
    echo -e "  Stop all:     ${YELLOW}cd ${SCRIPT_DIR} && docker compose down${NC}"
    echo -e "  Update:       ${YELLOW}cd ${SCRIPT_DIR} && ./update.sh${NC}"
    echo ""
    echo -e "${CYAN}Next steps:${NC}"
    echo "  1. Login and change admin password"
    echo "  2. Configure your domain DNS to point to ${server_ip}"
    echo "  3. Set up SSL with Nginx/Caddy reverse proxy"
    echo "  4. Add API keys in Settings (Stripe, Twilio, etc.)"
    echo ""
}

cleanup_on_error() {
    log_error "Deployment failed. Cleaning up..."
    cd "$SCRIPT_DIR"
    docker compose -f docker-compose.yml down 2>/dev/null || true
}

# ============================================
# MAIN
# ============================================

main() {
    trap cleanup_on_error ERR
    
    print_banner
    check_root
    detect_os
    
    echo ""
    echo "This script will:"
    echo "  1. Install Docker and Docker Compose"
    echo "  2. Create secure environment configuration"
    echo "  3. Deploy PostgreSQL, MinIO, and the application"
    echo ""
    read -p "Continue? (y/n) " -n 1 -r
    echo
    [[ ! $REPLY =~ ^[Yy]$ ]] && exit 0
    
    install_docker
    install_utilities
    setup_env_file
    build_and_deploy
    run_migrations
    
    if check_health; then
        show_info
        exit 0
    else
        log_error "Deployment issues detected. Check logs above."
        exit 1
    fi
}

# Run with arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  (none)     Full installation"
        echo "  setup      Configure .env only"
        echo "  deploy     Build and deploy only"
        echo "  status     Check service status"
        echo "  logs       View application logs"
        echo ""
        exit 0
        ;;
    setup)
        check_root
        setup_env_file
        ;;
    deploy)
        check_root
        build_and_deploy
        run_migrations
        check_health
        show_info
        ;;
    status)
        cd "$SCRIPT_DIR"
        docker compose -f docker-compose.yml ps
        check_health || true
        ;;
    logs)
        docker logs limo-app -f
        ;;
    *)
        main
        ;;
esac
