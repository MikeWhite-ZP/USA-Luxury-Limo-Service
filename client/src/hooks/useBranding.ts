import { useQuery } from '@tanstack/react-query';

// Extended color palette for dynamic branding
export interface BrandColors {
  // Core brand colors
  primary: string;
  secondary: string;
  accent: string;
  
  // Button colors
  buttonPrimary: string;
  buttonPrimaryHover: string;
  buttonSecondary: string;
  buttonSecondaryHover: string;
  
  // Background colors
  pageBackground: string;
  cardBackground: string;
  headerBackground: string;
  
  // Text colors
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  
  // Navigation colors
  navActive: string;
  navIndicator: string;
  navHover: string;
  
  // Link colors
  linkDefault: string;
  linkHover: string;
  
  // Index signature for dynamic access
  [key: string]: string;
}

export interface BrandingData {
  companyName: string;
  tagline: string;
  description: string;
  logoUrl: string;
  faviconUrl: string;
  colors: BrandColors;
  darkColors?: BrandColors;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
}

// Default light theme color palette
export const DEFAULT_BRAND_COLORS: BrandColors = {
  // Core
  primary: '#1a1a1a',
  secondary: '#666666',
  accent: '#dc2626',
  
  // Buttons
  buttonPrimary: '#dc2626',
  buttonPrimaryHover: '#b91c1c',
  buttonSecondary: '#1a1a1a',
  buttonSecondaryHover: '#374151',
  
  // Backgrounds
  pageBackground: '#ffffff',
  cardBackground: '#ffffff',
  headerBackground: '#ffffff',
  
  // Text
  textPrimary: '#1a1a1a',
  textSecondary: '#4b5563',
  textMuted: '#9ca3af',
  
  // Navigation
  navActive: '#dc2626',
  navIndicator: '#dc2626',
  navHover: '#fee2e2',
  
  // Links
  linkDefault: '#dc2626',
  linkHover: '#b91c1c',
};

// Default dark theme color palette
export const DEFAULT_DARK_BRAND_COLORS: BrandColors = {
  // Core
  primary: '#e5e5e5',
  secondary: '#a3a3a3',
  accent: '#ef4444',
  
  // Buttons
  buttonPrimary: '#ef4444',
  buttonPrimaryHover: '#f87171',
  buttonSecondary: '#6b7280',
  buttonSecondaryHover: '#9ca3af',
  
  // Backgrounds
  pageBackground: '#0f0f0f',
  cardBackground: '#1a1a1a',
  headerBackground: '#141414',
  
  // Text
  textPrimary: '#f5f5f5',
  textSecondary: '#d4d4d4',
  textMuted: '#737373',
  
  // Navigation
  navActive: '#ef4444',
  navIndicator: '#ef4444',
  navHover: '#2a1a1a',
  
  // Links
  linkDefault: '#ef4444',
  linkHover: '#f87171',
};

export function useBranding() {
  const { data, isLoading, isFetched, error } = useQuery<BrandingData>({
    queryKey: ['/api/branding'],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1,
  });

  // Merge fetched colors with defaults
  const colors: BrandColors = {
    ...DEFAULT_BRAND_COLORS,
    ...(data?.colors || {}),
  };
  
  // Merge fetched dark colors with defaults
  const darkColors: BrandColors = {
    ...DEFAULT_DARK_BRAND_COLORS,
    ...(data?.darkColors || {}),
  };

  // Return branding data with defaults
  return {
    companyName: data?.companyName || 'Luxury Transportation',
    tagline: data?.tagline || 'Premium Transportation Services',
    description: data?.description || '',
    logoUrl: data?.logoUrl || '/images/logo_1759125364025.png',
    faviconUrl: data?.faviconUrl || '/images/favicon_1759253989963.png',
    colors,
    darkColors,
    contactEmail: data?.contactEmail || '',
    contactPhone: data?.contactPhone || '',
    contactAddress: data?.contactAddress || '',
    isLoading,
    isFetched,
    error
  };
}
