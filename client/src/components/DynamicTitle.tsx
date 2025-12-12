import { useEffect } from 'react';
import { useBranding } from '@/hooks/useBranding';

export function DynamicTitle() {
  const { companyName, tagline, isFetched } = useBranding();

  useEffect(() => {
    if (isFetched && companyName) {
      document.title = tagline 
        ? `${companyName} - ${tagline}`
        : companyName;
    }
  }, [companyName, tagline, isFetched]);

  return null;
}
