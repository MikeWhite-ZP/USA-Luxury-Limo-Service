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
ENV PORT=5000

# Install Caddy
RUN apk add --no-cache caddy

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/shared ./shared

# Copy Caddyfile
COPY Caddyfile /etc/caddy/Caddyfile

# Expose port 5000 (external - Caddy)
EXPOSE 5000

# Health check - check Caddy on port 5000
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD wget --quiet --tries=1 --spider http://localhost:5000/ || exit 1

# Start both Node server (port 3000) and Caddy (port 5000)
CMD ["sh", "-c", "node /app/dist/index.js & caddy run --config /etc/caddy/Caddyfile --adapter caddyfile"]