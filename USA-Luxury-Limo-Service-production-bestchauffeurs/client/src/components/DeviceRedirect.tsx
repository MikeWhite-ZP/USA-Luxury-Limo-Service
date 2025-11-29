import { useEffect, lazy, Suspense } from 'react';
import { useLocation } from 'wouter';
import { isMobileDevice } from '@/lib/deviceDetection';

const Landing = lazy(() => import('@/pages/landing'));

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
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    }>
      <Landing />
    </Suspense>
  );
}
