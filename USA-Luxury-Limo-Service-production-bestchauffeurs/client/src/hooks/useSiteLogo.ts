import { useQuery } from '@tanstack/react-query';

const logoImage = '/images/logo_1759125364025.png';

type SiteLogo = {
  id: string;
  url: string;
  altText: string;
  fileName: string;
} | null;

export function useSiteLogo() {
  const { data, isLoading, error } = useQuery<{ logo: SiteLogo }>({
    queryKey: ['/api/site-logo'],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1,
  });

  // Return the logo URL or fallback to default logo
  return {
    logoUrl: data?.logo?.url || logoImage,
    logoAltText: data?.logo?.altText || "USA Luxury Limo",
    isCustomLogo: !!data?.logo,
    isLoading,
    error
  };
}
