#!/bin/bash

# Native App Build Script
# Builds iOS and Android apps for a specific tenant with dynamic branding
#
# Usage:
#   ./scripts/build-native-app.sh [app_type] [platform] [tenant_config]
#
# Arguments:
#   app_type: 'user' or 'admin' (default: user)
#   platform: 'ios', 'android', or 'both' (default: both)
#   tenant_config: path to tenant config JSON file (optional)
#
# Environment Variables:
#   CAPACITOR_APP_ID: App bundle ID (e.g., com.company.app)
#   CAPACITOR_APP_NAME: Display name for the app
#   CAPACITOR_SERVER_URL: Backend server URL for the tenant
#
# Examples:
#   ./scripts/build-native-app.sh user ios
#   ./scripts/build-native-app.sh admin android
#   CAPACITOR_APP_ID=com.acme.limo CAPACITOR_APP_NAME="ACME Limo" ./scripts/build-native-app.sh user both

set -e

APP_TYPE="${1:-user}"
PLATFORM="${2:-both}"
TENANT_CONFIG="${3:-}"

echo "================================================"
echo "Native App Build Script"
echo "================================================"
echo "App Type: $APP_TYPE"
echo "Platform: $PLATFORM"
echo ""

# Load tenant config if provided
if [ -n "$TENANT_CONFIG" ] && [ -f "$TENANT_CONFIG" ]; then
    echo "Loading tenant config from: $TENANT_CONFIG"
    export CAPACITOR_APP_ID=$(jq -r '.appId // empty' "$TENANT_CONFIG")
    export CAPACITOR_APP_NAME=$(jq -r '.appName // empty' "$TENANT_CONFIG")
    export CAPACITOR_SERVER_URL=$(jq -r '.serverUrl // empty' "$TENANT_CONFIG")
fi

# Validate app type
if [ "$APP_TYPE" != "user" ] && [ "$APP_TYPE" != "admin" ]; then
    echo "Error: Invalid app type. Use 'user' or 'admin'"
    exit 1
fi

# Set config file based on app type
if [ "$APP_TYPE" == "admin" ]; then
    CONFIG_FILE="capacitor.config.admin.ts"
    DEFAULT_APP_ID="${CAPACITOR_APP_ID:-com.luxurylimo.admin}"
    DEFAULT_APP_NAME="${CAPACITOR_APP_NAME:-Luxury Limo Admin}"
else
    CONFIG_FILE="capacitor.config.user.ts"
    DEFAULT_APP_ID="${CAPACITOR_APP_ID:-com.luxurylimo.user}"
    DEFAULT_APP_NAME="${CAPACITOR_APP_NAME:-Luxury Limo}"
fi

# Export defaults if not set
export CAPACITOR_APP_ID="${CAPACITOR_APP_ID:-$DEFAULT_APP_ID}"
export CAPACITOR_APP_NAME="${CAPACITOR_APP_NAME:-$DEFAULT_APP_NAME}"

echo "App ID: $CAPACITOR_APP_ID"
echo "App Name: $CAPACITOR_APP_NAME"
echo "Server URL: ${CAPACITOR_SERVER_URL:-'(embedded)'}"
echo "Config File: $CONFIG_FILE"
echo ""

# Set Vite environment variables for the build
# These are injected into the client bundle at build time
export VITE_TENANT_SERVER_URL="${CAPACITOR_SERVER_URL:-}"
export VITE_APP_TYPE="$APP_TYPE"
export VITE_IS_NATIVE_BUILD="true"

# Build the web app with tenant-specific configuration
echo "Building web application..."
echo "  VITE_TENANT_SERVER_URL: $VITE_TENANT_SERVER_URL"
echo "  VITE_APP_TYPE: $VITE_APP_TYPE"
npm run build

# Inject runtime configuration into the built HTML
# This provides a fallback for runtime configuration
if [ -n "$CAPACITOR_SERVER_URL" ]; then
    echo "Injecting runtime configuration..."
    RUNTIME_CONFIG="{\"tenantServerUrl\":\"$CAPACITOR_SERVER_URL\",\"appId\":\"$CAPACITOR_APP_ID\",\"appName\":\"$CAPACITOR_APP_NAME\",\"isAdmin\":$([ \"$APP_TYPE\" == \"admin\" ] && echo \"true\" || echo \"false\")}"
    
    # Inject config script into index.html
    if [ -f "dist/public/index.html" ]; then
        # Create a script tag to inject before </head>
        CONFIG_SCRIPT="<script>window.__NATIVE_CONFIG__=$RUNTIME_CONFIG;</script>"
        sed -i.bak "s|</head>|$CONFIG_SCRIPT</head>|" dist/public/index.html
        rm -f dist/public/index.html.bak
        echo "Runtime configuration injected into index.html"
    fi
fi

# Copy the correct config file
echo "Setting up Capacitor config..."
cp "$CONFIG_FILE" capacitor.config.ts

# Sync with Capacitor
echo "Syncing with Capacitor..."
npx cap sync

# Build for platforms
build_ios() {
    echo ""
    echo "Building iOS app..."
    echo "================================================"
    
    if [ ! -d "ios" ]; then
        echo "Adding iOS platform..."
        npx cap add ios
    fi
    
    npx cap sync ios
    npx cap copy ios
    
    echo ""
    echo "iOS build prepared. Open in Xcode to complete build:"
    echo "  npx cap open ios"
    echo ""
    echo "Or build from command line:"
    echo "  cd ios/App && xcodebuild -workspace App.xcworkspace -scheme App -configuration Release"
}

build_android() {
    echo ""
    echo "Building Android app..."
    echo "================================================"
    
    if [ ! -d "android" ]; then
        echo "Adding Android platform..."
        npx cap add android
    fi
    
    npx cap sync android
    npx cap copy android
    
    echo ""
    echo "Android build prepared. Open in Android Studio to complete build:"
    echo "  npx cap open android"
    echo ""
    echo "Or build from command line:"
    echo "  cd android && ./gradlew assembleRelease"
}

case "$PLATFORM" in
    ios)
        build_ios
        ;;
    android)
        build_android
        ;;
    both)
        build_ios
        build_android
        ;;
    *)
        echo "Error: Invalid platform. Use 'ios', 'android', or 'both'"
        exit 1
        ;;
esac

echo ""
echo "================================================"
echo "Build preparation complete!"
echo "================================================"
echo ""
echo "Next steps:"
echo "1. Generate app icons and splash screens using tenant branding"
echo "2. Open the native project in Xcode/Android Studio"
echo "3. Configure signing certificates"
echo "4. Build and submit to app stores"
