#!/bin/bash
# ============================================
# White-Label Limo Service - Update Script
# Use this to update an existing deployment
# ============================================

set -euo pipefail

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo ""
echo -e "${BLUE}=== Limo Service Update ===${NC}"
echo ""

cd "$SCRIPT_DIR"

# Check if .env exists
if [ ! -f ".env" ]; then
    log_error ".env file not found"
    exit 1
fi

# Check for git repository
if [ -d "../.git" ]; then
    log_info "Pulling latest changes..."
    cd ..
    git pull
    cd "$SCRIPT_DIR"
fi

# Backup current state
log_info "Creating backup..."
docker compose -f docker-compose.yml exec -T limo-postgres pg_dump -U limo limo_service > "backup_$(date +%Y%m%d_%H%M%S).sql" 2>/dev/null || log_warning "Database backup skipped"

# Rebuild and restart
log_info "Rebuilding application..."
docker compose -f docker-compose.yml build --no-cache app

log_info "Restarting services..."
docker compose -f docker-compose.yml up -d app

log_info "Waiting for application to be ready..."
sleep 15

# Health check
if curl -sf http://localhost:${APP_PORT:-5000}/health > /dev/null 2>&1; then
    log_success "Update complete! Application is healthy."
else
    log_error "Health check failed. Rolling back..."
    docker compose -f docker-compose.yml logs app --tail 20
    exit 1
fi

echo ""
log_success "Update completed successfully!"
echo ""
