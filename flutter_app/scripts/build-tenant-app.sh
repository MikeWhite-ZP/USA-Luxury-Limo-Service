#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FLUTTER_APP_DIR="$(dirname "$SCRIPT_DIR")"

echo "============================================"
echo "   White-Label Flutter App Builder"
echo "============================================"
echo ""

CONFIG_FILE=""
INTERACTIVE=false
BUILD_TYPE="apk"
PLATFORM="android"

show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -c, --config FILE    Path to tenant config JSON file"
    echo "  -i, --interactive    Run in interactive mode (prompts for input)"
    echo "  -p, --platform       Platform to build (android|ios|both) [default: android]"
    echo "  -t, --type           Build type (apk|appbundle|ipa) [default: apk]"
    echo "  -h, --help           Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --config tenant_config.json --platform android --type apk"
    echo "  $0 --interactive --platform both"
}

while [[ $# -gt 0 ]]; do
    case $1 in
        -c|--config)
            CONFIG_FILE="$2"
            shift 2
            ;;
        -i|--interactive)
            INTERACTIVE=true
            shift
            ;;
        -p|--platform)
            PLATFORM="$2"
            shift 2
            ;;
        -t|--type)
            BUILD_TYPE="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

if [[ -z "$CONFIG_FILE" && "$INTERACTIVE" != true ]]; then
    echo "Error: Either --config or --interactive must be specified"
    show_help
    exit 1
fi

TENANT_ID=""
COMPANY_NAME=""
APP_NAME=""
PACKAGE_ID=""
BUNDLE_ID=""
TOMTOM_API_KEY=""
PRIMARY_COLOR="#D4AF37"
SECONDARY_COLOR="#1A1A1A"
BACKGROUND_COLOR="#0D0D0D"
TEXT_COLOR="#F5F5F5"
API_BASE_URL=""
LOGO_PATH=""
ICON_PATH=""
SPLASH_LOGO_PATH=""

if [[ "$INTERACTIVE" == true ]]; then
    echo "=== Interactive Configuration ==="
    echo ""
    
    read -p "Tenant ID (e.g., my-company): " TENANT_ID
    read -p "Company Name (e.g., My Luxury Limo): " COMPANY_NAME
    read -p "App Name (short, for home screen): " APP_NAME
    
    if [[ "$PLATFORM" == "android" || "$PLATFORM" == "both" ]]; then
        read -p "Android Package ID (e.g., com.mycompany.limo): " PACKAGE_ID
    fi
    
    if [[ "$PLATFORM" == "ios" || "$PLATFORM" == "both" ]]; then
        read -p "iOS Bundle ID (e.g., com.mycompany.limo): " BUNDLE_ID
    fi
    
    read -p "TomTom API Key: " TOMTOM_API_KEY
    read -p "API Base URL (e.g., https://api.mycompany.com): " API_BASE_URL
    
    echo ""
    echo "=== Branding Colors (press Enter for defaults) ==="
    read -p "Primary Color [$PRIMARY_COLOR]: " input
    PRIMARY_COLOR="${input:-$PRIMARY_COLOR}"
    
    read -p "Secondary Color [$SECONDARY_COLOR]: " input
    SECONDARY_COLOR="${input:-$SECONDARY_COLOR}"
    
    read -p "Background Color [$BACKGROUND_COLOR]: " input
    BACKGROUND_COLOR="${input:-$BACKGROUND_COLOR}"
    
    read -p "Text Color [$TEXT_COLOR]: " input
    TEXT_COLOR="${input:-$TEXT_COLOR}"
    
    echo ""
    echo "=== Asset Files ==="
    echo "Please provide paths to your branding assets."
    echo "Assets should be PNG files with the following specifications:"
    echo "  - Icon: 1024x1024 PNG (will be resized for all platforms)"
    echo "  - Logo: Any size PNG (for splash screen, recommended 512x512)"
    echo ""
    
    read -p "App Icon Path (1024x1024 PNG): " ICON_PATH
    read -p "Splash Logo Path (optional, press Enter to use icon): " SPLASH_LOGO_PATH
    SPLASH_LOGO_PATH="${SPLASH_LOGO_PATH:-$ICON_PATH}"
    
else
    if [[ ! -f "$CONFIG_FILE" ]]; then
        echo "Error: Config file not found: $CONFIG_FILE"
        exit 1
    fi
    
    echo "Reading configuration from: $CONFIG_FILE"
    
    if ! command -v jq &> /dev/null; then
        echo "Error: jq is required for parsing JSON config"
        echo "Install with: apt-get install jq (Linux) or brew install jq (macOS)"
        exit 1
    fi
    
    TENANT_ID=$(jq -r '.tenant_id // ""' "$CONFIG_FILE")
    COMPANY_NAME=$(jq -r '.company_name // ""' "$CONFIG_FILE")
    APP_NAME=$(jq -r '.app_name // ""' "$CONFIG_FILE")
    PACKAGE_ID=$(jq -r '.package_id_android // ""' "$CONFIG_FILE")
    BUNDLE_ID=$(jq -r '.bundle_id_ios // ""' "$CONFIG_FILE")
    TOMTOM_API_KEY=$(jq -r '.tomtom_api_key // ""' "$CONFIG_FILE")
    API_BASE_URL=$(jq -r '.api.base_url // ""' "$CONFIG_FILE")
    
    PRIMARY_COLOR=$(jq -r '.branding.primary_color // "#D4AF37"' "$CONFIG_FILE")
    SECONDARY_COLOR=$(jq -r '.branding.secondary_color // "#1A1A1A"' "$CONFIG_FILE")
    BACKGROUND_COLOR=$(jq -r '.branding.background_color // "#0D0D0D"' "$CONFIG_FILE")
    TEXT_COLOR=$(jq -r '.branding.text_color // "#F5F5F5"' "$CONFIG_FILE")
    
    ICON_PATH=$(jq -r '.assets.icon_path // ""' "$CONFIG_FILE")
    SPLASH_LOGO_PATH=$(jq -r '.assets.splash_logo_path // ""' "$CONFIG_FILE")
    SPLASH_LOGO_PATH="${SPLASH_LOGO_PATH:-$ICON_PATH}"
