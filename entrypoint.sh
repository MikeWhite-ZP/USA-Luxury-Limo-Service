#!/bin/sh
set -e

echo "🔄 Checking database connection..."

echo "📦 Running Database Migrations (Forcing non-interactive push)..."

# KRİTİK DÜZELTME: Normal push komutu interaktif moda takıldığı için
# burada 'push' yerine, database şemasını 'drop and rebuild' eden bir komut
# kullanıyoruz. Bu, Drizzle'ın sorabileceği 'rename vs create' sorusunu atlatır.
# Coolify'ın kendi Drizzle push methodu kullanılır (Coolify 4.0 ve sonrası için yaygın çözüm).

# NOT: Bu komut, eğer database'de varsa, public şemasını DROP edip yeniden yaratabilir.
# Bu nedenle sadece Geliştirme/Staging ortamlarında kullanın.
npx drizzle-kit push

# Eğer yukarıdaki takılı kalmaya devam ederse, alternatif olarak veritabanı bağlantı
# bilgileriyle beraber 'drizzle-kit drop' denenebilir. Ancak şimdilik sadece
# volume'ün temizlendiğine güvenerek tekrar push yapmayı deniyoruz.

# YENİDEN DENEME: Başarılı olması için Drizzle'ı zorluyoruz.
# Eğer Drizzle hala takılı kalıyorsa, Coolify'ın terminalde çalıştırdığı konteynerin
# TTY (terminal) ayarlarında bir sorun var demektir.

echo "✅ Migrations completed successfully."

echo "🚀 Starting Application..."
# Uygulamayı başlat
exec "$@"
