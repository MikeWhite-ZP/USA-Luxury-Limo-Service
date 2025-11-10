# USA Luxury Limo - Native Mobile App Guide

Complete guide for building and publishing USA Luxury Limo as native iOS and Android apps using Capacitor.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Development Setup](#development-setup)
4. [Building for Android](#building-for-android)
5. [Building for iOS](#building-for-ios)
6. [Publishing to Google Play Store](#publishing-to-google-play-store)
7. [Publishing to Apple App Store](#publishing-to-apple-app-store)
8. [Updating Your App](#updating-your-app)
9. [Troubleshooting](#troubleshooting)

---

## Overview

USA Luxury Limo uses **Ionic Capacitor** to convert the Progressive Web App (PWA) into native iOS and Android applications. This approach allows you to:

- ✅ **Maintain one codebase** for web, iOS, and Android
- ✅ **Access native device features** (camera, GPS, push notifications, etc.)
- ✅ **Publish to app stores** (Google Play, Apple App Store)
- ✅ **Keep your existing PWA** working on all platforms

### What's Already Configured

- ✅ Capacitor core and CLI installed
- ✅ Android and iOS platforms added
- ✅ Native plugins configured (Camera, Geolocation, Push Notifications, etc.)
- ✅ Splash screen and status bar configured
- ✅ App icons ready (72x72 to 512x512)

---

## Prerequisites

### For Both Platforms

- **Node.js** 18+ installed
- **Git** for version control
- Your **production web app URL** (for deep linking)

### For Android Development

- **Android Studio** (latest version recommended)
  - Download: https://developer.android.com/studio
- **Java Development Kit (JDK)** 17 or higher
- **Android SDK** with:
  - Android API 33+ (Android 13+)
  - SDK Build-Tools
  - Android SDK Platform-Tools

### For iOS Development

- **macOS** computer (required for iOS development)
- **Xcode** 14+ from Mac App Store
- **CocoaPods** (install with: `sudo gem install cocoapods`)
- **Apple Developer Account** ($99/year)
  - Sign up: https://developer.apple.com/programs/

---

## Development Setup

### 1. Clone and Install Dependencies

```bash
# Clone your repository
git clone https://github.com/MikeWhite-ZP/USA-Luxury-Limo-Service.git
cd USA-Luxury-Limo-Service

# Install dependencies
npm install
```

### 2. Regenerate Native Projects (if needed)

If the `android/` and `ios/` directories don't exist:

```bash
# Build the web app first
npm run build

# Add platforms
npx cap add android
npx cap add ios
```

### 3. Sync Web Changes to Native Projects

Whenever you make changes to the web app, sync them:

```bash
# Build the web app
npm run build

# Sync changes to native projects
npx cap sync
```

This command:
- Copies web assets to native projects
- Updates native plugins
- Syncs configuration changes

---

## Building for Android

### Step 1: Open Android Project

```bash
npx cap open android
```

This opens Android Studio with your project.

### Step 2: Configure App Details

In Android Studio:

1. **Update App ID (if needed)**:
   - Open `android/app/build.gradle`
   - Change `applicationId "com.usaluxurylimo.app"` to your preferred ID
   - Update `appId` in `capacitor.config.ts` to match

2. **Update App Name**:
   - Open `android/app/src/main/res/values/strings.xml`
   - Change `<string name="app_name">USA Luxury Limo</string>`

3. **Set Version**:
   - Open `android/app/build.gradle`
   - Update `versionCode` and `versionName`

### Step 3: Configure App Icons and Splash Screen

#### App Icons

Place your app icons in `android/app/src/main/res/`:

```
mipmap-mdpi/ic_launcher.png (48x48)
mipmap-hdpi/ic_launcher.png (72x72)
mipmap-xhdpi/ic_launcher.png (96x96)
mipmap-xxhdpi/ic_launcher.png (144x144)
mipmap-xxxhdpi/ic_launcher.png (192x192)
```

**Tip**: Use Android Studio's Image Asset Studio:
- Right-click `res` → New → Image Asset
- Select "Launcher Icons (Adaptive and Legacy)"
- Upload your 512x512 icon

#### Splash Screen

Place splash images in `android/app/src/main/res/drawable/`:

```
drawable/splash.png
drawable-land/splash.png (landscape)
drawable-mdpi/splash.png (320x480)
drawable-hdpi/splash.png (480x800)
drawable-xhdpi/splash.png (720x1280)
drawable-xxhdpi/splash.png (1080x1920)
drawable-xxxhdpi/splash.png (1440x2560)
```

### Step 3a: Verify Android Permissions

Capacitor plugins automatically add required permissions to `android/app/src/main/AndroidManifest.xml`.

**Verify these permissions are present** (Capacitor adds them automatically):

```xml
<!-- Automatically added by Capacitor plugins -->
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

**Note**: INTERNET permission is already included in the base manifest.

### Step 4: Build APK (for testing)

In Android Studio:

1. Click **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
2. Wait for build to complete
3. Find APK at `android/app/build/outputs/apk/debug/app-debug.apk`

Install on your Android device for testing:

```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### Step 5: Build App Bundle (for Play Store)

For production release:

1. **Generate Signing Key**:

```bash
cd android/app
keytool -genkey -v -keystore usa-luxury-limo.keystore -alias usa-limo -keyalg RSA -keysize 2048 -validity 10000
```

2. **Configure Signing**:

Create `android/keystore.properties`:

```properties
storePassword=YOUR_KEYSTORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=usa-limo
storeFile=../app/usa-luxury-limo.keystore
```

3. **Update build.gradle**:

Add to `android/app/build.gradle` (inside `android` block):

```gradle
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
keystoreProperties.load(new FileInputStream(keystorePropertiesFile))

android {
    ...
    signingConfigs {
        release {
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
            storeFile file(keystoreProperties['storeFile'])
            storePassword keystoreProperties['storePassword']
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

4. **Build App Bundle**:

```bash
cd android
./gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

---

## Building for iOS

**Note**: iOS development requires a Mac with Xcode installed.

### Step 1: Install CocoaPods Dependencies

```bash
cd ios/App
pod install
cd ../..
```

### Step 2: Open iOS Project

```bash
npx cap open ios
```

This opens Xcode with your project.

### Step 3: Configure App Details

In Xcode:

1. **Select Project**: Click "App" in the navigator
2. **Update Bundle Identifier**:
   - Under "Signing & Capabilities"
   - Change Bundle Identifier to `com.usaluxurylimo.app` (or your preferred ID)
   - Update `appId` in `capacitor.config.ts` to match

3. **Configure Signing**:
   - Select your Apple Developer Team
   - Xcode will automatically manage provisioning profiles

4. **Update App Name**:
   - Select `Info.plist`
   - Change `CFBundleName` to "USA Luxury Limo"

5. **Set Version**:
   - General tab → Version (e.g., 1.0.0)
   - Build number (e.g., 1)

### Step 4: Configure App Icons

In Xcode:

1. Click `Assets.xcassets` in the navigator
2. Click `AppIcon`
3. Drag and drop your app icons for each size:
   - iPhone App: 60x60, 120x120, 180x180
   - iPad App: 76x76, 152x152
   - App Store: 1024x1024

**Tip**: Use a tool like [App Icon Generator](https://appicon.co/) to create all sizes from one image.

### Step 5: Configure Splash Screen

1. Click `Assets.xcassets` → `Splash`
2. Add splash images for each size
3. Configure in `capacitor.config.ts` (already set up)

### Step 6: Configure Info.plist Permissions

**IMPORTANT**: The iOS project (`ios/` directory) is git-ignored, so you must add permissions after generating the project.

**Option A: Use the automated script** (recommended)

```bash
./scripts/setup-ios-permissions.sh
```

This script automatically copies the required permissions from `ios-info-plist-template.xml` to `ios/App/App/Info.plist`.

**Option B: Manual setup**

Copy the permissions from `ios-info-plist-template.xml` (in the root directory) and paste them into `ios/App/App/Info.plist` before the closing `</dict>` tag.

Permissions to add:

```xml
<!-- Required permissions for Capacitor plugins -->
<key>NSCameraUsageDescription</key>
<string>USA Luxury Limo needs access to your camera to upload photos and documents for driver verification and trip documentation.</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>USA Luxury Limo needs access to your photo library to select and upload images.</string>

<key>NSPhotoLibraryAddUsageDescription</key>
<string>USA Luxury Limo needs permission to save photos to your library.</string>

<key>NSLocationWhenInUseUsageDescription</key>
<string>USA Luxury Limo needs your location to show nearby pickup points and provide accurate ride tracking.</string>

<key>NSLocationAlwaysUsageDescription</key>
<string>USA Luxury Limo uses your location to provide real-time ride tracking and accurate driver-passenger coordination.</string>

<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>USA Luxury Limo uses your location to provide real-time ride tracking and accurate driver-passenger coordination.</string>

<!-- Push notifications background mode -->
<key>UIBackgroundModes</key>
<array>
    <string>remote-notification</string>
</array>
```

**Why this matters**: Without these permission descriptions, iOS will reject your app or crash when trying to use camera/location features.

### Step 7: Build for Simulator (testing)

1. Select a simulator from the device menu (e.g., iPhone 15 Pro)
2. Click **Product** → **Run** (or press ⌘R)
3. App will launch in the iOS Simulator

### Step 8: Build for Device Archive (for App Store)

1. Connect your iPhone via USB
2. Select your device from the device menu
3. Click **Product** → **Archive**
4. Wait for build to complete
5. Xcode Organizer will open with your archive

---

## Publishing to Google Play Store

### Prerequisites

- Google Play Console account ($25 one-time fee)
- App Bundle (.aab file) from Android build
- Privacy Policy URL
- App screenshots and promotional graphics

### Step 1: Create App in Play Console

1. Go to https://play.google.com/console
2. Click **Create app**
3. Fill in app details:
   - **App name**: USA Luxury Limo
   - **Default language**: English (United States)
   - **App or game**: App
   - **Free or paid**: Free (or Paid)
4. Accept terms and create app

### Step 2: Complete App Dashboard

#### Store Listing

1. **App details**:
   - Short description (80 chars max)
   - Full description (4000 chars max)
   - App icon (512x512 PNG)

2. **Graphics**:
   - Screenshots (2-8 images):
     - Phone: 320-3840px wide, 16:9 or 9:16 aspect ratio
     - Tablet (optional): Same requirements
   - Feature graphic: 1024x500px

3. **Categorization**:
   - App category: Travel & Local
   - Tags: limo, transportation, ride, booking

4. **Contact details**:
   - Email, phone, website
   - Privacy policy URL (required!)

#### Privacy Policy

Create a privacy policy page and host it on your domain. Example:

```
https://yourdomain.com/privacy-policy
```

### Step 3: Set Up App Content

1. **Privacy & security**:
   - Data safety form (what data you collect)
   - COVID-19 tracing disclaimer (if applicable)

2. **Target audience & content**:
   - Target age: 18+ (or appropriate for your app)
   - Content rating questionnaire

3. **App access**:
   - All users can access full app (or restricted)

4. **Ads**:
   - Does app contain ads? (Yes/No)

### Step 4: Upload App Bundle

1. Go to **Production** → **Create new release**
2. Upload your `.aab` file:
   - `android/app/build/outputs/bundle/release/app-release.aab`
3. Add release notes:
   - What's new in this version
   - Bug fixes and improvements
4. Review and save

### Step 5: Submit for Review

1. Complete all required sections (green checkmarks)
2. Click **Review release**
3. Verify all information is correct
4. Click **Start rollout to production**

**Review time**: Typically 1-3 days (up to 7 days)

---

## Publishing to Apple App Store

### Prerequisites

- Apple Developer account ($99/year)
- App Archive from Xcode
- Privacy Policy URL
- App screenshots and promotional graphics

### Step 1: Create App in App Store Connect

1. Go to https://appstoreconnect.apple.com
2. Click **My Apps** → **+** → **New App**
3. Fill in app information:
   - **Platforms**: iOS
   - **Name**: USA Luxury Limo
   - **Primary Language**: English (U.S.)
   - **Bundle ID**: com.usaluxurylimo.app
   - **SKU**: com.usaluxurylimo.app (or unique identifier)
   - **User Access**: Full Access

### Step 2: Complete App Information

#### App Information Tab

1. **Privacy Policy URL**: https://yourdomain.com/privacy-policy
2. **Category**: Primary - Travel, Secondary - Business
3. **Content Rights**: Check "Contains third-party content"

#### Pricing and Availability

1. **Price**: Free (or set price tier)
2. **Availability**: All countries (or select specific)

### Step 3: Prepare Version Information

Click **1.0 Prepare for Submission**:

1. **Screenshots**:
   - iPhone 6.7" Display (required): 1290 x 2796 px
   - iPhone 6.5" Display: 1242 x 2688 px
   - iPad Pro (3rd gen) 12.9": 2048 x 2732 px (if supporting iPad)

2. **Promotional Text** (optional): 170 chars
   - Example: "Book luxury limo rides with ease. Real-time tracking, instant quotes, and professional service."

3. **Description**: 4000 chars max
   - Compelling description of your app
   - Key features and benefits

4. **Keywords**: 100 chars
   - Example: "limo,limousine,car,ride,taxi,chauffeur,luxury,transportation,booking,airport"

5. **Support URL**: https://yourdomain.com/support

6. **Marketing URL** (optional): https://yourdomain.com

### Step 4: Build Information

1. **App Privacy**:
   - Click "Edit" next to App Privacy
   - Answer privacy questions:
     - Data collection types
     - Data usage
     - Third-party data
   - This is required!

2. **Age Rating**:
   - Answer questionnaire
   - USA Luxury Limo likely: 4+

3. **Copyright**: © 2025 USA Luxury Limo

4. **Version**: 1.0.0

5. **Release**: Automatically release after approval (or manual)

### Step 5: Upload Build from Xcode

Back in Xcode:

1. Open **Xcode Organizer** (Window → Organizer)
2. Select your archive
3. Click **Distribute App**
4. Choose **App Store Connect**
5. Click **Upload**
6. Wait for upload to complete (5-30 minutes)

### Step 6: Select Build in App Store Connect

1. Go back to App Store Connect
2. Under **Build**, click **+** or **Select a build**
3. Choose the uploaded build
4. Add export compliance information:
   - Does your app use encryption? (likely Yes for HTTPS)
   - Answer follow-up questions

### Step 7: Submit for Review

1. Complete all required sections
2. **Save** changes
3. Click **Add for Review**
4. Click **Submit to App Store**

**Review time**: Typically 1-3 days (up to 7 days)

#### Common Rejection Reasons

- **Incomplete information**: Missing privacy policy, screenshots, descriptions
- **Broken functionality**: App crashes or doesn't work as described
- **Design issues**: Poor UI/UX, confusing navigation
- **Privacy violations**: Not disclosing data collection
- **Content issues**: Inappropriate content, misleading information

---

## Updating Your App

When you need to update the app with new features or bug fixes:

### 1. Update Web Code

Make changes to your React/TypeScript code as usual.

### 2. Build and Sync

```bash
# Build web app
npm run build

# Sync to native projects
npx cap sync
```

### 3. Update Version Numbers

**Android** (`android/app/build.gradle`):
```gradle
versionCode 2  // Increment for each release
versionName "1.0.1"
```

**iOS** (Xcode):
- General tab → Version: 1.0.1
- Build: 2 (increment for each upload)

### 4. Rebuild and Resubmit

Follow the same build and publishing steps as initial release.

---

## Troubleshooting

### Android Issues

#### Build Fails with "SDK not found"

**Solution**:
```bash
# Open Android Studio
# Go to Tools → SDK Manager
# Install Android SDK Platform 33 (or latest)
# Install Android SDK Build-Tools
```

#### App Crashes on Startup

**Check**:
1. Open `android/app/build.gradle` - ensure `minSdkVersion` is at least 22
2. Check Logcat in Android Studio for error messages
3. Verify `webDir` in `capacitor.config.ts` matches your build output

#### Plugins Not Working

**Solution**:
```bash
# Reinstall plugins
npm install
npx cap sync android
```

### iOS Issues

#### Pod Install Fails

**Solution**:
```bash
cd ios/App
pod repo update
pod install --repo-update
```

#### Signing Errors

**Solution**:
1. Open Xcode
2. Select project → Signing & Capabilities
3. Click "+" to add your Apple ID
4. Select your team
5. Check "Automatically manage signing"

#### App Rejected for Missing Permissions

**Solution**: Add all required usage descriptions to `Info.plist` (see iOS Step 6 above)

### General Issues

#### Changes Not Appearing in App

**Solution**:
```bash
# Full rebuild
npm run build
npx cap sync
# Then rebuild in Xcode/Android Studio
```

#### White Screen on Launch

**Causes**:
- JavaScript errors (check browser console)
- Incorrect `webDir` path
- Build not synced

**Solution**:
```bash
# Check capacitor.config.ts
# Ensure webDir is 'dist/public'
npm run build
npx cap sync
```

---

## Additional Resources

### Official Documentation

- **Capacitor**: https://capacitorjs.com/docs
- **Android**: https://developer.android.com/docs
- **iOS**: https://developer.apple.com/documentation/
- **Google Play**: https://support.google.com/googleplay/android-developer
- **App Store**: https://developer.apple.com/app-store/review/guidelines/

### Useful Tools

- **App Icon Generator**: https://appicon.co/
- **Screenshot Creator**: https://www.mockuphone.com/
- **Privacy Policy Generator**: https://www.privacypolicygenerator.info/

### Testing Services

- **TestFlight** (iOS beta testing): Built into App Store Connect
- **Google Play Internal Testing**: Built into Play Console
- **Firebase App Distribution**: https://firebase.google.com/products/app-distribution

---

## Summary

You now have everything you need to build and publish USA Luxury Limo as native iOS and Android apps!

**Next Steps**:

1. ✅ Set up Android Studio and Xcode
2. ✅ Configure app icons and splash screens
3. ✅ Build test versions and install on devices
4. ✅ Create accounts on Play Console and App Store Connect
5. ✅ Prepare store listings (screenshots, descriptions)
6. ✅ Build production releases (App Bundle for Android, Archive for iOS)
7. ✅ Submit for review
8. ✅ Celebrate when approved! 🎉

**Questions?**
- Review this guide thoroughly
- Check official Capacitor documentation
- Test on real devices before submitting
- Prepare all marketing materials in advance

Good luck with your app launch! 🚀
