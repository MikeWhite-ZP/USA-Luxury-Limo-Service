# USA Luxury Limo - Flutter Mobile App

A premium chauffeur and limo booking service mobile application built with Flutter.

## Features

- **Luxury Dark Theme** - Premium design with customizable colors
- **TomTom Maps Integration** - High-quality maps with dark theme tiles
- **White-Label Support** - Build branded apps for multiple tenants
- **Map-based Booking** - Select pickup and dropoff locations on map with place search
- **Vehicle Selection** - Browse and select from available luxury vehicles
- **Booking Confirmation** - Complete booking with date, time, and passenger details
- **Ride History** - View upcoming and past rides
- **User Profile** - Manage account settings and preferences

## Architecture

This project follows **Clean Architecture** principles:

```
lib/
├── core/
│   ├── theme/          # App theme, colors, typography
│   ├── maps/           # TomTom map provider
│   ├── constants/      # Tenant config, API constants
│   ├── network/        # API client, interceptors
│   └── utils/          # Validators, extensions
├── features/
│   ├── auth/           # Login, register, splash screens
│   ├── home/           # Home screen with map
│   ├── booking/        # Vehicle selection, booking confirmation
│   ├── rides/          # Ride history
│   └── profile/        # User profile
└── shared/
    ├── widgets/        # Reusable UI components
    ├── models/         # Data models
    └── providers/      # App-wide providers
```

## Tech Stack

- **Flutter** (latest stable)
- **Riverpod** - State management
- **Dio** - HTTP client
- **Go Router** - Navigation
- **TomTom Maps** - Map provider with flutter_map
- **flutter_launcher_icons** - App icon generation
- **flutter_native_splash** - Splash screen generation

## Getting Started

### Prerequisites

- Flutter SDK (>=3.0.0)
- Android Studio / Xcode
- TomTom API Key
- jq (for JSON parsing in build scripts)

### Quick Start (Default Branding)

```bash
cd flutter_app
flutter pub get
flutter run --dart-define=TOMTOM_API_KEY=your_tomtom_api_key
```

## White-Label Build System

Build branded apps for different tenants with custom logos, colors, and API keys.

### Option 1: Interactive Mode

Run the build script and answer the prompts:

```bash
./scripts/build-tenant-app.sh --interactive --platform android
```

You'll be asked for:
- Tenant ID (e.g., `my-company`)
- Company Name (e.g., `My Luxury Limo`)
- App Name (short name for home screen)
- Package ID (e.g., `com.mycompany.limo`)
- TomTom API Key
- API Base URL
- Branding colors (optional, has defaults)
- App icon file path (1024x1024 PNG)
- Splash logo path (optional)

### Option 2: Config File Mode

1. Create a tenant configuration file:

```json
{
  "tenant_id": "my-company",
  "company_name": "My Luxury Limo",
  "app_name": "My Limo",
  "package_id_android": "com.mycompany.limo",
  "bundle_id_ios": "com.mycompany.limo",
  "tomtom_api_key": "YOUR_TOMTOM_API_KEY",
  "branding": {
    "primary_color": "#D4AF37",
    "secondary_color": "#1A1A1A",
    "background_color": "#0D0D0D",
    "text_color": "#F5F5F5"
  },
  "assets": {
    "icon_path": "./my-assets/icon.png",
    "splash_logo_path": "./my-assets/splash.png"
  },
  "api": {
    "base_url": "https://api.mycompany.com"
  }
}
```

2. Run the build:

```bash
./scripts/build-tenant-app.sh --config my-tenant-config.json --platform android --type apk
```

### Build Options

| Option | Description |
|--------|-------------|
| `-c, --config FILE` | Path to tenant config JSON file |
| `-i, --interactive` | Run in interactive mode |
| `-p, --platform` | Platform: `android`, `ios`, or `both` |
| `-t, --type` | Build type: `apk` or `appbundle` |

### Asset Requirements

| Asset | Size | Format | Description |
|-------|------|--------|-------------|
| App Icon | 1024x1024 | PNG | Main app icon (will be resized) |
| Splash Logo | 512x512+ | PNG | Logo for splash screen |

The build script automatically generates:
- All Android icon sizes (mdpi to xxxhdpi)
- Adaptive icons for Android 8.0+
- All iOS icon sizes
- Splash screens for both platforms

### Output

Built apps are saved to:
```
flutter_app/build/tenant-builds/{tenant_id}/
├── {tenant_id}.apk      # Android APK
└── {tenant_id}.aab      # Android App Bundle (if --type appbundle)
```

## Customizable Branding

The app reads branding configuration at build time via Dart defines:

| Define | Description | Default |
|--------|-------------|---------|
| `TENANT_ID` | Unique tenant identifier | `default` |
| `COMPANY_NAME` | Full company name | `USA Luxury Limo` |
| `APP_NAME` | Short app name | `USA Luxury Limo` |
| `TOMTOM_API_KEY` | TomTom Maps API key | (required) |
| `API_BASE_URL` | Backend API URL | (required) |
| `PRIMARY_COLOR` | Primary/accent color | `#D4AF37` |
| `SECONDARY_COLOR` | Surface/card color | `#1A1A1A` |
| `BACKGROUND_COLOR` | Background color | `#0D0D0D` |
| `TEXT_COLOR` | Primary text color | `#F5F5F5` |

## TomTom Maps Features

- Dark night theme tiles for luxury aesthetic
- Place search via TomTom Search API
- Reverse geocoding
- Route calculation with real-time traffic
- No native SDK required (uses flutter_map with TomTom tiles)

## Design System

### Default Colors
- **Primary Gold:** #D4AF37
- **Background:** #0D0D0D
- **Surface:** #1A1A1A
- **Text Primary:** #F5F5F5

### Typography
- **Display Font:** Playfair Display (via Google Fonts)
- **Body Font:** Inter (via Google Fonts)

## Manual Build Commands

### Android APK
```bash
flutter build apk --release \
  --dart-define=TENANT_ID=my-company \
  --dart-define=COMPANY_NAME="My Luxury Limo" \
  --dart-define=TOMTOM_API_KEY=your_key \
  --dart-define=API_BASE_URL=https://api.mycompany.com
```

### Android App Bundle
```bash
flutter build appbundle --release \
  --dart-define=TENANT_ID=my-company \
  --dart-define=COMPANY_NAME="My Luxury Limo" \
  --dart-define=TOMTOM_API_KEY=your_key \
  --dart-define=API_BASE_URL=https://api.mycompany.com
```

### iOS
```bash
flutter build ios --release --no-codesign \
  --dart-define=TENANT_ID=my-company \
  --dart-define=COMPANY_NAME="My Luxury Limo" \
  --dart-define=TOMTOM_API_KEY=your_key \
  --dart-define=API_BASE_URL=https://api.mycompany.com
```

## License

Proprietary - USA Luxury Limo
