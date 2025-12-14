# Native App Build Guide

This guide explains how to build iOS and Android native apps from the PWA with dynamic tenant branding support.

## Overview

The application supports building two types of native apps:
1. **User App** - For passengers, drivers, and dispatchers
2. **Admin App** - For administrators (separate app with distinct identity)

Both apps feature dynamic branding that fetches company name, logo, and colors from the tenant's backend server on startup.

## Prerequisites

### Development Environment
- Node.js 18+ and npm
- For iOS: macOS with Xcode 15+, CocoaPods
- For Android: Android Studio with SDK 33+, JDK 17+

### Build Tools
- ImageMagick (for generating app icons and splash screens)
  ```bash
  # macOS
  brew install imagemagick
  
  # Ubuntu/Debian
  sudo apt-get install imagemagick
  ```
- jq (for parsing JSON configurations)
  ```bash
  # macOS
  brew install jq
  
  # Ubuntu/Debian
  sudo apt-get install jq
  ```

## Quick Start

### 1. Build User App for Both Platforms
```bash
./scripts/build-native-app.sh user both
```

### 2. Build Admin App for iOS Only
```bash
./scripts/build-native-app.sh admin ios
```

### 3. Build with Custom Tenant Configuration
```bash
CAPACITOR_APP_ID="com.mycompany.limo" \
CAPACITOR_APP_NAME="My Limo Service" \
CAPACITOR_SERVER_URL="https://api.mylimo.com" \
./scripts/build-native-app.sh user both
```

### 4. Build Using Tenant Config File
```bash
./scripts/build-native-app.sh user both ./tenants/mycompany.json
```

## Configuration Files

### capacitor.config.user.ts
Configuration for the User/Passenger app. Uses light theme with brand colors.

### capacitor.config.admin.ts
Configuration for the Admin app. Uses dark blue theme for distinct identity.

### Tenant Config JSON Structure
```json
{
  "tenantId": "tenant-slug",
  "appId": "com.company.app",
  "appName": "Company Name",
  "serverUrl": "https://api.company.com",
  "adminAppId": "com.company.admin",
  "adminAppName": "Company Admin"
}
```

## Dynamic Branding

The native apps fetch branding information from the `/api/branding` endpoint on startup:

```json
{
  "companyName": "Company Name",
  "tagline": "Company Tagline",
  "logoUrl": "/path/to/logo.png",
  "colors": {
    "primary": "#1a1a1a",
    "secondary": "#666666",
    "accent": "#d4af37"
  }
}
```

### How It Works

1. **Build-Time Injection**: The build script injects `VITE_TENANT_SERVER_URL` environment variable and a `window.__NATIVE_CONFIG__` runtime object into the built bundle
2. **Native Splash Screen**: Shows a loading indicator while fetching branding from the tenant's server
3. **Branding Service**: Fetches from the injected server URL and caches branding data for 24 hours
4. **Dynamic UI**: Logo, company name, and colors update throughout the app
5. **Offline Support**: Cached branding persists when offline

### Configuration Resolution Order

The native branding service resolves the API base URL in this order:
1. Explicitly passed `serverUrl` parameter
2. `window.__NATIVE_CONFIG__.tenantServerUrl` (runtime injection)
3. `VITE_TENANT_SERVER_URL` environment variable (build-time injection)
4. `localStorage.tenant_server_url` (user preference)
5. `window.location.origin` (web only, not applicable in native)

### Client-Side Implementation

```typescript
import { initializeNativeApp, hideSplashScreen } from '@/lib/nativeBranding';

// On app startup
const branding = await initializeNativeApp(serverUrl);
// branding contains: companyName, logoUrl, colors, etc.
```

## Generating App Assets

Generate app icons and splash screens from tenant branding:

```bash
# Generate from local server
./scripts/generate-app-assets.sh http://localhost:5000 user

# Generate for production tenant
./scripts/generate-app-assets.sh https://api.tenant.com admin
```

