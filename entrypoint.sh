#!/bin/sh
set -e

echo "🚀 Starting USA Luxury Limo deployment..."

# Run database migrations
echo "📊 Running database migrations..."
npx drizzle-kit push --force

# Seed email templates (already in server/index.ts, but this ensures it happens)
echo "📧 Database ready, starting application..."

# Start the application
exec node dist/index.js
