import { useQuery } from '@tanstack/react-query';

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

  // Return null while loading to prevent flash of wrong logo
  // Each tenant's logo will load from their own branding settings
  return {
    logoUrl: isLoading ? null : (data?.logo?.url || null),
    logoAltText: data?.logo?.altText || "Company Logo",
    isCustomLogo: !!data?.logo,
    isLoading,
    error
  };
}