This creates:
- iOS app icons (all required sizes)
- Android app icons (all densities, including round icons)
- Splash screens for both platforms

### Installing Generated Assets

After generating assets, copy them to the native projects:

**iOS:**
```bash
cp native-assets/user/ios/icon-*.png ios/App/App/Assets.xcassets/AppIcon.appiconset/
cp native-assets/user/ios/splash-*.png ios/App/App/Assets.xcassets/Splash.imageset/
```

**Android:**
```bash
cp -r native-assets/user/android/mipmap-* android/app/src/main/res/
cp -r native-assets/user/android/drawable-* android/app/src/main/res/
```

## Building for App Stores

### iOS App Store

1. Open in Xcode:
   ```bash
   npx cap open ios
   ```

2. Configure signing:
   - Select your development team
   - Set bundle identifier
   - Configure provisioning profiles

3. Archive and submit:
   - Product → Archive
   - Distribute App → App Store Connect

### Google Play Store

1. Open in Android Studio:
   ```bash
   npx cap open android
   ```

2. Configure signing:
   - Create or use existing keystore
   - Configure in `android/app/build.gradle`

3. Build release APK/AAB:
   ```bash
   cd android
   ./gradlew bundleRelease
   ```

4. Submit the AAB file to Google Play Console

## Multi-Tenant Deployment

For deploying apps for multiple tenants:

### 1. Create Tenant Config Files
```
tenants/
  tenant-a.json
  tenant-b.json
  tenant-c.json
```

### 2. Build Script for All Tenants
```bash
#!/bin/bash
for config in tenants/*.json; do
  tenant_id=$(jq -r '.tenantId' "$config")
  echo "Building for tenant: $tenant_id"
  
  # User app
  ./scripts/build-native-app.sh user both "$config"
  mkdir -p "builds/$tenant_id/user"
  cp -r ios android "builds/$tenant_id/user/"
  
  # Admin app
  ./scripts/build-native-app.sh admin both "$config"
  mkdir -p "builds/$tenant_id/admin"
  cp -r ios android "builds/$tenant_id/admin/"
done
```

### 3. Automated CI/CD Pipeline

Example GitHub Actions workflow:
```yaml
name: Build Native Apps

on:
  workflow_dispatch:
    inputs:
      tenant:
        description: 'Tenant ID'
        required: true
      platform:
        description: 'Platform (ios/android/both)'
        default: 'both'

jobs:
  build:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build native app
        run: |
          ./scripts/build-native-app.sh user ${{ inputs.platform }} tenants/${{ inputs.tenant }}.json
```

## Troubleshooting

### Common Issues

**1. Capacitor sync fails**
```bash
npx cap sync --force
```

**2. iOS build fails with signing error**
- Ensure Xcode is signed in with Apple Developer account
- Check provisioning profiles in Xcode preferences

**3. Android build fails with SDK error**
- Ensure Android SDK 33 is installed
- Set `ANDROID_HOME` environment variable

**4. Branding not loading**
- Check server URL is accessible from the device
- Verify `/api/branding` endpoint returns valid JSON
- Clear app cache and restart

### Debug Mode

Enable debug logging in native apps:
```bash
CAPACITOR_DEBUG=true ./scripts/build-native-app.sh user ios
```

## File Structure

```
├── capacitor.config.ts          # Active Capacitor config
├── capacitor.config.user.ts     # User app config template
├── capacitor.config.admin.ts    # Admin app config template
├── client/src/
│   ├── lib/
│   │   └── nativeBranding.ts    # Branding service for native apps
│   └── components/
│       └── NativeSplash.tsx     # Dynamic splash screen component
├── scripts/
│   ├── build-native-app.sh      # Main build script
│   ├── generate-app-assets.sh   # Asset generation script
│   └── tenant-config.example.json
├── ios/                         # iOS native project
├── android/                     # Android native project
└── native-assets/              # Generated icons and splash screens
```
