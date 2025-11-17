# ------------------------------------
# 1. Builder Stage: Install dependencies and build the app
# ------------------------------------
FROM node:20-alpine AS builder

# Add labels for image metadata
LABEL maintainer="Hope Limo"
LABEL description="Luxury transportation booking platform"
LABEL version="1.0.0"

WORKDIR /app

# IMPORTANT: Do NOT set NODE_ENV=production in builder stage
# We need devDependencies (like vite, esbuild, typescript) to build

# Copy package files and install ALL dependencies (including dev)
COPY package*.json ./
RUN npm ci --ignore-scripts

# Copy application source
COPY . .

# Build frontend (outputs to dist/public)
RUN npx vite build

# Verify frontend build succeeded
RUN ls -la dist/public/ && \
    ls -la dist/public/assets/ && \
    echo "Frontend build verification: PASSED"

# Build backend with esbuild (outputs to dist/index.js)
RUN npx esbuild server/index.ts --platform=node --bundle --format=esm --outdir=dist --packages=external --external:vite --external:@vitejs/* --external:./server/vite.ts --external:./server/vite.js

# Verify backend build succeeded
RUN ls -la dist/index.js && \
    echo "Backend build verification: PASSED"

# ------------------------------------
# 2. Production Stage: Minimal, secure image for running the app
# ------------------------------------
FROM node:20-alpine AS production

# Add labels
LABEL maintainer="Hope Limo"
LABEL description="Luxury transportation booking platform - Production"
LABEL version="1.0.0"

# Install wget for healthcheck and security updates
RUN apk add --no-cache wget \
    && apk upgrade --no-cache

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs \
    && adduser -S nodejs -u 1001

WORKDIR /app

# Set production environment (only in production stage)
ENV NODE_ENV=hopelimo
ENV PORT=5000

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev --ignore-scripts

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/shared ./shared

# Change ownership to non-root user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port 5000
EXPOSE 5000

# Health check configuration
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:5000/health || exit 1

# Start the Node.js server directly
CMD ["node", "dist/index.js"]
