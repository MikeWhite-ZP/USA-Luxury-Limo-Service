# USA Luxury Limo - Flutter Mobile Apps

Multi-tenant Flutter mobile applications for the USA Luxury Limo transportation booking system.

## Features

- **Multi-Tenant White-Label** - Build branded apps for multiple companies
- **User App** - Passenger booking & Driver job management
- **Admin App** - Fleet management & dispatch dashboard
- **Dynamic Branding** - Colors, logos fetched from `/api/branding` endpoint at runtime
- **4-Step Booking Flow** - Type → Route → Vehicle → Confirm
- **Session-Based Auth** - Cookie persistence with Dio

## Architecture

This project uses a **monorepo structure** with Melos:

```
flutter_app/
├── apps/
│   ├── user_app/           # Passenger & Driver app
│   └── admin_app/          # Admin/Dispatcher app
├── packages/
│   ├── core/               # API client, models, providers
│   ├── theme/              # Dynamic branding & theming
│   └── features/
│       ├── auth/           # Authentication module
│       ├── passenger/      # Passenger booking features
│       ├── driver/         # Driver job management
│       ├── booking/        # Booking flow logic
│       ├── invoices/       # Invoice management
│       └── admin/          # Admin dashboard features
├── scripts/
│   ├── build_app.sh        # Build single tenant app
│   └── build_all_tenants.sh # Build all tenant apps
└── melos.yaml              # Monorepo configuration
```

## Tech Stack

- **Flutter 3.10+** (Dart 3.0+)
- **Riverpod** - State management
- **Dio** - HTTP client with cookie session
- **Go Router** - Declarative routing
- **Melos** - Monorepo management
- **Google Fonts** - Typography (Inter)
- **flutter_secure_storage** - Encrypted credentials

---

## Getting Started

### Prerequisites

- Flutter SDK (>=3.10.0)
- Melos (`dart pub global activate melos`)
- Android Studio (for Android builds)
- Xcode 15+ (for iOS builds, macOS only)
- jq (for batch build scripts)

### Initial Setup

```bash
cd flutter_app

# Install Melos globally
dart pub global activate melos

# Bootstrap all packages (installs dependencies)
melos bootstrap
```

### Run in Development

```bash
# User App
cd apps/user_app
flutter run

# Admin App
cd apps/admin_app
flutter run
```

---

## Multi-Tenant Build System

Each tenant can have up to **4 apps**:
- User App (Android APK) - fully automated
- User App (iOS IPA) - requires macOS + Xcode + Apple Developer signing
- Admin App (Android APK) - fully automated
- Admin App (iOS IPA) - requires macOS + Xcode + Apple Developer signing

> **Note:** Android builds work on any OS. iOS builds require macOS with Xcode and a valid Apple Developer account for code signing. The build scripts generate unsigned iOS builds that must be signed via Xcode.

### Build-Time Variables

Apps are configured via `--dart-define` flags:

| Variable | Description | Example |
|----------|-------------|---------|
| `TENANT_SLUG` | Unique tenant identifier | `acme` |
| `API_BASE_URL` | Backend API endpoint | `https://api.acme.com` |
| `FLAVOR` | Environment | `development`, `staging`, `production` |

### Runtime Branding

At startup, the app fetches branding from `{API_BASE_URL}/api/branding`:
```json
{
  "companyName": "Acme Limo",
  "tagline": "Luxury Transportation",
  "logoUrl": "https://...",
  "lightColors": { "primary": "#2563eb", ... },
  "darkColors": { "primary": "#3b82f6", ... }
}
```

---

## Automated Builds (Command Line)

### Option 1: Single App Build

Use `build_app.sh` to build one app for one tenant:

```bash
./scripts/build_app.sh <app_type> <platform> <tenant_slug> <api_base_url> [flavor] [build_type]
```

**Arguments:**
- `app_type`: `user` or `admin`
- `platform`: `android` or `ios`
- `tenant_slug`: Unique identifier (e.g., `acme`)
- `api_base_url`: Backend URL (e.g., `https://api.acme.com`)
- `flavor`: `development`, `staging`, or `production` (default: `production`)
- `build_type`: `debug` or `release` (default: `release`)

**Examples:**
```bash
# Build User App for Android
./scripts/build_app.sh user android acme https://api.acme.com

# Build Admin App for iOS (release)
./scripts/build_app.sh admin ios acme https://api.acme.com production release

# Build for development/debugging
./scripts/build_app.sh user android acme https://api.acme.com development debug
```

**Output:**
```
flutter_app/build/output/{tenant_slug}/{app_type}/
├── acme_user_app-production.apk    # Android (always generated)
└── acme_user_app-production.ipa    # iOS (requires macOS + Xcode + signing)
```

> **iOS Note:** The script generates iOS project files. To create an IPA, you must complete code signing via Xcode (see "iOS Builds" section below).

### Option 2: Batch Build (All Tenants)

Create a `tenants.json` file:
```json
[
  {
    "slug": "acme",
    "api_base_url": "https://api.acme.com"
  },
  {
    "slug": "luxury",
    "api_base_url": "https://api.luxurylimo.com"
  }
]
```

Run batch build:
```bash
./scripts/build_all_tenants.sh tenants.json
```

This attempts to build all 4 apps (user/admin × android/ios) for each tenant.
- **Android:** APKs are fully generated
- **iOS:** Project files are generated; signing must be completed in Xcode

