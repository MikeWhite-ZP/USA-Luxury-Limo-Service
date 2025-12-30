# Android SMS Gateway App

This Android application acts as an SMS gateway client, connecting to your server's Android SMS Gateway API to send SMS messages using the phone's native SMS capabilities.

## Features

- **Device Registration**: Register your Android phone with the server
- **Background Service**: Runs in background to poll for pending SMS messages
- **Secure Token Storage**: API tokens are stored using Android's EncryptedSharedPreferences
- **Auto-start on Boot**: Service can automatically restart when the device boots
- **Status Monitoring**: View sent/failed message counts and last heartbeat time
- **Multi-part SMS**: Automatically handles long messages that need to be split

## Requirements

- Android 8.0 (API 26) or higher
- SMS sending permission
- Internet connection

## Building the App

### Prerequisites

1. Install [Android Studio](https://developer.android.com/studio) (latest version)
2. Install Android SDK 34 (via Android Studio SDK Manager)
3. Install JDK 17

### Build Steps

1. **Open the project in Android Studio**:
   ```bash
   cd android-sms-gateway-app
   # Open this folder in Android Studio
   ```

2. **Sync Gradle**:
   - Android Studio will prompt you to sync Gradle files
   - Click "Sync Now" if prompted

3. **Build Debug APK**:
   ```bash
   ./gradlew assembleDebug
   ```
   The APK will be at: `app/build/outputs/apk/debug/app-debug.apk`

4. **Build Release APK** (requires signing):
   ```bash
   ./gradlew assembleRelease
   ```

### Installing on Device

1. **Enable Developer Options** on your Android device:
   - Go to Settings > About Phone
   - Tap "Build Number" 7 times

2. **Enable USB Debugging**:
   - Settings > Developer Options > USB Debugging

3. **Install via ADB**:
   ```bash
   adb install app/build/outputs/apk/debug/app-debug.apk
   ```

   Or simply click "Run" in Android Studio with your device connected.

## Usage

### 1. First Launch

1. Open the SMS Gateway app
2. Grant SMS permission when prompted
3. (Android 13+) Grant notification permission for background service

### 2. Register Device

1. Enter your server URL (e.g., `https://your-server.com`)
2. Enter a name for this device
3. Optionally enter the phone number
4. Tap "Register Device"

The app will register with your server and receive an API token.

### 3. Start the Service

1. After successful registration, tap "Start Service"
2. The service will run in the background with a notification
3. The app will poll the server every 10 seconds for pending messages

### 4. Monitor Status

The status card shows:
- **Registration**: Whether the device is registered
- **Service**: Whether the background service is running
- **Pending Messages**: Number of messages waiting on the server
- **Messages Sent**: Total successful SMS messages sent
- **Messages Failed**: Total failed attempts
- **Last Heartbeat**: Last successful server communication

## How It Works

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Your Server   │────▶│  SMS Gateway    │────▶│   Recipient     │
│   (Backend)     │     │   Android App   │     │   Phone         │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │
        │  1. Queue SMS         │
        │                       │
        │◀──────────────────────│
        │  2. Poll for messages │
        │                       │
        │  3. Return pending    │
        │──────────────────────▶│
        │                       │  4. Send via
        │                       │  Android SmsManager
        │                       │
        │◀──────────────────────│
        │  5. Report status     │
        │    (SENT/FAILED)      │
```

1. Your backend queues SMS messages via the Android SMS Gateway API
2. The Android app polls the server for pending messages
3. When messages are found, the app sends them using native SMS
4. The app reports the status back to the server
5. If sending fails, the server can fall back to Twilio

## API Endpoints Used

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/android-sms/register` | POST | Register device |
| `/api/android-sms/heartbeat` | POST | Send heartbeat |
| `/api/android-sms/messages/pending` | GET | Get pending messages |
| `/api/android-sms/messages/:id/status` | POST | Update message status |

## Security

- **Token Storage**: API tokens are encrypted using Android Keystore via EncryptedSharedPreferences
- **SHA-256 Hashing**: Server stores tokens as SHA-256 hashes, not plain text
- **Device Binding**: Tokens are bound to specific device UUIDs
- **HTTPS**: Always use HTTPS in production

## Troubleshooting

### "SMS permission not granted"
- Go to Android Settings > Apps > SMS Gateway > Permissions > SMS > Allow

### "Service keeps stopping"
- Disable battery optimization for the app
- Settings > Apps > SMS Gateway > Battery > Don't optimize

### "Cannot connect to server"
- Verify the server URL is correct
- Ensure the server is accessible from the phone's network
- Check if HTTPS certificate is valid

### "Messages not sending"
- Check if phone has mobile network signal
- Verify SMS permission is granted
- Check if phone has SMS credit/balance

## Development

### Project Structure

```
android-sms-gateway-app/
├── app/
│   ├── src/main/
│   │   ├── java/com/usaluxurylimo/smsgateway/
│   │   │   ├── api/           # Retrofit API client
│   │   │   ├── service/       # Background SMS service
│   │   │   ├── ui/            # Activity
│   │   │   └── util/          # Utilities
│   │   ├── res/               # Resources
│   │   └── AndroidManifest.xml
│   └── build.gradle.kts
├── build.gradle.kts
├── settings.gradle.kts
└── README.md
```

### Key Dependencies

- **Retrofit**: HTTP client for API communication
- **OkHttp**: HTTP interceptors and logging
- **EncryptedSharedPreferences**: Secure token storage
- **Kotlin Coroutines**: Async operations

## License

This SMS Gateway app is part of the USA Luxury Limo project.
