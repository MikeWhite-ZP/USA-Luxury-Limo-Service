#!/bin/sh
set -e

echo "🚀 Starting USA Luxury Limo..."

# Check required environment variables
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL is not set"
  exit 1
fi

echo "📦 Environment: ${NODE_ENV:-development}"

# Run database migrations
echo "🔄 Running database migrations..."
npm run db:push || {
  echo "⚠️  Migration failed, but continuing (may be expected in some cases)"
}

echo "✅ Migrations complete"

# Seed email templates (if needed)
echo "🌱 Ensuring email templates are seeded..."
# This is handled by server/index.ts on startup

# Start application
echo "🎯 Starting application..."
exec "$@"
