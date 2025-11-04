# Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application (frontend + backend)
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Set working directory
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=5000

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built application from builder stage
# dist/ contains both the backend (index.js) and frontend (public/)
COPY --from=builder /app/dist ./dist

# Copy shared schema (required at runtime for database types)
COPY --from=builder /app/shared ./shared

# Expose port 5000
EXPOSE 5000

# Health check to ensure app is running
HEALTHCHECK --interval=10s --timeout=3s --retries=6 CMD wget -qO- http://127.0.0.1:${PORT:-5000}/health || exit 1

# Start the application
CMD ["npm", "start"]
