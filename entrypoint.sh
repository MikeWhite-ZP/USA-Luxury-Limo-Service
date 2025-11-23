#!/bin/sh
set -e

echo "🚀 Starting Best Chauffeurs Application..."

# Database bağlantısını bekle
echo "⏳ Waiting for database to be ready..."
max_attempts=30
attempt=0

until nc -z database 5432 2>/dev/null; do
  attempt=$((attempt + 1))
  if [ $attempt -eq $max_attempts ]; then
    echo "❌ Database connection timeout after $max_attempts attempts"
    exit 1
  fi
  echo "⏳ Attempt $attempt/$max_attempts: Database not ready yet, waiting..."
  sleep 2
done

echo "✅ Database is ready!"

# Migration'ları çalıştır
echo "📦 Running database migrations..."
if npx drizzle-kit push; then
  echo "✅ Migrations completed successfully!"
else
  echo "❌ Migration failed!"
  echo "📋 Migration error details above"
  exit 1
fi

# Uygulamayı başlat
echo "🎯 Starting application server..."
exec node dist/index.js