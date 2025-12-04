import { useEffect, lazy, Suspense } from 'react';
import { useLocation } from 'wouter';
import { isMobileDevice } from '@/lib/deviceDetection';

const Landing = lazy(() => import('@/pages/landing'));

/**
 * Utility to check if accessing via admin subdomain
 */
function isAdminSubdomain(): boolean {
  const hostname = window.location.hostname.toLowerCase();
  
  if (hostname.startsWith('adminaccess.')) {
    return true;
  }
  
  const adminHosts = import.meta.env.VITE_ADMIN_PANEL_HOSTS?.split(',').map((h: string) => h.trim().toLowerCase()) || [];
  return adminHosts.some((host: string) => hostname === host);
}

/**
 * Component that automatically redirects mobile users to /mobile (or /mobile-admin-login for admin subdomain)
 * and displays the normal landing page for desktop users
 */
export default function DeviceRedirect() {
  const [, navigate] = useLocation();

  useEffect(() => {
    if (isMobileDevice()) {
      if (isAdminSubdomain()) {
        navigate('/mobile-admin-login');
      } else {
        navigate('/mobile');
      }
    }
  }, [navigate]);

  if (isAdminSubdomain()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
        <div className="animate-spin w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full" />
      </div>
    );
  }

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
