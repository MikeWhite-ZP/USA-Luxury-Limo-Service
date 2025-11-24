FROM node:20-alpine

WORKDIR /app

# Install dependencies needed for build and runtime
RUN apk add --no-cache python3 make g++ curl

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Prune dev dependencies to save space (optional, remove if causes issues)
# RUN npm prune --production

# Copy entrypoint script and make it executable
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Expose port
EXPOSE 5000

# Environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Use the entrypoint script
ENTRYPOINT ["/app/entrypoint.sh"]

# Start the application (passed to exec "$@" in entrypoint)
CMD ["node", "dist/index.js"]