fi

echo ""
echo "=== Configuration Summary ==="
echo "Tenant ID: $TENANT_ID"
echo "Company Name: $COMPANY_NAME"
echo "App Name: $APP_NAME"
echo "Package ID: $PACKAGE_ID"
echo "Bundle ID: $BUNDLE_ID"
echo "TomTom API Key: ${TOMTOM_API_KEY:0:10}..."
echo "API Base URL: $API_BASE_URL"
echo "Primary Color: $PRIMARY_COLOR"
echo "Platform: $PLATFORM"
echo "Build Type: $BUILD_TYPE"
echo ""

if [[ -z "$TENANT_ID" || -z "$COMPANY_NAME" || -z "$TOMTOM_API_KEY" ]]; then
    echo "Error: Missing required fields (tenant_id, company_name, tomtom_api_key)"
    exit 1
fi

cd "$FLUTTER_APP_DIR"

echo "=== Generating App Icons ==="

if [[ -n "$ICON_PATH" && -f "$ICON_PATH" ]]; then
    mkdir -p assets/tenant
    cp "$ICON_PATH" assets/tenant/icon.png
    
    cat > flutter_launcher_icons.yaml << EOF
flutter_launcher_icons:
  android: true
  ios: true
  image_path: "assets/tenant/icon.png"
  adaptive_icon_background: "$BACKGROUND_COLOR"
  adaptive_icon_foreground: "assets/tenant/icon.png"
  min_sdk_android: 21
  remove_alpha_ios: true
  web:
    generate: false
EOF
    
    flutter pub get
    dart run flutter_launcher_icons
    echo "App icons generated successfully!"
else
    echo "Warning: No icon path provided, using default icons"
fi

echo ""
echo "=== Generating Splash Screen ==="

SPLASH_IMAGE="assets/tenant/icon.png"
if [[ -n "$SPLASH_LOGO_PATH" && -f "$SPLASH_LOGO_PATH" ]]; then
    cp "$SPLASH_LOGO_PATH" assets/tenant/splash.png
    SPLASH_IMAGE="assets/tenant/splash.png"
fi

if [[ -f "$SPLASH_IMAGE" ]]; then
    cat > flutter_native_splash.yaml << EOF
flutter_native_splash:
  color: "$BACKGROUND_COLOR"
  image: "$SPLASH_IMAGE"
  color_dark: "$BACKGROUND_COLOR"
  image_dark: "$SPLASH_IMAGE"
  android: true
  ios: true
  android_12:
    color: "$BACKGROUND_COLOR"
    icon_background_color: "$BACKGROUND_COLOR"
    image: "$SPLASH_IMAGE"
EOF
    
    dart run flutter_native_splash:create
    echo "Splash screen generated successfully!"
else
    echo "Warning: No splash image available, using default splash"
fi

DART_DEFINES=(
    "--dart-define=TENANT_ID=$TENANT_ID"
    "--dart-define=COMPANY_NAME=$COMPANY_NAME"
    "--dart-define=APP_NAME=$APP_NAME"
    "--dart-define=TOMTOM_API_KEY=$TOMTOM_API_KEY"
    "--dart-define=API_BASE_URL=$API_BASE_URL"
    "--dart-define=PRIMARY_COLOR=$PRIMARY_COLOR"
    "--dart-define=SECONDARY_COLOR=$SECONDARY_COLOR"
    "--dart-define=BACKGROUND_COLOR=$BACKGROUND_COLOR"
    "--dart-define=TEXT_COLOR=$TEXT_COLOR"
)

OUTPUT_DIR="$FLUTTER_APP_DIR/build/tenant-builds/$TENANT_ID"
mkdir -p "$OUTPUT_DIR"

echo ""
echo "=== Building Application ==="

if [[ "$PLATFORM" == "android" || "$PLATFORM" == "both" ]]; then
    echo "Building Android $BUILD_TYPE..."
    
    if [[ "$BUILD_TYPE" == "appbundle" ]]; then
        flutter build appbundle --release "${DART_DEFINES[@]}"
        cp build/app/outputs/bundle/release/app-release.aab "$OUTPUT_DIR/${TENANT_ID}.aab"
        echo "Android App Bundle saved to: $OUTPUT_DIR/${TENANT_ID}.aab"
    else
        flutter build apk --release "${DART_DEFINES[@]}"
        cp build/app/outputs/flutter-apk/app-release.apk "$OUTPUT_DIR/${TENANT_ID}.apk"
        echo "Android APK saved to: $OUTPUT_DIR/${TENANT_ID}.apk"
    fi
fi

if [[ "$PLATFORM" == "ios" || "$PLATFORM" == "both" ]]; then
    echo "Building iOS..."
    flutter build ios --release --no-codesign "${DART_DEFINES[@]}"
    echo "iOS build completed. Archive from Xcode for distribution."
fi

echo ""
echo "============================================"
echo "   Build Complete!"
echo "============================================"
echo ""
echo "Output directory: $OUTPUT_DIR"
echo ""
echo "Next steps:"
echo "  - Android: Upload APK/AAB to Google Play Console"
echo "  - iOS: Open Xcode, archive and upload to App Store Connect"
echo ""
