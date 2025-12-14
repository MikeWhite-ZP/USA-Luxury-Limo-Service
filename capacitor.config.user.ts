import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: process.env.CAPACITOR_APP_ID || 'com.luxurylimo.user',
  appName: process.env.CAPACITOR_APP_NAME || 'Luxury Limo',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https',
    iosScheme: 'capacitor',
    url: process.env.CAPACITOR_SERVER_URL,
    cleartext: process.env.NODE_ENV !== 'production'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: false,
      backgroundColor: '#FFFFFF',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#FFFFFF'
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  },
  ios: {
    scheme: 'LuxuryLimoUser',
    contentInset: 'automatic'
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: process.env.NODE_ENV !== 'production'
  }
};

export default config;
