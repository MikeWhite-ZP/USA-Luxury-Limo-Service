#!/bin/sh
set -e

echo "🔄 Checking database connection..."
# (İsteğe bağlı) DB'nin hazır olmasını bekleme mantığı buraya eklenebilir ama
# Coolify depends_on ile bunu zaten yönetiyor.

echo "📦 Running Database Migrations..."
# Drizzle ile şemayı veritabanına push et
# --force veya yes komutu gerekebilir, push komutu interaktiftir.
if [ "$NODE_ENV" = "production" ]; then
  # Production'da veri kaybını önlemek için migrate komutu daha güvenlidir
  # Ancak push kullanıyorsanız ve loglarda takılıyorsa:
  npx drizzle-kit push --force
else
  npx drizzle-kit push
fi

echo "✅ Migrations completed successfully."

echo "🚀 Starting Application..."
exec "$@"
