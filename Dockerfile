# Build stage
FROM node:20-alpine AS builder

# Add labels for image metadata
LABEL maintainer="USA Luxury Limo"
LABEL description="Luxury transportation booking platform"
LABEL version="1.0.0"

WORKDIR /app

# Copy package files and install dependencies
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

# Build backend with vite excluded from bundle (outputs to dist/index.js)
RUN npx esbuild server/index.ts --platform=node --bundle --format=esm --outdir=dist --packages=external --external:vite --external:@vitejs/* --external:./server/vite.ts --external:./server/vite.js

# Verify backend build succeeded
RUN ls -la dist/index.js && \
    echo "Backend build verification: PASSED"

# Production stage
FROM node:20-alpine AS production

# Add labels
LABEL maintainer="USA Luxury Limo"
LABEL description="Luxury transportation booking platform - Production"
LABEL version="1.0.0"

# Install wget for healthcheck and security updates
RUN apk add --no-cache wget \
    && apk upgrade --no-cache

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs \
    && adduser -S nodejs -u 1001

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
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

# Expose port 5000 (Coolify will handle SSL/routing)
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
CMD wget --quiet --tries=1 --spider http://localhost:5000/health || exit 1

# Start the Node.js server directly
CMD ["node", "dist/index.js"]