---

## Manual Builds

### Android APK

```bash
cd apps/user_app  # or apps/admin_app

flutter build apk --release \
  --dart-define=TENANT_SLUG=acme \
  --dart-define=API_BASE_URL=https://api.acme.com \
  --dart-define=FLAVOR=production
```

Output: `build/app/outputs/flutter-apk/app-release.apk`

### Android App Bundle (Play Store)

```bash
flutter build appbundle --release \
  --dart-define=TENANT_SLUG=acme \
  --dart-define=API_BASE_URL=https://api.acme.com \
  --dart-define=FLAVOR=production
```

Output: `build/app/outputs/bundle/release/app-release.aab`

---

## iOS Builds

### Prerequisites for iOS

- **macOS** (required - iOS apps cannot be built on Windows/Linux)
- **Xcode 15+** (from Mac App Store)
- **Apple Developer Account** ($99/year for App Store distribution)
- **Code Signing configured** (certificates and provisioning profiles)

### Option A: Command Line (Still Requires Xcode Signing)

This builds the app but you'll still need to sign it in Xcode for distribution.

```bash
cd apps/user_app

# Build without code signing (for archive)
flutter build ios --release --no-codesign \
  --dart-define=TENANT_SLUG=acme \
  --dart-define=API_BASE_URL=https://api.acme.com \
  --dart-define=FLAVOR=production

# Build IPA (requires signing)
flutter build ipa \
  --dart-define=TENANT_SLUG=acme \
  --dart-define=API_BASE_URL=https://api.acme.com \
  --dart-define=FLAVOR=production
```

### Option B: Using Xcode GUI

If you prefer Xcode's graphical interface:

**Step 1: Generate iOS Project Files**
```bash
cd apps/user_app  # or apps/admin_app

flutter build ios --no-codesign \
  --dart-define=TENANT_SLUG=acme \
  --dart-define=API_BASE_URL=https://api.acme.com \
  --dart-define=FLAVOR=production
```

**Step 2: Open in Xcode**
```bash
open ios/Runner.xcworkspace
```

**Step 3: Configure in Xcode**
1. Select **Runner** in the project navigator (left sidebar)
2. Select **Runner** target under TARGETS
3. Go to **Signing & Capabilities** tab
4. Select your Team from the dropdown
5. Xcode will automatically manage provisioning profiles

**Step 4: Set Build Configuration**
1. Go to **Build Settings** tab
2. Search for "Bundle Identifier"
3. Set to your tenant's bundle ID (e.g., `com.acme.limo`)

**Step 5: Archive & Distribute**
1. Select **Product → Destination → Any iOS Device (arm64)**
2. Select **Product → Archive**
3. Wait for archive to complete
4. In the Organizer window, click **Distribute App**
5. Choose distribution method:
   - **App Store Connect** - For TestFlight/App Store
   - **Ad Hoc** - For direct device installation
   - **Enterprise** - For enterprise distribution

**Step 6: Export IPA**
- Follow the prompts to sign and export
- IPA file will be saved to your chosen location

---

## App Icons & Splash Screens

### Updating App Icons

1. Replace icon files in:
   - `apps/user_app/assets/icons/app_icon.png` (1024x1024)
   - `apps/admin_app/assets/icons/admin_icon.png` (1024x1024)

2. Run icon generator:
```bash
cd apps/user_app
flutter pub run flutter_launcher_icons
```

### Splash Screen

The app uses an animated splash screen that displays:
- Tenant logo (from `/api/branding`)
- Company name
- Loading indicator

---

## Packages Reference

### Core (`packages/core`)
- **ApiClient** - Dio-based HTTP client with cookie session management
- **ApiEndpoints** - All API endpoint definitions
- **Models** - User, Booking, Invoice, VehicleType
- **AuthProvider** - Authentication state (Riverpod)
- **TenantProvider** - Tenant configuration state
- **SecureStorage** - Encrypted local storage wrapper
- **Validators** - Form validation utilities

### Theme (`packages/theme`)
- **AppTheme** - Material 3 theme generation from tenant colors
- **ColorUtils** - Hex parsing, contrast calculation
- **ThemeProvider** - Theme mode state (light/dark/system)
- **BrandLogo** - Cached network image with fallback
- **LoadingIndicator** - Consistent loading widgets

---

## Melos Commands

```bash
# Install dependencies for all packages
melos bootstrap

# Run analysis on all packages
melos run analyze

# Format all packages
melos run format

# Run tests
melos run test

# Clean all packages
melos run clean

# Get dependencies
melos run get
```

---

## Troubleshooting

### iOS Build Fails
- Ensure Xcode Command Line Tools are installed: `xcode-select --install`
- Open Xcode once to accept license: `sudo xcodebuild -license accept`
- Clean and rebuild: `flutter clean && flutter pub get`

### Android Build Fails
- Ensure Android SDK is configured: `flutter doctor`
- Accept licenses: `flutter doctor --android-licenses`

### Melos Bootstrap Fails
- Try cleaning first: `melos clean`
- Update Melos: `dart pub global activate melos`

### Session/Auth Issues
- Clear app data on device
- Check that `API_BASE_URL` is correct and accessible
- Verify backend `/api/auth/login` endpoint works

---

## License

Proprietary - USA Luxury Limo
