import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { isMobileDevice } from '@/lib/deviceDetection';
import Landing from '@/pages/landing';

/**
 * Component that automatically redirects mobile users to /mobile
 * and displays the normal landing page for desktop users
 */
export default function DeviceRedirect() {
  const [, navigate] = useLocation();

  useEffect(() => {
    // Auto-redirect mobile users to /mobile
    if (isMobileDevice()) {
      navigate('/mobile');
    }
  }, [navigate]);

  // Desktop users see the normal landing page
  return <Landing />;
}
