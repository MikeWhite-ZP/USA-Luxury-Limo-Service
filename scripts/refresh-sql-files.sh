#!/bin/bash
# Regenerate database/schema.sql and database/test-data.sql from schema.ts
# This ensures SQL files stay in sync with Drizzle schema

set -e  # Exit on error

echo "🔄 Refreshing database SQL files from schema.ts..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
POSTGRES_VERSION="14"
CONTAINER_NAME="usa-limo-sql-refresh"
POSTGRES_USER="postgres"
POSTGRES_PASSWORD="temp_password_$(date +%s)"
POSTGRES_DB="usa_luxury_limo"
POSTGRES_PORT="54321"  # Non-standard port to avoid conflicts

# Cleanup function
cleanup() {
  echo -e "${YELLOW}🧹 Cleaning up...${NC}"
  docker stop ${CONTAINER_NAME} 2>/dev/null || true
  docker rm ${CONTAINER_NAME} 2>/dev/null || true
}

# Register cleanup on script exit
trap cleanup EXIT

# Step 1: Start temporary Postgres container
echo -e "${BLUE}📦 Starting temporary Postgres container...${NC}"
docker run --name ${CONTAINER_NAME} \
  -e POSTGRES_USER=${POSTGRES_USER} \
  -e POSTGRES_PASSWORD=${POSTGRES_PASSWORD} \
  -e POSTGRES_DB=${POSTGRES_DB} \
  -p ${POSTGRES_PORT}:5432 \
  -d postgres:${POSTGRES_VERSION}

# Wait for Postgres to be ready
echo -e "${BLUE}⏳ Waiting for Postgres to be ready...${NC}"
sleep 5

for i in {1..30}; do
  if docker exec ${CONTAINER_NAME} pg_isready -U ${POSTGRES_USER} > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Postgres is ready${NC}"
    break
  fi
  if [ $i -eq 30 ]; then
    echo -e "${RED}✗ Postgres failed to start in time${NC}"
    exit 1
  fi
  sleep 1
done

# Step 2: Enable required extensions
echo -e "${BLUE}🔧 Enabling required extensions...${NC}"
docker exec ${CONTAINER_NAME} psql -U ${POSTGRES_USER} -d ${POSTGRES_DB} -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"

# Step 3: Push Drizzle schema to temporary database
echo -e "${BLUE}🚀 Applying Drizzle schema to temporary database...${NC}"
export DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:${POSTGRES_PORT}/${POSTGRES_DB}"

# Use drizzle-kit push to apply schema
npx drizzle-kit push --force

echo -e "${GREEN}✓ Schema applied successfully${NC}"

# Step 4: Apply test data
echo -e "${BLUE}📝 Loading test data...${NC}"
if [ -f "database/test-data.sql" ]; then
  docker exec -i ${CONTAINER_NAME} psql -U ${POSTGRES_USER} -d ${POSTGRES_DB} < database/test-data.sql || {
    echo -e "${YELLOW}⚠ Warning: Test data loading had errors (this is expected for new tables)${NC}"
  }
fi

# Step 5: Dump schema to schema.sql
echo -e "${BLUE}💾 Generating fresh schema.sql...${NC}"
docker exec ${CONTAINER_NAME} pg_dump -U ${POSTGRES_USER} -d ${POSTGRES_DB} \
  --schema-only \
  --no-owner \
  --no-acl \
  > database/schema.sql

echo -e "${GREEN}✓ schema.sql generated${NC}"

# Step 6: Dump data to test-data.sql
echo -e "${BLUE}💾 Generating fresh test-data.sql...${NC}"
docker exec ${CONTAINER_NAME} pg_dump -U ${POSTGRES_USER} -d ${POSTGRES_DB} \
  --data-only \
  --no-owner \
  --no-acl \
  --column-inserts \
  --exclude-table=sessions \
  --exclude-table=password_reset_tokens \
  > database/test-data.sql.tmp

# Add header comment to test-data.sql
cat > database/test-data.sql << 'EOF'
-- USA Luxury Limo Test Data
-- Auto-generated from schema.ts via scripts/refresh-sql-files.sh
-- Populate database with sample/test data for development and testing

EOF

cat database/test-data.sql.tmp >> database/test-data.sql
rm database/test-data.sql.tmp

echo -e "${GREEN}✓ test-data.sql generated${NC}"

# Step 7: Add helpful header to schema.sql
cat > database/schema.sql.tmp << 'EOF'
-- USA Luxury Limo Database Schema
-- Auto-generated from schema.ts via scripts/refresh-sql-files.sh
-- PostgreSQL 14+

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

EOF

cat database/schema.sql >> database/schema.sql.tmp
mv database/schema.sql.tmp database/schema.sql

echo -e "${GREEN}✓ SQL files refreshed successfully!${NC}"
echo ""
echo -e "${BLUE}📁 Updated files:${NC}"
echo "  - database/schema.sql"
echo "  - database/test-data.sql"
echo ""
echo -e "${GREEN}✅ Done! SQL files are now in sync with shared/schema.ts${NC}"
