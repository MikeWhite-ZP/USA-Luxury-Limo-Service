#!/bin/bash

# ==================================
# USA Luxury Limo - Automated Deployment Script
# ==================================
# This script automates the deployment of USA Luxury Limo on a Linux server
# Supports: Ubuntu 20.04+, Debian 10+
# ==================================

set -euo pipefail  # Exit on error, undefined vars, pipe failures
IFS=$'\n\t'

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration file
CONFIG_FILE="deploy.config"

# Logging
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo ""
    echo "=========================================="
    echo "$1"
    echo "=========================================="
    echo ""
}

# Check if running as root or with sudo
check_root() {
    if [ "$EUID" -ne 0 ]; then 
        log_error "This script must be run as root or with sudo"
        exit 1
    fi
    log_success "Running with appropriate permissions"
}

# Detect OS
detect_os() {
    print_header "Detecting Operating System"
    
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        OS_VERSION=$VERSION_ID
        log_info "Detected OS: $PRETTY_NAME"
        
        if [[ "$OS" != "ubuntu" && "$OS" != "debian" ]]; then
            log_warning "This script is optimized for Ubuntu/Debian. Your OS: $OS"
            read -p "Continue anyway? (y/n) " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                exit 1
            fi
        fi
    else
        log_error "Cannot detect OS. /etc/os-release not found"
        exit 1
    fi
}

# Update system packages
update_system() {
    print_header "Updating System Packages"
    log_info "Running apt update..."
    apt update -y
    log_info "Running apt upgrade (this may take a while)..."
    DEBIAN_FRONTEND=noninteractive apt upgrade -y
    log_success "System updated successfully"
}

# Install Docker
install_docker() {
    print_header "Checking Docker Installation"
    
    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version)
        log_success "Docker is already installed: $DOCKER_VERSION"
        return 0
    fi
    
    log_info "Docker not found. Installing Docker..."
    
    # Install prerequisites
    apt install -y \
        ca-certificates \
        curl \
        gnupg \
        lsb-release
    
    # Add Docker's official GPG key
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/${OS}/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    
    # Set up the repository
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/${OS} \
      $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker Engine
    apt update -y
    apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # Start and enable Docker
    systemctl start docker
    systemctl enable docker
    
    log_success "Docker installed successfully"
    docker --version
}

# Install Docker Compose (standalone if not available as plugin)
install_docker_compose() {
    print_header "Checking Docker Compose Installation"
    
    if docker compose version &> /dev/null; then
        COMPOSE_VERSION=$(docker compose version)
        log_success "Docker Compose is available: $COMPOSE_VERSION"
        return 0
    fi
    
    # If plugin not available, install standalone
    log_info "Installing Docker Compose standalone..."
    COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep '"tag_name"' | sed -E 's/.*"([^"]+)".*/\1/')
    curl -L "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    
    log_success "Docker Compose installed successfully"
    docker-compose --version
}

# Install additional utilities
install_utilities() {
    print_header "Installing Additional Utilities"
    log_info "Installing git, curl, wget, jq..."
    apt install -y git curl wget jq net-tools
    log_success "Utilities installed successfully"
}

# Load configuration
load_config() {
    print_header "Loading Configuration"
    
    if [ ! -f "$CONFIG_FILE" ]; then
        log_error "Configuration file '$CONFIG_FILE' not found!"
        log_info "Please copy deploy.config.example to deploy.config and fill in your values"
        exit 1
    fi
    
    # Source the config file
    source "$CONFIG_FILE"
    
    # Validate required variables
    REQUIRED_VARS=(
        "DATABASE_URL"
        "SESSION_SECRET"
        "STRIPE_SECRET_KEY"
        "VITE_STRIPE_PUBLIC_KEY"
        "MINIO_SECRET_KEY"
    )
    
    local missing_vars=()
    for var in "${REQUIRED_VARS[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        log_error "Missing required configuration variables:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        log_info "Please update your deploy.config file"
        exit 1
    fi
    
    log_success "Configuration loaded successfully"
    log_info "Database: ${DATABASE_URL%%@*}@****"
}

