import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { getNativeConfig } from './nativeConfig';

export interface NativeBrandingData {
  companyName: string;
  tagline: string;
  description: string;
  logoUrl: string;
  faviconUrl: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

const BRANDING_CACHE_KEY = 'native_branding_cache';
const BRANDING_CACHE_EXPIRY_KEY = 'native_branding_cache_expiry';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

const DEFAULT_BRANDING: NativeBrandingData = {
  companyName: 'Luxury Transportation',
  tagline: 'Premium Transportation Services',
  description: 'Professional luxury transportation services',
  logoUrl: '/images/logo_1759125364025.png',
  faviconUrl: '/images/favicon_1759253989963.png',
  colors: {
    primary: '#1a1a1a',
    secondary: '#666666',
    accent: '#d4af37'
  }
};

export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

export function getPlatform(): 'ios' | 'android' | 'web' {
  return Capacitor.getPlatform() as 'ios' | 'android' | 'web';
}

function getCachedBranding(): NativeBrandingData | null {
  try {
    const cached = localStorage.getItem(BRANDING_CACHE_KEY);
    const expiry = localStorage.getItem(BRANDING_CACHE_EXPIRY_KEY);
    
    if (cached && expiry) {
      const expiryTime = parseInt(expiry, 10);
      if (Date.now() < expiryTime) {
        return JSON.parse(cached);
      }
    }
  } catch (error) {
    console.warn('Failed to read cached branding:', error);
  }
  return null;
}

function setCachedBranding(branding: NativeBrandingData): void {
  try {
    localStorage.setItem(BRANDING_CACHE_KEY, JSON.stringify(branding));
    localStorage.setItem(BRANDING_CACHE_EXPIRY_KEY, (Date.now() + CACHE_DURATION_MS).toString());
  } catch (error) {
    console.warn('Failed to cache branding:', error);
  }
}

function getApiBaseUrl(overrideUrl?: string): string {
  if (overrideUrl) {
    return overrideUrl;
  }

  const nativeConfig = getNativeConfig();
  if (nativeConfig.tenantServerUrl) {
    return nativeConfig.tenantServerUrl;
  }

  const buildTimeUrl = import.meta.env.VITE_TENANT_SERVER_URL;
  if (buildTimeUrl) {
    return buildTimeUrl;
  }

  if (!isNativeApp()) {
    return window.location.origin;
  }

  return '';
}

function resolveAssetUrl(assetPath: string, baseUrl: string): string {
  if (!assetPath) return assetPath;
  
  if (assetPath.startsWith('http://') || assetPath.startsWith('https://')) {
    return assetPath;
  }
  
  if (baseUrl && assetPath.startsWith('/')) {
    return `${baseUrl}${assetPath}`;
  }
  
  return assetPath;
}

export async function fetchNativeBranding(serverUrl?: string): Promise<NativeBrandingData> {
  const cached = getCachedBranding();
  if (cached) {
    return cached;
  }

  const baseUrl = getApiBaseUrl(serverUrl);
  
  if (!baseUrl) {
    console.warn('No API base URL configured for native branding');
    return DEFAULT_BRANDING;
  }

  try {
    const response = await fetch(`${baseUrl}/api/branding`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-cache'
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const branding: NativeBrandingData = {
      companyName: data.companyName || DEFAULT_BRANDING.companyName,
      tagline: data.tagline || DEFAULT_BRANDING.tagline,
      description: data.description || DEFAULT_BRANDING.description,
      logoUrl: resolveAssetUrl(data.logoUrl, baseUrl) || DEFAULT_BRANDING.logoUrl,
      faviconUrl: resolveAssetUrl(data.faviconUrl, baseUrl) || DEFAULT_BRANDING.faviconUrl,
      colors: {
        primary: data.colors?.primary || DEFAULT_BRANDING.colors.primary,
        secondary: data.colors?.secondary || DEFAULT_BRANDING.colors.secondary,
        accent: data.colors?.accent || DEFAULT_BRANDING.colors.accent
      }
    };

    setCachedBranding(branding);
    return branding;
  } catch (error) {
    console.error('Failed to fetch native branding:', error);
    return cached || DEFAULT_BRANDING;
  }
}

export async function initializeNativeApp(serverUrl?: string): Promise<NativeBrandingData> {
  if (!isNativeApp()) {
    return DEFAULT_BRANDING;
  }

  try {
    const branding = await fetchNativeBranding(serverUrl);

    try {
      await StatusBar.setStyle({ 
        style: isAdminApp() ? Style.Light : Style.Dark 
      });
      
      if (getPlatform() === 'android') {
        await StatusBar.setBackgroundColor({ 
          color: isAdminApp() ? '#1e3a8a' : branding.colors.primary 
        });
      }
    } catch (statusBarError) {
      console.warn('StatusBar not available:', statusBarError);
    }

    return branding;
  } catch (error) {
    console.error('Failed to initialize native app:', error);
    return DEFAULT_BRANDING;
  }
}

export async function hideSplashScreen(): Promise<void> {
  if (!isNativeApp()) return;

  try {
    await SplashScreen.hide({ fadeOutDuration: 300 });
  } catch (error) {
    console.warn('Failed to hide splash screen:', error);
  }
}

export function isAdminApp(): boolean {
  const nativeConfig = getNativeConfig();
  if (nativeConfig.isAdmin) {
    return true;
  }
  
  const pathname = window.location.pathname;
  return pathname.includes('admin') || 
         pathname.includes('mobile-admin') ||
         window.location.hostname.startsWith('adminaccess.');
}

export function clearBrandingCache(): void {
  try {
    localStorage.removeItem(BRANDING_CACHE_KEY);
    localStorage.removeItem(BRANDING_CACHE_EXPIRY_KEY);
  } catch (error) {
    console.warn('Failed to clear branding cache:', error);
  }
}

export function getTenantServerUrl(): string | undefined {
  return getApiBaseUrl();
}

export function setTenantServerUrl(url: string): void {
  localStorage.setItem('tenant_server_url', url);
  clearBrandingCache();
}
