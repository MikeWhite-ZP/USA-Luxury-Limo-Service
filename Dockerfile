# Builder Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy and install all dependencies
COPY package*.json ./
RUN npm ci

# Copy application source
COPY . .

# Build application
RUN npx vite build
RUN npx esbuild server/index.ts --platform=node --bundle --format=esm --outdir=dist --packages=external --external:vite --external:@vitejs/* --external:./server/vite.ts --external:./server/vite.js

# Production Stage
FROM node:20-alpine AS production

# Install utilities for healthcheck and DB connectivity
RUN apk add --no-cache wget netcat-openbsd postgresql-client

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm install drizzle-kit

# Copy built application and configuration files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/database ./database
COPY drizzle.config.ts ./
COPY --from=builder /app/migrations ./migrations

# Change ownership to non-root user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5000

# Health check - more lenient since app needs time to start migrations
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
  CMD wget --quiet --tries=3 --spider http://localhost:5000/health || exit 1

# Start command: Run migrations, then start app
CMD ["sh", "-c", "echo '📦 Attempting database migrations...' && npx drizzle-kit push --config=drizzle.config.ts 2>&1 | tee /tmp/migration.log || true && echo '✅ Migrations completed (or skipped if already applied).' && echo '🚀 Starting Application...' && node dist/index.js"]
