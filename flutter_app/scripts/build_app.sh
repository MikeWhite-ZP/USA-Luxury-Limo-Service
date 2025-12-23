#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

APP_TYPE="${1:-user}"
PLATFORM="${2:-android}"
TENANT_SLUG="${3:-default}"
API_BASE_URL="${4:-https://api.usaluxurylimo.com}"
FLAVOR="${5:-production}"
BUILD_TYPE="${6:-release}"

usage() {
    echo "Usage: $0 <app_type> <platform> <tenant_slug> <api_base_url> [flavor] [build_type]"
    echo ""
    echo "Arguments:"
    echo "  app_type     : user | admin"
    echo "  platform     : android | ios"
    echo "  tenant_slug  : Unique identifier for the tenant (e.g., 'acme', 'luxury')"
    echo "  api_base_url : Backend API URL (e.g., 'https://api.acme.com')"
    echo "  flavor       : development | staging | production (default: production)"
    echo "  build_type   : debug | release (default: release)"
    echo ""
    echo "Examples:"
    echo "  $0 user android acme https://api.acme.com"
    echo "  $0 admin ios luxury https://api.luxurylimo.com production release"
    echo "  $0 user android default https://api.usaluxurylimo.com development debug"
    exit 1
}

if [[ "$APP_TYPE" != "user" && "$APP_TYPE" != "admin" ]]; then
    echo "Error: app_type must be 'user' or 'admin'"
    usage
fi

if [[ "$PLATFORM" != "android" && "$PLATFORM" != "ios" ]]; then
    echo "Error: platform must be 'android' or 'ios'"
    usage
fi

if [[ "$FLAVOR" != "development" && "$FLAVOR" != "staging" && "$FLAVOR" != "production" ]]; then
    echo "Error: flavor must be 'development', 'staging', or 'production'"
    usage
fi

if [[ "$BUILD_TYPE" != "debug" && "$BUILD_TYPE" != "release" ]]; then
    echo "Error: build_type must be 'debug' or 'release'"
    usage
fi

if [[ "$APP_TYPE" == "user" ]]; then
    APP_DIR="$PROJECT_DIR/apps/user_app"
    APP_NAME="${TENANT_SLUG}_user_app"
else
    APP_DIR="$PROJECT_DIR/apps/admin_app"
    APP_NAME="${TENANT_SLUG}_admin_app"
fi

OUTPUT_DIR="$PROJECT_DIR/build/output/${TENANT_SLUG}/${APP_TYPE}"
mkdir -p "$OUTPUT_DIR"

echo "=========================================="
echo "Building Flutter App"
echo "=========================================="
echo "App Type:     $APP_TYPE"
echo "Platform:     $PLATFORM"
echo "Tenant:       $TENANT_SLUG"
echo "API URL:      $API_BASE_URL"
echo "Flavor:       $FLAVOR"
echo "Build Type:   $BUILD_TYPE"
echo "Output Dir:   $OUTPUT_DIR"
echo "=========================================="

cd "$APP_DIR"

echo ""
echo "Step 1: Getting dependencies..."
flutter pub get

if [[ "$PLATFORM" == "android" ]]; then
    echo ""
    echo "Step 2: Building Android APK..."
    
    if [[ "$BUILD_TYPE" == "release" ]]; then
        flutter build apk --release \
            --dart-define=TENANT_SLUG="$TENANT_SLUG" \
            --dart-define=API_BASE_URL="$API_BASE_URL" \
            --dart-define=FLAVOR="$FLAVOR"
        
        APK_PATH="$APP_DIR/build/app/outputs/flutter-apk/app-release.apk"
        OUTPUT_FILE="$OUTPUT_DIR/${APP_NAME}-${FLAVOR}.apk"
    else
        flutter build apk --debug \
            --dart-define=TENANT_SLUG="$TENANT_SLUG" \
            --dart-define=API_BASE_URL="$API_BASE_URL" \
            --dart-define=FLAVOR="$FLAVOR"
        
        APK_PATH="$APP_DIR/build/app/outputs/flutter-apk/app-debug.apk"
        OUTPUT_FILE="$OUTPUT_DIR/${APP_NAME}-${FLAVOR}-debug.apk"
    fi
    
    if [[ -f "$APK_PATH" ]]; then
        cp "$APK_PATH" "$OUTPUT_FILE"
        echo ""
        echo "Build successful!"
        echo "APK saved to: $OUTPUT_FILE"
    else
        echo "Error: APK not found at expected path"
        exit 1
    fi

elif [[ "$PLATFORM" == "ios" ]]; then
    echo ""
    echo "Step 2: Building iOS..."
    
    if ! command -v xcodebuild &> /dev/null; then
        echo "Warning: xcodebuild not found. iOS builds require macOS with Xcode installed."
        echo "Generating iOS build files instead..."
        
        flutter build ios --no-codesign \
            --dart-define=TENANT_SLUG="$TENANT_SLUG" \
            --dart-define=API_BASE_URL="$API_BASE_URL" \
            --dart-define=FLAVOR="$FLAVOR"
        
        echo ""
        echo "iOS project files generated at: $APP_DIR/build/ios"
        echo "To complete the build, open the project in Xcode on a Mac."
    else
        if [[ "$BUILD_TYPE" == "release" ]]; then
            flutter build ipa \
                --dart-define=TENANT_SLUG="$TENANT_SLUG" \
                --dart-define=API_BASE_URL="$API_BASE_URL" \
                --dart-define=FLAVOR="$FLAVOR"
            
            IPA_PATH="$APP_DIR/build/ios/ipa/*.ipa"
            OUTPUT_FILE="$OUTPUT_DIR/${APP_NAME}-${FLAVOR}.ipa"
            
            if [[ -f $IPA_PATH ]]; then
                cp $IPA_PATH "$OUTPUT_FILE"
                echo ""
                echo "Build successful!"
                echo "IPA saved to: $OUTPUT_FILE"
            fi
        else
            flutter build ios --debug --no-codesign \
                --dart-define=TENANT_SLUG="$TENANT_SLUG" \
                --dart-define=API_BASE_URL="$API_BASE_URL" \
                --dart-define=FLAVOR="$FLAVOR"
            
            echo ""
            echo "Debug build completed."
            echo "Use Xcode to run on simulator or device."
        fi
    fi
fi

echo ""
echo "=========================================="
echo "Build Complete!"
echo "=========================================="
