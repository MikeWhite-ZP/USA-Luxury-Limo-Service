import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

interface FaviconData {
  favicon: {
    id: string;
    url: string;
    altText: string;
    fileName: string;
  } | null;
}

export function useFavicon() {
  const { data: faviconData } = useQuery<FaviconData>({
    queryKey: ['/api/site-favicon'],
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (faviconData?.favicon?.url) {
      updateFavicon(faviconData.favicon.url);
    }
  }, [faviconData]);

  return faviconData?.favicon;
}

function updateFavicon(url: string) {
  const sizes = [
    { size: '16x16', rel: 'icon' },
    { size: '32x32', rel: 'icon' },
    { size: '192x192', rel: 'icon' },
    { size: '512x512', rel: 'icon' },
    { size: '180x180', rel: 'apple-touch-icon' },
  ];

  sizes.forEach(({ size, rel }) => {
    const selector = rel === 'apple-touch-icon' 
      ? `link[rel="apple-touch-icon"][sizes="${size}"]`
      : `link[rel="icon"][type="image/png"][sizes="${size}"]`;
    
    let link = document.querySelector(selector) as HTMLLinkElement;
    
    if (!link && rel === 'icon') {
      link = document.createElement('link');
      link.rel = rel;
      link.type = 'image/png';
      link.sizes.value = size;
      document.head.appendChild(link);
    } else if (!link && rel === 'apple-touch-icon') {
      link = document.createElement('link');
      link.rel = rel;
      link.sizes.value = size;
      document.head.appendChild(link);
    }
    
    if (link) {
      link.href = url;
    }
  });

  const shortcutLink = document.querySelector('link[rel="shortcut icon"]') as HTMLLinkElement;
  if (!shortcutLink) {
    const link = document.createElement('link');
    link.rel = 'shortcut icon';
    link.href = url;
    document.head.appendChild(link);
  } else {
    shortcutLink.href = url;
  }
}
