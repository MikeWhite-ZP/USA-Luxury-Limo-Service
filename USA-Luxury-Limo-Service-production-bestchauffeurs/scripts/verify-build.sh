#!/bin/bash
# Build Verification Script
# This script verifies that the production build completed successfully

echo "🔍 Verifying production build..."

# Check if dist directory exists
if [ ! -d "dist" ]; then
    echo "❌ ERROR: dist directory not found!"
    exit 1
fi

# Check if dist/public exists
if [ ! -d "dist/public" ]; then
    echo "❌ ERROR: dist/public directory not found!"
    exit 1
fi

# Check if dist/index.js exists (backend)
if [ ! -f "dist/index.js" ]; then
    echo "❌ ERROR: dist/index.js not found!"
    exit 1
fi

# Check if dist/public/index.html exists
if [ ! -f "dist/public/index.html" ]; then
    echo "❌ ERROR: dist/public/index.html not found!"
    exit 1
fi

# Check if dist/public/assets exists and has files
if [ ! -d "dist/public/assets" ] || [ -z "$(ls -A dist/public/assets)" ]; then
    echo "❌ ERROR: dist/public/assets directory is missing or empty!"
    exit 1
fi

# Count JS and CSS files in assets
JS_COUNT=$(find dist/public/assets -name "*.js" | wc -l)
CSS_COUNT=$(find dist/public/assets -name "*.css" | wc -l)

echo "✅ Backend build: dist/index.js exists"
echo "✅ Frontend build: dist/public/index.html exists"
echo "✅ Assets build: $JS_COUNT JS files, $CSS_COUNT CSS files"

# List all built assets for verification
echo ""
echo "📦 Built assets:"
ls -lh dist/public/assets/ | grep -E '\.(js|css)$' | head -20

echo ""
echo "✅ Build verification PASSED!"
exit 0
