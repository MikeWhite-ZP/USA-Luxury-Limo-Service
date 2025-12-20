# USA Luxury Limo - Flutter Mobile App

A premium chauffeur and limo booking service mobile application built with Flutter.

## Features

- **Luxury Dark Theme** - Premium design with gold accents
- **TomTom Maps Integration** - High-quality maps with dark theme tiles
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
│   ├── network/        # API client, interceptors, token storage
│   ├── utils/          # Validators, extensions
│   └── constants/      # API & app constants
├── features/
│   ├── auth/           # Login, register, splash screens
│   ├── home/           # Home screen with map
│   ├── booking/        # Vehicle selection, booking confirmation
│   ├── rides/          # Ride history
│   └── profile/        # User profile
└── shared/
    ├── widgets/        # Reusable UI components
    ├── models/         # Data models
    └── providers/      # App-wide providers (router)
```

## Tech Stack

- **Flutter** (latest stable)
- **Riverpod** - State management
- **Dio** - HTTP client
- **Go Router** - Navigation
- **TomTom Maps** - Map provider with flutter_map
- **Cached Network Image** - Image caching

## Getting Started

### Prerequisites

- Flutter SDK (>=3.0.0)
- Android Studio / Xcode
- TomTom API Key

### Setup

1. **Clone and navigate to the Flutter app directory:**
   ```bash
   cd flutter_app
   ```

2. **Install dependencies:**
   ```bash
   flutter pub get
   ```

3. **Configure API Base URL:**
   
   Edit `lib/core/constants/api_constants.dart`:
   ```dart
   static const String baseUrl = 'https://your-api-domain.com';
   ```

4. **Configure TomTom Maps:**

   Run with your TomTom API key:
   ```bash
   flutter run --dart-define=TOMTOM_API_KEY=your_tomtom_api_key
   ```

5. **Run the app:**
   ```bash
   flutter run --dart-define=TOMTOM_API_KEY=your_tomtom_api_key
   ```

## TomTom Maps Features

- Dark night theme tiles for luxury aesthetic
- Place search via TomTom Search API
- Reverse geocoding
- Route calculation with real-time traffic
- No native SDK required (uses flutter_map with TomTom tiles)

## API Integration

The app is designed to work with your existing backend. Update the endpoints in `lib/core/constants/api_constants.dart` to match your API.

### Required Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/login` | POST | User login |
| `/api/register` | POST | User registration |
| `/api/logout` | POST | User logout |
| `/api/user` | GET | Get current user |
| `/api/bookings` | GET/POST | List/create bookings |
| `/api/vehicle-types` | GET | Get available vehicles |
| `/api/calculate-price` | POST | Calculate ride price |

## Design System

### Colors
- **Primary Gold:** #D4AF37
- **Background:** #0D0D0D
- **Surface:** #1A1A1A
- **Text Primary:** #F5F5F5

### Typography
- **Display Font:** Playfair Display (via Google Fonts)
- **Body Font:** Inter (via Google Fonts)

## Building for Production

### Android
```bash
flutter build apk --release \
  --dart-define=TOMTOM_API_KEY=your_key
# or
flutter build appbundle --release \
  --dart-define=TOMTOM_API_KEY=your_key
```

### iOS
```bash
flutter build ios --release \
  --dart-define=TOMTOM_API_KEY=your_key
```

## License

Proprietary - USA Luxury Limo
