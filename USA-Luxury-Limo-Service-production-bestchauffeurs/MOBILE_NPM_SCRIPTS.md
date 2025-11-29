# Recommended NPM Scripts for Mobile Development

Add these scripts to your `package.json` to streamline mobile development:

```json
{
  "scripts": {
    "mobile:sync": "npm run build && npx cap sync",
    "mobile:android": "npm run mobile:sync && npx cap open android",
    "mobile:ios": "npm run mobile:sync && npx cap open ios",
    "mobile:regenerate": "rm -rf android ios && npm run build && npx cap add android && npx cap add ios"
  }
}
```

## Usage

### Sync Changes to Mobile

After making changes to your web code:

```bash
npm run mobile:sync
```

This will:
1. Build the web app (`npm run build`)
2. Copy web assets to native projects
3. Update native plugins
4. Sync configuration changes

### Open Android Studio

```bash
npm run mobile:android
```

This syncs changes and opens Android Studio.

### Open Xcode

```bash
npm run mobile:ios
```

This syncs changes and opens Xcode (macOS only).

### Regenerate Native Projects

If the native projects get corrupted or you want a fresh start:

```bash
npm run mobile:regenerate
```

**Warning**: This deletes `android/` and `ios/` directories and recreates them.

**Important**: After regenerating iOS, you must manually copy the permissions from the committed `ios/App/App/Info.plist` back to the new file, as iOS permission descriptions are not automatically added.

## Manual Commands

If you don't want to add npm scripts, use these commands directly:

### Sync
```bash
npm run build
npx cap sync
```

### Open Native IDE
```bash
npx cap open android  # Android Studio
npx cap open ios      # Xcode (macOS only)
```

### Add Platforms
```bash
npx cap add android
npx cap add ios
```

### Update Plugins
```bash
npx cap update
```

### List Installed Plugins
```bash
npx cap ls
```

## Workflow

**Development cycle:**

1. Make changes to React/TypeScript code
2. Run `npm run mobile:sync` (or manual commands)
3. Open Android Studio or Xcode
4. Build and test on device/simulator
5. Repeat

**Production release:**

1. Ensure all changes are committed
2. Run `npm run mobile:sync`
3. Update version numbers (Android: `build.gradle`, iOS: Xcode)
4. Build release (APK/AAB for Android, Archive for iOS)
5. Submit to app stores

## Tips

- **Always sync before opening native IDE** to ensure latest web changes are included
- **Check Capacitor version** with `npx cap --version`
- **View Capacitor config** with `npx cap config`
- **Run sync with verbose output** with `npx cap sync --verbose` for debugging
