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
}

export interface BrandingData {
  companyName: string;
  tagline: string;
  description: string;
  logoUrl: string;
  faviconUrl: string;
  colors: BrandColors;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
}

// Default color palette
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

  // Return branding data with defaults
  return {
    companyName: data?.companyName || 'Luxury Transportation',
    tagline: data?.tagline || 'Premium Transportation Services',
    description: data?.description || '',
    logoUrl: data?.logoUrl || '/images/logo_1759125364025.png',
    faviconUrl: data?.faviconUrl || '/images/favicon_1759253989963.png',
    colors,
    contactEmail: data?.contactEmail || '',
    contactPhone: data?.contactPhone || '',
    contactAddress: data?.contactAddress || '',
    isLoading,
    isFetched,
    error
  };
}
