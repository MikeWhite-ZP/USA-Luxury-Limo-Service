import { useQuery } from '@tanstack/react-query';

export interface BrandingData {
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

export function useBranding() {
  const { data, isLoading, error } = useQuery<BrandingData>({
    queryKey: ['/api/branding'],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1,
  });

  // Return branding data with defaults
  return {
    companyName: data?.companyName || 'USA Luxury Limo',
    tagline: data?.tagline || 'Premium Transportation Services',
    description: data?.description || '',
    logoUrl: data?.logoUrl || '/images/logo_1759125364025.png',
    faviconUrl: data?.faviconUrl || '/images/favicon_1759253989963.png',
    colors: data?.colors || {
      primary: '#1a1a1a',
      secondary: '#666666',
      accent: '#d4af37'
    },
    isLoading,
    error
  };
}
