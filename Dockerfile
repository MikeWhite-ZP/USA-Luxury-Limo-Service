# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS production
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Install Caddy and wget
RUN apk add --no-cache caddy wget

# Copy package files
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/shared ./shared

# Copy Caddyfile
COPY Caddyfile /etc/caddy/Caddyfile

# Create a startup script
RUN echo '#!/bin/sh' > /start.sh && \
    echo 'echo "Starting Node.js server..."' >> /start.sh && \
    echo 'node /app/dist/index.js &' >> /start.sh && \
    echo 'NODE_PID=$!' >> /start.sh && \
    echo 'echo "Waiting for Node.js to be ready..."' >> /start.sh && \
    echo 'for i in 1 2 3 4 5 6 7 8 9 10; do' >> /start.sh && \
    echo '  if wget -q --spider http://localhost:3000/health 2>/dev/null; then' >> /start.sh && \
    echo '    echo "Node.js is ready!"' >> /start.sh && \
    echo '    break' >> /start.sh && \
    echo '  fi' >> /start.sh && \
    echo '  if [ $i -eq 10 ]; then' >> /start.sh && \
    echo '    echo "Node.js failed to start"' >> /start.sh && \
    echo '    kill $NODE_PID 2>/dev/null' >> /start.sh && \
    echo '    exit 1' >> /start.sh && \
    echo '  fi' >> /start.sh && \
    echo '  sleep 1' >> /start.sh && \
    echo 'done' >> /start.sh && \
    echo 'echo "Starting Caddy..."' >> /start.sh && \
    echo 'exec caddy run --config /etc/caddy/Caddyfile --adapter caddyfile' >> /start.sh && \
    chmod +x /start.sh

# Expose port 5000 (external - Caddy)
EXPOSE 5000

# Health check - check Caddy on port 5000
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
CMD wget --quiet --tries=1 --spider http://localhost:5000/health || exit 1

# Use the startup script
CMD ["/start.sh"]