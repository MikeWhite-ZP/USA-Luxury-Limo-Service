#!/bin/bash
# ============================================
# Central Infrastructure Deployment
# PostgreSQL + MinIO for all tenants
# ============================================
# Run this ONCE on your main server
# Then use provision-tenant.sh for each company
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

print_banner() {
    echo ""
    echo -e "${CYAN}╔═══════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║   Central Infrastructure - PostgreSQL + MinIO         ║${NC}"
    echo -e "${CYAN}╚═══════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "This sets up the CENTRAL database and storage servers."
    echo "All tenant deployments will connect to these services."
    echo ""
}

check_docker() {
    log_step "Checking Docker"
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker not installed. Install Docker first:"
        echo "  curl -fsSL https://get.docker.com | sh"
        exit 1
    fi
    
    if ! docker compose version &> /dev/null; then
        log_error "Docker Compose not available"
        exit 1
    fi
    
    log_success "Docker is ready"
}

setup_env() {
    log_step "Configuring Environment"
    
    ENV_FILE="${SCRIPT_DIR}/.env"
    
    if [ -f "$ENV_FILE" ]; then
        log_info ".env already exists"
        read -p "Overwrite? (y/n) " -n 1 -r
        echo
        [[ ! $REPLY =~ ^[Yy]$ ]] && return 0
    fi
    
    # Generate secure passwords
    POSTGRES_PASS=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 24)
    MINIO_PASS=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 24)
    
    # Get server IP
    SERVER_IP=$(hostname -I | awk '{print $1}')
    
    echo ""
    read -p "Server IP/Domain [$SERVER_IP]: " INPUT_HOST
    SERVER_HOST=${INPUT_HOST:-$SERVER_IP}
    
    read -p "PostgreSQL port [5432]: " INPUT_PG_PORT
    PG_PORT=${INPUT_PG_PORT:-5432}
    
    read -p "MinIO API port [9000]: " INPUT_MINIO_PORT
    MINIO_PORT=${INPUT_MINIO_PORT:-9000}
    
    read -p "MinIO Console port [9001]: " INPUT_MINIO_CONSOLE
    MINIO_CONSOLE=${INPUT_MINIO_CONSOLE:-9001}
    
    cat > "$ENV_FILE" << EOF
# ============================================
# Central Infrastructure - Generated $(date)
# ============================================
# KEEP THESE CREDENTIALS SECURE!
# They are used to create tenant databases/buckets
# ============================================

# PostgreSQL Admin
POSTGRES_ADMIN_USER=postgres
POSTGRES_ADMIN_PASSWORD=${POSTGRES_PASS}
POSTGRES_PORT=${PG_PORT}
POSTGRES_HOST=${SERVER_HOST}

# MinIO Admin  
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=${MINIO_PASS}
MINIO_API_PORT=${MINIO_PORT}
MINIO_CONSOLE_PORT=${MINIO_CONSOLE}
MINIO_HOST=${SERVER_HOST}
EOF

    chmod 600 "$ENV_FILE"
    
    log_success ".env created with secure passwords"
    echo ""
    echo -e "${YELLOW}IMPORTANT: Save these admin credentials securely!${NC}"
    echo -e "PostgreSQL Admin Password: ${GREEN}${POSTGRES_PASS}${NC}"
    echo -e "MinIO Admin Password: ${GREEN}${MINIO_PASS}${NC}"
    echo ""
}

deploy_services() {
    log_step "Deploying Central Services"
    
    cd "$SCRIPT_DIR"
    
    if [ ! -f ".env" ]; then
        log_error ".env not found. Run setup first."
        exit 1
    fi
    
    # Source environment
    set -a
    source .env
    set +a
    
    log_info "Starting PostgreSQL and MinIO..."
    docker compose up -d
    
    # Wait for PostgreSQL
    log_info "Waiting for PostgreSQL..."
    local attempts=0
    while [ $attempts -lt 30 ]; do
        if docker exec limo-central-postgres pg_isready -U ${POSTGRES_ADMIN_USER:-postgres} > /dev/null 2>&1; then
            log_success "PostgreSQL is ready"
            break
        fi
        attempts=$((attempts + 1))
        sleep 2
    done
    
    if [ $attempts -eq 30 ]; then
        log_error "PostgreSQL failed to start"
        docker logs limo-central-postgres --tail 20
        exit 1
    fi
    
    # Wait for MinIO
    log_info "Waiting for MinIO..."
    attempts=0
    while [ $attempts -lt 30 ]; do
        if curl -sf http://localhost:${MINIO_API_PORT:-9000}/minio/health/live > /dev/null 2>&1; then
            log_success "MinIO is ready"
            break
        fi
        attempts=$((attempts + 1))
        sleep 2
    done
    
    if [ $attempts -eq 30 ]; then
        log_error "MinIO failed to start"
        docker logs limo-central-minio --tail 20
        exit 1
    fi
    
    log_success "All services deployed!"
}

show_info() {
    # Source environment for display
    set -a
    source "${SCRIPT_DIR}/.env"
    set +a
    
    echo ""
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║        Central Infrastructure Ready!                  ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${CYAN}Services:${NC}"
    echo -e "  PostgreSQL:    ${GREEN}${POSTGRES_HOST}:${POSTGRES_PORT}${NC}"
    echo -e "  MinIO API:     ${GREEN}http://${MINIO_HOST}:${MINIO_API_PORT}${NC}"
    echo -e "  MinIO Console: ${GREEN}http://${MINIO_HOST}:${MINIO_CONSOLE_PORT}${NC}"
    echo ""
    echo -e "${CYAN}Next Steps:${NC}"
    echo "  1. Save your admin credentials from .env securely"
    echo "  2. For each new company, run:"
    echo -e "     ${YELLOW}cd ../scripts && ./provision-tenant.sh company-slug${NC}"
    echo ""
    echo -e "${CYAN}Useful Commands:${NC}"
    echo -e "  View logs:  ${YELLOW}docker logs limo-central-postgres -f${NC}"
    echo -e "              ${YELLOW}docker logs limo-central-minio -f${NC}"
    echo -e "  Stop:       ${YELLOW}docker compose down${NC}"
    echo -e "  Restart:    ${YELLOW}docker compose restart${NC}"
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
        echo "  (none)     Full setup and deployment"
        echo "  setup      Configure .env only"
        echo "  deploy     Deploy services only"
        echo "  status     Check service status"
        echo "  stop       Stop all services"
        echo ""
        exit 0
        ;;
    setup)
        setup_env
        ;;
    deploy)
        deploy_services
        show_info
        ;;
    status)
        cd "$SCRIPT_DIR"
        docker compose ps
        ;;
    stop)
        cd "$SCRIPT_DIR"
        docker compose down
        log_success "Services stopped"
        ;;
    *)
        print_banner
        check_docker
        setup_env
        deploy_services
        show_info
        ;;
esac
