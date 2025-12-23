#!/bin/bash
set -e

echo "🚀 Bootstrapping USA Luxury Limo Flutter App..."
echo ""

# Root package
echo "📦 Root package..."
flutter pub get

# Apps
echo ""
echo "📱 Apps..."
for app in apps/*/; do
  if [ -f "${app}pubspec.yaml" ]; then
    echo "  → $(basename "$app")"
    (cd "$app" && flutter pub get)
  fi
done

# Core packages
echo ""
echo "🔧 Core packages..."
for pkg in packages/*/; do
  if [ -f "${pkg}pubspec.yaml" ]; then
    echo "  → $(basename "$pkg")"
    (cd "$pkg" && flutter pub get)
  fi
done

# Feature packages
echo ""
echo "✨ Feature packages..."
for feature in packages/features/*/; do
  if [ -f "${feature}pubspec.yaml" ]; then
    echo "  → $(basename "$feature")"
    (cd "$feature" && flutter pub get)
  fi
done

echo ""
echo "✅ Bootstrap complete!"
