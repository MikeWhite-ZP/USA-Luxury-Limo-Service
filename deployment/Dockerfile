# Production-optimized Dockerfile for USA Luxury Limo
# Multi-stage build for minimal image size

# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY client ./client
COPY shared ./shared
COPY tsconfig.json ./
COPY vite.config.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./

RUN npm run build

# Stage 2: Build backend
FROM node:20-alpine AS backend-builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY server ./server
COPY shared ./shared
COPY db ./db
COPY tsconfig.json ./
COPY drizzle.config.ts ./

# Stage 3: Production runtime
FROM node:20-alpine

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built assets from build stages
COPY --from=frontend-builder /app/dist ./dist
COPY --from=backend-builder /app/server ./server
COPY --from=backend-builder /app/shared ./shared
COPY --from=backend-builder /app/db ./db
COPY --from=backend-builder /app/drizzle.config.ts ./
COPY --from=backend-builder /app/tsconfig.json ./

# Copy deployment scripts
COPY deployment/entrypoint.sh ./
COPY deployment/healthcheck.sh ./
RUN chmod +x entrypoint.sh healthcheck.sh

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node healthcheck.sh

# Start application
ENTRYPOINT ["./entrypoint.sh"]
CMD ["node", "--import", "tsx", "server/index.ts"]
