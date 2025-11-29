#!/bin/bash

# USA Luxury Limo Service - Automated Setup Script
# This script helps you set up the application quickly

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
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

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Generate random secret
generate_secret() {
    openssl rand -base64 32
}

# Main setup function
main() {
    log_info "Starting USA Luxury Limo Service setup..."
    echo ""

    # Check prerequisites
    log_info "Checking prerequisites..."
    
    if ! command_exists node; then
        log_error "Node.js is not installed. Please install Node.js 20.x or higher."
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 20 ]; then
        log_error "Node.js version must be 20 or higher. Current: $(node -v)"
        exit 1
    fi
    log_success "Node.js $(node -v) found"
    
    if ! command_exists npm; then
        log_error "npm is not installed."
        exit 1
    fi
    log_success "npm $(npm -v) found"
    
    if ! command_exists docker; then
        log_warning "Docker is not installed. Docker is optional but recommended for local development."
    else
        log_success "Docker $(docker -v | cut -d' ' -f3 | cut -d',' -f1) found"
    fi
    
    echo ""
    
    # Install dependencies
    log_info "Installing dependencies..."
    npm install
    log_success "Dependencies installed"
    echo ""
    
    # Setup environment variables
    if [ ! -f .env ]; then
        log_info "Creating .env file..."
        
        if [ -f .env.example ]; then
            cp .env.example .env
            log_success ".env file created from .env.example"
        else
            log_error ".env.example not found. Creating basic .env file..."
            cat > .env << EOF
NODE_ENV=development
PORT=5000
HOST=0.0.0.0

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/usa_luxury_limo
SESSION_SECRET=$(generate_secret)

STORAGE_PROVIDER=minio
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_BUCKET=usa-luxury-limo
MINIO_USE_SSL=false

STRIPE_SECRET_KEY=sk_test_your_key_here
VITE_STRIPE_PUBLIC_KEY=pk_test_your_key_here

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

TOMTOM_API_KEY=your_tomtom_api_key
EOF
            log_success "Basic .env file created"
        fi
        
        log_warning "Please edit .env file and add your API keys"
    else
        log_info ".env file already exists"
    fi
    echo ""
    
    # Setup choice
    echo -e "${BLUE}How would you like to run the application?${NC}"
    echo "1) Docker Compose (recommended for development)"
    echo "2) Local development (requires PostgreSQL)"
    read -p "Enter your choice (1 or 2): " setup_choice
    echo ""
    
    case $setup_choice in
        1)
            setup_docker
            ;;
        2)
            setup_local
            ;;
        *)
            log_error "Invalid choice. Exiting."
            exit 1
            ;;
    esac
}

# Docker setup
setup_docker() {
    if ! command_exists docker; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command_exists docker-compose; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    log_info "Setting up with Docker Compose..."
    
    # Build and start containers
    log_info "Building Docker images..."
    docker-compose build
    
    log_info "Starting services..."
    docker-compose up -d
    
    # Wait for services to be ready
    log_info "Waiting for services to start..."
    sleep 10
    
    # Check if services are running
    if docker-compose ps | grep -q "Up"; then
        log_success "Docker services started successfully"
    else
        log_error "Some services failed to start. Check logs with: docker-compose logs"
        exit 1
    fi
    
    # Run database migrations
    log_info "Running database migrations..."
    docker-compose exec -T app npm run db:push
    log_success "Database migrations completed"
    
    echo ""
    log_success "Setup complete!"
    echo ""
    echo -e "${GREEN}Application is running at: http://localhost:5000${NC}"
    echo -e "${GREEN}MinIO Console at: http://localhost:9001${NC}"
    echo "  Username: minioadmin"
    echo "  Password: minioadmin123"
    echo ""
    echo "Useful commands:"
    echo "  View logs:    docker-compose logs -f"
    echo "  Stop:         docker-compose down"
    echo "  Restart:      docker-compose restart"
    echo "  Shell access: docker-compose exec app sh"
}

# Local setup
setup_local() {
    log_info "Setting up for local development..."
    
    # Check if PostgreSQL is running
    if ! command_exists psql; then
        log_warning "PostgreSQL client (psql) not found. Make sure PostgreSQL is installed."
    fi
    
    # Check DATABASE_URL
    if grep -q "DATABASE_URL=" .env; then
        DB_URL=$(grep "DATABASE_URL=" .env | cut -d'=' -f2)
        log_info "Testing database connection..."
        
        if psql "$DB_URL" -c "SELECT 1" >/dev/null 2>&1; then
            log_success "Database connection successful"
        else
            log_warning "Could not connect to database. Please verify DATABASE_URL in .env"
            log_info "Make sure PostgreSQL is running and database exists"
        fi
    else
        log_warning "DATABASE_URL not set in .env file"
    fi
    
    # Run database migrations
    log_info "Running database migrations..."
    if npm run db:push; then
        log_success "Database migrations completed"
    else
        log_error "Database migration failed. Please check your DATABASE_URL"
        exit 1
    fi
    
    # Create uploads directory
    if [ ! -d "uploads" ]; then
        mkdir -p uploads
        log_success "Created uploads directory"
    fi
    
    echo ""
    log_success "Setup complete!"
    echo ""
    echo -e "${GREEN}To start the development server, run:${NC}"
    echo "  npm run dev"
    echo ""
    echo -e "${GREEN}Application will be available at: http://localhost:5000${NC}"
    echo ""
    echo "Notes:"
    echo "  - Make sure PostgreSQL is running"
    echo "  - Update API keys in .env file"
    echo "  - For file uploads, configure MinIO or S3 in .env"
}

# Production setup check
production_check() {
    log_info "Running production readiness checks..."
    
    ISSUES=0
    
    # Check SESSION_SECRET
    if grep -q "SESSION_SECRET=change-this" .env 2>/dev/null; then
        log_error "SESSION_SECRET is still using default value"
        ((ISSUES++))
    fi
    
    # Check Stripe keys
    if grep -q "STRIPE_SECRET_KEY=sk_test_" .env 2>/dev/null; then
        log_warning "Using Stripe test keys (not for production)"
    fi
    
    # Check DATABASE_URL has SSL
    if ! grep -q "sslmode=require" .env 2>/dev/null; then
        log_warning "DATABASE_URL should include sslmode=require for production"
    fi
    
    # Check NODE_ENV
    if ! grep -q "NODE_ENV=production" .env 2>/dev/null; then
        log_error "NODE_ENV should be 'production'"
        ((ISSUES++))
    fi
    
    if [ $ISSUES -eq 0 ]; then
        log_success "Production readiness checks passed"
    else
        log_error "$ISSUES critical issues found. Not ready for production!"
        exit 1
    fi
}

# Show help
show_help() {
    echo "USA Luxury Limo Service - Setup Script"
    echo ""
    echo "Usage: ./setup.sh [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --help              Show this help message"
    echo "  --production-check  Check if ready for production deployment"
    echo "  --docker            Setup with Docker Compose"
    echo "  --local             Setup for local development"
    echo ""
    echo "Examples:"
    echo "  ./setup.sh                    # Interactive setup"
    echo "  ./setup.sh --docker           # Quick Docker setup"
    echo "  ./setup.sh --production-check # Verify production config"
}

# Parse command line arguments
case "${1:-}" in
    --help)
        show_help
        exit 0
        ;;
    --production-check)
        production_check
        exit 0
        ;;
    --docker)
        setup_docker
        exit 0
        ;;
    --local)
        setup_local
        exit 0
        ;;
    "")
        main
        ;;
    *)
        log_error "Unknown option: $1"
        show_help
        exit 1
        ;;
esac
