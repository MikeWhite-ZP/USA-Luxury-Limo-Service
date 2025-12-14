#!/bin/bash

# App Asset Generator
# Generates app icons and splash screens from tenant branding
#
# Prerequisites:
#   - ImageMagick (convert command)
#   - curl
#   - jq
#
# Usage:
#   ./scripts/generate-app-assets.sh [server_url] [app_type]
#
# Arguments:
#   server_url: The tenant's backend URL (e.g., https://tenant.example.com)
#   app_type: 'user' or 'admin' (default: user)

set -e

SERVER_URL="${1:-http://localhost:5000}"
APP_TYPE="${2:-user}"

echo "================================================"
echo "App Asset Generator"
echo "================================================"
echo "Server URL: $SERVER_URL"
echo "App Type: $APP_TYPE"
echo ""

# Check for ImageMagick
if ! command -v convert &> /dev/null; then
    echo "Error: ImageMagick is required. Install with:"
    echo "  macOS: brew install imagemagick"
    echo "  Ubuntu: sudo apt-get install imagemagick"
    exit 1
fi

# Fetch branding from server
echo "Fetching branding from $SERVER_URL/api/branding..."
BRANDING=$(curl -s "$SERVER_URL/api/branding")

if [ -z "$BRANDING" ] || [ "$BRANDING" == "null" ]; then
    echo "Error: Failed to fetch branding data"
    exit 1
fi

COMPANY_NAME=$(echo "$BRANDING" | jq -r '.companyName // "Luxury Limo"')
LOGO_URL=$(echo "$BRANDING" | jq -r '.logoUrl // ""')
PRIMARY_COLOR=$(echo "$BRANDING" | jq -r '.colors.primary // "#1a1a1a"')
ACCENT_COLOR=$(echo "$BRANDING" | jq -r '.colors.accent // "#d4af37"')

echo "Company: $COMPANY_NAME"
echo "Logo URL: $LOGO_URL"
echo "Primary Color: $PRIMARY_COLOR"
echo ""

# Create temp directory
TEMP_DIR=$(mktemp -d)
ASSETS_DIR="native-assets/$APP_TYPE"
mkdir -p "$ASSETS_DIR/ios" "$ASSETS_DIR/android"

# Download logo
echo "Downloading logo..."
if [[ "$LOGO_URL" == http* ]]; then
    curl -sL "$LOGO_URL" -o "$TEMP_DIR/logo.png"
elif [[ "$LOGO_URL" == /* ]]; then
    curl -sL "$SERVER_URL$LOGO_URL" -o "$TEMP_DIR/logo.png"
else
    echo "Warning: Invalid logo URL, using placeholder"
    convert -size 512x512 xc:white -fill "$PRIMARY_COLOR" -gravity center -pointsize 100 -annotate 0 "LOGO" "$TEMP_DIR/logo.png"
fi

# Set background color based on app type
if [ "$APP_TYPE" == "admin" ]; then
    BG_COLOR="#0f172a"
    ICON_BG="#1e3a8a"
else
    BG_COLOR="#ffffff"
    ICON_BG="#ffffff"
fi

echo "Generating iOS icons..."
# iOS App Icon sizes
IOS_SIZES=(20 29 40 58 60 76 80 87 120 152 167 180 1024)
for size in "${IOS_SIZES[@]}"; do
    convert "$TEMP_DIR/logo.png" -resize "${size}x${size}" -gravity center -background "$ICON_BG" -extent "${size}x${size}" "$ASSETS_DIR/ios/icon-${size}.png"
done

echo "Generating Android icons..."
# Android icon sizes (mipmap directories)
declare -A ANDROID_SIZES=(
    ["mdpi"]=48
    ["hdpi"]=72
    ["xhdpi"]=96
    ["xxhdpi"]=144
    ["xxxhdpi"]=192
)
for density in "${!ANDROID_SIZES[@]}"; do
    size=${ANDROID_SIZES[$density]}
    mkdir -p "$ASSETS_DIR/android/mipmap-$density"
    convert "$TEMP_DIR/logo.png" -resize "${size}x${size}" -gravity center -background "$ICON_BG" -extent "${size}x${size}" "$ASSETS_DIR/android/mipmap-$density/ic_launcher.png"
    
    # Round icon
    convert "$TEMP_DIR/logo.png" -resize "${size}x${size}" \
        \( +clone -threshold -1 -negate -fill white -draw "circle $((size/2)),$((size/2)) $((size/2)),0" \) \
        -alpha off -compose copy_opacity -composite \
        "$ASSETS_DIR/android/mipmap-$density/ic_launcher_round.png" 2>/dev/null || \
        cp "$ASSETS_DIR/android/mipmap-$density/ic_launcher.png" "$ASSETS_DIR/android/mipmap-$density/ic_launcher_round.png"
done

echo "Generating splash screens..."
# iOS splash screen sizes
IOS_SPLASH_SIZES=("1125x2436" "1242x2688" "828x1792" "1242x2208" "750x1334" "640x1136" "2048x2732" "1668x2388" "1536x2048")
for splash_size in "${IOS_SPLASH_SIZES[@]}"; do
    width=$(echo "$splash_size" | cut -d'x' -f1)
    height=$(echo "$splash_size" | cut -d'x' -f2)
    logo_size=$((width / 3))
    
    convert -size "${width}x${height}" xc:"$BG_COLOR" \
        \( "$TEMP_DIR/logo.png" -resize "${logo_size}x${logo_size}" \) \
        -gravity center -composite \
        "$ASSETS_DIR/ios/splash-${splash_size}.png"
done

# Android splash screen
for density in "${!ANDROID_SIZES[@]}"; do
    mkdir -p "$ASSETS_DIR/android/drawable-$density"
    
    case $density in
        mdpi) splash_width=320; splash_height=480 ;;
        hdpi) splash_width=480; splash_height=800 ;;
        xhdpi) splash_width=720; splash_height=1280 ;;
        xxhdpi) splash_width=1080; splash_height=1920 ;;
        xxxhdpi) splash_width=1440; splash_height=2560 ;;
    esac
    
    logo_size=$((splash_width / 3))
    
    convert -size "${splash_width}x${splash_height}" xc:"$BG_COLOR" \
        \( "$TEMP_DIR/logo.png" -resize "${logo_size}x${logo_size}" \) \
        -gravity center -composite \
        "$ASSETS_DIR/android/drawable-$density/splash.png"
done

# Cleanup
rm -rf "$TEMP_DIR"

echo ""
echo "================================================"
echo "Assets generated successfully!"
echo "================================================"
echo ""
echo "Generated assets in: $ASSETS_DIR"
echo ""
echo "iOS assets: $ASSETS_DIR/ios/"
ls -la "$ASSETS_DIR/ios/" | head -10
echo ""
echo "Android assets: $ASSETS_DIR/android/"
find "$ASSETS_DIR/android/" -type f | head -10
echo ""
echo "Next steps:"
echo "1. Copy iOS icons to: ios/App/App/Assets.xcassets/AppIcon.appiconset/"
echo "2. Copy iOS splash screens to: ios/App/App/Assets.xcassets/Splash.imageset/"
echo "3. Copy Android icons to: android/app/src/main/res/"
echo "4. Copy Android splash to: android/app/src/main/res/"
