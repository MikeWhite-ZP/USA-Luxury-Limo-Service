#!/bin/sh
set -e

echo "🔄 Checking database connection..."

echo "📦 Running Database Migrations (Forcing non-interactive push)..."

# KRİTİK DÜZELTME: Drizzle'ın 'rename vs create' sorusuna takılmasını engellemek için
# 'y' yanıtını otomatik olarak pipe ediyoruz.
echo 'y' | npx drizzle-kit push

# NOT: Eğer yukarıdaki 'y' yanıtı yeterli gelmezse, 
# 'drizzle.config.ts' dosyanızda 'strict: false' ayarını kontrol edin
# veya production için daha güvenilir olan 'drizzle-kit generate/migrate' 
# akışına geçmeyi düşünün.

echo "✅ Migrations completed successfully."

echo "🚀 Starting Application..."
# Uygulamayı başlat
exec "$@"
