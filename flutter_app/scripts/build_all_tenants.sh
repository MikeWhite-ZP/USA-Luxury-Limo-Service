#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

usage() {
    echo "Usage: $0 <tenants_config_file>"
    echo ""
    echo "The tenants config file should be a JSON file with the following structure:"
    echo '['
    echo '  {'
    echo '    "slug": "acme",'
    echo '    "api_base_url": "https://api.acme.com"'
    echo '  },'
    echo '  {'
    echo '    "slug": "luxury",'
    echo '    "api_base_url": "https://api.luxurylimo.com"'
    echo '  }'
    echo ']'
    exit 1
}

if [[ -z "$1" ]]; then
    usage
fi

CONFIG_FILE="$1"

if [[ ! -f "$CONFIG_FILE" ]]; then
    echo "Error: Config file not found: $CONFIG_FILE"
    exit 1
fi

if ! command -v jq &> /dev/null; then
    echo "Error: jq is required to parse the config file"
    echo "Install with: brew install jq (macOS) or apt-get install jq (Linux)"
    exit 1
fi

TENANT_COUNT=$(jq length "$CONFIG_FILE")

echo "=========================================="
echo "Building apps for $TENANT_COUNT tenant(s)"
echo "=========================================="
echo ""

for ((i=0; i<TENANT_COUNT; i++)); do
    SLUG=$(jq -r ".[$i].slug" "$CONFIG_FILE")
    API_URL=$(jq -r ".[$i].api_base_url" "$CONFIG_FILE")
    
    echo ""
    echo "----------------------------------------"
    echo "Tenant: $SLUG"
    echo "API URL: $API_URL"
    echo "----------------------------------------"
    
    echo "Building User App (Android)..."
    "$SCRIPT_DIR/build_app.sh" user android "$SLUG" "$API_URL"
    
    echo "Building User App (iOS)..."
    "$SCRIPT_DIR/build_app.sh" user ios "$SLUG" "$API_URL"
    
    echo "Building Admin App (Android)..."
    "$SCRIPT_DIR/build_app.sh" admin android "$SLUG" "$API_URL"
    
    echo "Building Admin App (iOS)..."
    "$SCRIPT_DIR/build_app.sh" admin ios "$SLUG" "$API_URL"
    
    echo ""
    echo "Completed builds for tenant: $SLUG"
done

echo ""
echo "=========================================="
echo "All builds completed!"
echo "=========================================="
