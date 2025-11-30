#!/bin/bash
# ============================================
# Tenant App Deployment Script
# ============================================
# Run this from a tenant directory:
#   cd tenants/acme-limo && ./deploy.sh
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
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "\n${CYAN}==> $1${NC}"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check for .env
if [ ! -f "${SCRIPT_DIR}/.env" ]; then
    log_error ".env file not found"
    echo "Run provision-tenant.sh first or copy .env.example"
    exit 1
fi

# Load environment
set -a
source "${SCRIPT_DIR}/.env"
set +a

COMPANY_SLUG="${COMPANY_SLUG:?COMPANY_SLUG not set in .env}"

print_banner() {
    echo ""
    echo -e "${CYAN}╔═══════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║         Deploying: ${COMPANY_SLUG}${NC}"
    echo -e "${CYAN}╚═══════════════════════════════════════════════════════╝${NC}"
    echo ""
}

build_and_deploy() {
    log_step "Building and Deploying Application"
    
    cd "$SCRIPT_DIR"
    
    log_info "Building Docker image..."
    docker compose build --no-cache
    
    log_info "Starting application..."
    docker compose up -d
    
    log_success "Application started"
}

run_migrations() {
    log_step "Running Database Migrations"
    
    log_info "Waiting for application to start..."
    sleep 10
    
    log_info "Pushing database schema..."
    docker exec ${COMPANY_SLUG}-app npm run db:push || true
    
    log_success "Migrations complete"
}

check_health() {
    log_step "Checking Application Health"
    
    local port=${APP_PORT:-5000}
    local attempts=0
    
    while [ $attempts -lt 15 ]; do
        if curl -sf http://localhost:${port}/health > /dev/null 2>&1; then
            log_success "Application is healthy!"
            return 0
        fi
        attempts=$((attempts + 1))
        log_info "Waiting for application... (${attempts}/15)"
        sleep 5
    done
    
    log_error "Health check failed"
    docker logs ${COMPANY_SLUG}-app --tail 30
    return 1
}

show_info() {
    local port=${APP_PORT:-5000}
    local server_ip=$(hostname -I | awk '{print $1}')
    
    echo ""
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║         ${COMPANY_SLUG} Deployed Successfully!${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${CYAN}Access:${NC}"
    echo -e "  Application: ${GREEN}http://${server_ip}:${port}${NC}"
    echo ""
    echo -e "${CYAN}Default Admin:${NC}"
    echo -e "  Username: ${YELLOW}mikewhite${NC}"
    echo -e "  Password: ${YELLOW}admin123${NC}"
    echo ""
    echo -e "${CYAN}Commands:${NC}"
    echo -e "  View logs:  ${YELLOW}docker logs ${COMPANY_SLUG}-app -f${NC}"
    echo -e "  Restart:    ${YELLOW}docker restart ${COMPANY_SLUG}-app${NC}"
    echo -e "  Stop:       ${YELLOW}docker compose down${NC}"
    echo ""
}

# ============================================
# MAIN
# ============================================

case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  (none)     Build and deploy"
        echo "  update     Rebuild and update"
        echo "  status     Check status"
        echo "  logs       View logs"
        echo "  stop       Stop application"
        echo ""
        exit 0
        ;;
    update)
        print_banner
        build_and_deploy
        check_health
        show_info
        ;;
    status)
        docker compose ps
        check_health || true
        ;;
    logs)
        docker logs ${COMPANY_SLUG}-app -f
        ;;
    stop)
        docker compose down
        log_success "Application stopped"
        ;;
    *)
        print_banner
        build_and_deploy
        run_migrations
        if check_health; then
            show_info
        fi
        ;;
esac
