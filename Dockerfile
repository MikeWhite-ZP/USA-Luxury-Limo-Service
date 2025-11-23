# ----------------------------------------------------
# 1. Builder Stage: Install dependencies and build the app
# ----------------------------------------------------
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files and install all dependencies
# 'npm ci' ensures reproducible builds
COPY package*.json ./
RUN npm ci

# Copy application source
COPY . .

# Build application (Frontend & Backend)
# Frontend build (outputs to dist/public)
RUN npx vite build
# Backend build (outputs to dist/index.js)
RUN npx esbuild server/index.ts --platform=node --bundle --format=esm --outdir=dist --packages=external --external:vite --external:@vitejs/* --external:./server/vite.ts --external:./server/vite.js

# ----------------------------------------------------
# 2. Production Stage: Minimal, secure image for running the app
# ----------------------------------------------------
FROM node:20-alpine AS production

# Install utilities for healthcheck and DB connectivity
RUN apk add --no-cache wget netcat-openbsd postgresql-client

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs \
    && adduser -S nodejs -u 1001

WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Copy package files and install only production dependencies
# We ensure the migration tool (drizzle-kit) is installed for the startup command.
COPY package*.json ./
RUN npm ci --omit=dev && npm install drizzle-kit

# Copy built application and runtime configuration files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/database ./database
COPY drizzle.config.ts ./
COPY --from=builder /app/migrations ./migrations

# Change ownership to non-root user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port 5000
EXPOSE 5000

# Health check configuration (using the existing robust check)
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
CMD wget --quiet --tries=1 --spider http://localhost:5000/health || exit 1

# *** THE FIX IS HERE ***
# CMD now executes the fixed migration command and then starts the app.
# The `depends_on: service_healthy` in your docker-compose ensures the DB is ready first.
CMD ["sh", "-c", "echo '📦 Running database migrations...' && npx drizzle-kit push && echo '✅ Migrations complete, starting application...' && node dist/index.js"]