# ------------------------------------
# 1. Builder Stage: Install dependencies and build the app
# ------------------------------------
FROM node:20-alpine AS builder

# Add labels for image metadata
LABEL maintainer="Best Chauffeurs"
LABEL description="Luxury transportation booking platform"
LABEL version="1.0.0"

WORKDIR /app

# Copy package files and install dependencies
# 'npm ci' ensures reproducible builds
COPY package*.json ./
RUN npm ci --ignore-scripts

# Copy application source
COPY . .

# Build application with explicit commands to exclude dev-only dependencies
# Build frontend (outputs to dist/public)
RUN npx vite build

# Verify frontend build succeeded
RUN ls -la dist/public/ && \
    ls -la dist/public/assets/ && \
    echo "Frontend build verification: PASSED"

# Build backend with esbuild (outputs to dist/index.js)
# Note: Externalizing packages like 'vite' is critical for a production Node.js server.
RUN npx esbuild server/index.ts --platform=node --bundle --format=esm --outdir=dist --packages=external --external:vite --external:@vitejs/* --external:./server/vite.ts --external:./server/vite.js

# Verify backend build succeeded
RUN ls -la dist/index.js && \
    echo "Backend build verification: PASSED"

# ------------------------------------
# 2. Production Stage: Minimal, secure image for running the app
# ------------------------------------
FROM node:20-alpine AS production

# Add labels
LABEL maintainer="Best Chauffeurs"
LABEL description="Luxury transportation booking platform - Production"
LABEL version="1.0.0"

# Install wget, netcat for healthcheck and database connectivity
RUN apk add --no-cache wget netcat-openbsd postgresql-client \
    && apk upgrade --no-cache

# Create non-root user for security
# UID 1001 is a common convention
RUN addgroup -g 1001 -S nodejs \
    && adduser -S nodejs -u 1001

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=5000

# Copy package files
COPY package*.json ./

# Install production dependencies only
# Using '--omit=dev' ensures a small image size
RUN npm ci --omit=dev --ignore-scripts

# Install drizzle-kit as root user before switching to nodejs user
RUN npm install -g drizzle-kit@0.31.7

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Copy shared folder (contains non-bundled assets or logic needed at runtime)
COPY --from=builder /app/shared ./shared

# Copy drizzle configuration for migrations
COPY drizzle.config.ts ./

# Copy migrations folder
COPY --from=builder /app/migrations ./migrations

# Copy startup script
COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

# Change ownership to non-root user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port 5000 (Coolify will handle SSL/routing)
EXPOSE 5000

# Health check configuration (matches the syntax used in docker-compose)
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
CMD wget --quiet --tries=1 --spider http://localhost:5000/health || exit 1

# Use entrypoint script to run migrations before starting app
ENTRYPOINT ["./entrypoint.sh"]