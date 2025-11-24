#!/bin/bash
set -e

echo "🚀 USA Luxury Limo - Deployment Script"
echo "======================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="usa-luxury-limo"
IMAGE_TAG="${1:-latest}"
COMPOSE_FILE="deployment/docker-compose.yml"

echo ""
echo -e "${YELLOW}📦 Building Docker image...${NC}"
docker build -f deployment/Dockerfile -t ${IMAGE_NAME}:${IMAGE_TAG} .

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Build successful!${NC}"
else
  echo -e "${RED}❌ Build failed!${NC}"
  exit 1
fi

echo ""
echo -e "${YELLOW}🔍 Image size:${NC}"
docker images ${IMAGE_NAME}:${IMAGE_TAG} --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

echo ""
echo -e "${GREEN}✅ Deployment ready!${NC}"
echo ""
echo "Next steps for Coolify deployment:"
echo "1. Push your code to Git repository"
echo "2. Coolify will automatically build and deploy"
echo "3. OR manually trigger deployment in Coolify UI"
echo ""
echo "To test locally:"
echo "  docker-compose -f ${COMPOSE_FILE} up"
echo ""
echo "To push to registry (optional):"
echo "  docker tag ${IMAGE_NAME}:${IMAGE_TAG} your-registry/${IMAGE_NAME}:${IMAGE_TAG}"
echo "  docker push your-registry/${IMAGE_NAME}:${IMAGE_TAG}"