# Clone or update repository
setup_repository() {
    print_header "Setting Up Application Repository"
    
    if [ -n "$GITHUB_REPO" ]; then
        if [ -d "$APP_DIR/.git" ]; then
            log_info "Repository already exists. Pulling latest changes..."
            cd "$APP_DIR"
            git pull
        else
            log_info "Cloning repository from $GITHUB_REPO..."
            git clone "$GITHUB_REPO" "$APP_DIR"
            cd "$APP_DIR"
        fi
        log_success "Repository ready"
    else
        log_info "No GITHUB_REPO specified. Using current directory..."
        if [ ! -f "Dockerfile" ]; then
            log_error "Dockerfile not found in current directory"
            exit 1
        fi
        APP_DIR=$(pwd)
    fi
    
    cd "$APP_DIR"
}

# Create .env file from config
create_env_file() {
    print_header "Creating Environment File"
    
    log_info "Generating .env file from configuration..."
    
    cat > .env << EOF
# ==================================
# USA Luxury Limo - Production Environment
# Generated by deploy.sh on $(date)
# ==================================

# Node Environment
NODE_ENV=production
PORT=${PORT:-5000}

# Database
DATABASE_URL=${DATABASE_URL}

# Session Secret
SESSION_SECRET=${SESSION_SECRET}

# Stripe Payment
STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
VITE_STRIPE_PUBLIC_KEY=${VITE_STRIPE_PUBLIC_KEY}

# MinIO Object Storage
MINIO_ENDPOINT=${MINIO_ENDPOINT:-http://minio:9000}
MINIO_ACCESS_KEY=${MINIO_ACCESS_KEY:-minioadmin}
MINIO_SECRET_KEY=${MINIO_SECRET_KEY}
MINIO_BUCKET=${MINIO_BUCKET:-usa-luxury-limo}

# Email Configuration
SMTP_HOST=${SMTP_HOST:-}
SMTP_PORT=${SMTP_PORT:-}
SMTP_SECURE=${SMTP_SECURE:-}
SMTP_USER=${SMTP_USER:-}
SMTP_PASS=${SMTP_PASS:-}
EMAIL_FROM_NAME=${EMAIL_FROM_NAME:-USA Luxury Limo}
EMAIL_FROM_ADDRESS=${EMAIL_FROM_ADDRESS:-}

# SMS Configuration
TWILIO_ACCOUNT_SID=${TWILIO_ACCOUNT_SID:-}
TWILIO_AUTH_TOKEN=${TWILIO_AUTH_TOKEN:-}
TWILIO_PHONE_NUMBER=${TWILIO_PHONE_NUMBER:-}

# API Keys
TOMTOM_API_KEY=${TOMTOM_API_KEY:-}
RAPIDAPI_KEY=${RAPIDAPI_KEY:-}

# Domain Configuration
REPLIT_DEV_DOMAIN=${DOMAIN:-}
EOF

    log_success ".env file created"
}

# Build Docker images
build_images() {
    print_header "Building Docker Images"
    
    log_info "Building application image..."
    docker compose build --no-cache
    
    log_success "Docker images built successfully"
}

# Start services
start_services() {
    print_header "Starting Services"
    
    log_info "Starting MinIO and Application containers..."
    docker compose up -d
    
    log_info "Waiting for services to be ready (30 seconds)..."
    sleep 30
    
    log_success "Services started"
}

# Create MinIO bucket
setup_minio_bucket() {
    print_header "Setting Up MinIO Bucket"
    
    log_info "Waiting for MinIO to be ready..."
    local max_attempts=30
    local attempt=0
    
    # Wait for MinIO health endpoint
    while [ $attempt -lt $max_attempts ]; do
        if curl -f http://localhost:9000/minio/health/live &> /dev/null; then
            log_success "MinIO is ready"
            break
        fi
        attempt=$((attempt + 1))
        log_info "Waiting for MinIO... (attempt $attempt/$max_attempts)"
        sleep 2
    done
    
    if [ $attempt -eq $max_attempts ]; then
        log_error "MinIO failed to become ready"
        return 1
    fi
    
    log_info "Configuring MinIO bucket using mc client..."
    
    # Get the actual network name from the running MinIO container
    local network_name=$(docker inspect -f '{{range $n, $_ := .NetworkSettings.Networks}}{{$n}}{{end}}' usa-limo-minio)
    
    if [ -z "$network_name" ]; then
        log_error "Could not determine Docker network name from MinIO container"
        return 1
    fi
    
    log_info "Using Docker network: $network_name"
    
    # Run minio/mc container to configure buckets
    docker run --rm --network "$network_name" \
        --entrypoint /bin/sh \
        minio/mc:latest \
        -c "mc alias set myminio http://minio:9000 ${MINIO_ACCESS_KEY:-minioadmin} ${MINIO_SECRET_KEY} && \
            mc mb --ignore-existing myminio/${MINIO_BUCKET:-usa-luxury-limo} && \
            mc anonymous set download myminio/${MINIO_BUCKET:-usa-luxury-limo}/public 2>/dev/null || true" || {
        log_error "Failed to configure MinIO bucket"
        log_info "Try running: docker network ls to verify network exists"
        return 1
    }
    
    log_success "MinIO bucket '${MINIO_BUCKET:-usa-luxury-limo}' configured successfully"
}

# Run database migrations
run_migrations() {
    print_header "Running Database Migrations"
    
    log_info "Pushing database schema..."
    docker exec usa-luxury-limo npm run db:push
    
    log_success "Database migrations completed"
}

# Check application health
check_health() {
    print_header "Checking Application Health"
    
    local max_attempts=10
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -f http://localhost:${PORT:-5000}/health &> /dev/null; then
            log_success "Application is healthy!"
            curl -s http://localhost:${PORT:-5000}/health | jq .
            return 0
        fi
        attempt=$((attempt + 1))
        log_info "Waiting for application... (attempt $attempt/$max_attempts)"
        sleep 5
    done
    
    log_error "Application health check failed"
    log_info "Checking logs..."
    docker logs usa-luxury-limo --tail 50
    return 1
}

# Show deployment info
show_deployment_info() {
    print_header "Deployment Complete!"
    
    echo ""
    log_success "USA Luxury Limo has been deployed successfully!"
    echo ""
    echo "Access your application:"
    echo "  • Application: http://$(hostname -I | awk '{print $1}'):${PORT:-5000}"
    echo "  • MinIO Console: http://$(hostname -I | awk '{print $1}'):9001"
    echo ""
    echo "Default MinIO credentials:"
    echo "  • Username: ${MINIO_ACCESS_KEY:-minioadmin}"
    echo "  • Password: ${MINIO_SECRET_KEY}"
    echo ""
    echo "Useful commands:"
    echo "  • View logs: docker logs usa-luxury-limo -f"
    echo "  • Restart app: docker restart usa-luxury-limo"
    echo "  • Stop all: docker compose down"
    echo "  • Start all: docker compose up -d"
    echo ""
    log_info "Next steps:"
    echo "  1. Set up your domain DNS to point to this server IP"
    echo "  2. Configure SSL certificate (optional, use Nginx/Caddy reverse proxy)"
    echo "  3. Create your first admin account by visiting the application URL"
    echo "  4. Configure payment providers in the admin dashboard"
    echo ""
}

# Cleanup on error
cleanup_on_error() {
    log_error "Deployment failed. Cleaning up..."
    docker compose down 2>/dev/null || true
}

# Error handler
handle_error() {
    local exit_code=$?
    local line_number=$1
    log_error "Script failed at line ${line_number} with exit code ${exit_code}"
    cleanup_on_error
    exit ${exit_code}
}

# Main deployment flow
main() {
    trap 'handle_error $LINENO' ERR
    
    print_header "USA Luxury Limo - Automated Deployment"
    
    check_root
    detect_os
    
    read -p "Do you want to update system packages? (recommended) (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        update_system
    fi
    
    install_docker
    install_docker_compose
    install_utilities
    load_config
    setup_repository
    create_env_file
    build_images
    start_services
    setup_minio_bucket
    run_migrations
    
    if check_health; then
        show_deployment_info
        exit 0
    else
        log_error "Deployment completed but application health check failed"
        log_info "Please check the logs and troubleshoot"
        exit 1
    fi
}

# Run main function
main "$@"
