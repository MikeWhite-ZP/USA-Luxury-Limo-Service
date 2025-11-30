# ============================================
# White-Label Limo Service - Production Dockerfile
# Optimized multi-stage build for Ubuntu VPS / Coolify
# ============================================

# Stage 1: Base
FROM node:20-alpine AS base

# Stage 2: Dependencies
FROM base AS deps
WORKDIR /app

# Install build dependencies for native modules (bcrypt, sharp)
RUN apk add --no-cache libc6-compat python3 make g++

# Copy package files
COPY package*.json ./

# Install ALL dependencies (needed for build)
RUN npm ci && npm cache clean --force

# Stage 3: Builder
FROM base AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set build environment
ENV NODE_ENV=production
ENV VITE_API_URL=/api

# Build frontend (Vite) and backend (esbuild) - defined in package.json
RUN npm run build

# Stage 4: Production Runner
FROM base AS runner
WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache dumb-init curl

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

# Copy built application (both frontend and backend)
COPY --from=builder --chown=appuser:nodejs /app/dist ./dist
COPY --from=deps --chown=appuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:nodejs /app/package*.json ./

# Create directories with proper ownership
RUN mkdir -p /app/uploads /app/logs && \
    chown -R appuser:nodejs /app/uploads /app/logs

# Switch to non-root user
USER appuser

# Environment configuration
ENV NODE_ENV=production \
    PORT=5000 \
    HOST=0.0.0.0

# Expose application port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/index.js"]
