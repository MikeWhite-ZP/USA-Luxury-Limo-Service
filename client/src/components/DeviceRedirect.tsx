import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { isMobileDevice, setDevicePreference } from '@/lib/deviceDetection';
import { Button } from '@/components/ui/button';
import { Smartphone, Monitor } from 'lucide-react';

/**
 * Component that automatically redirects mobile users to /mobile
 * and displays a desktop landing page for desktop users
 */
export default function DeviceRedirect() {
  const [, navigate] = useLocation();

  useEffect(() => {
    // Auto-redirect mobile users to /mobile
    if (isMobileDevice()) {
      navigate('/mobile');
    }
  }, [navigate]);

  // Desktop users see the landing page
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            USA Luxury Limo
          </h1>
          <p className="text-xl md:text-2xl text-blue-200 mb-4">
            Premium Transportation Services
          </p>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Experience luxury travel with our professional chauffeur services. 
            Available 24/7 for all your transportation needs.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20 hover:bg-white/15 transition-all">
            <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto">
              <Smartphone className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4 text-center">Mobile App</h2>
            <p className="text-slate-300 text-center mb-6">
              Book rides, track your driver, and manage your account on the go.
            </p>
            <Button
              onClick={() => {
                setDevicePreference('mobile');
                navigate('/mobile');
              }}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white text-lg"
              data-testid="button-mobile-version"
            >
              Open Mobile Version
            </Button>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20 hover:bg-white/15 transition-all">
            <div className="bg-indigo-600 w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto">
              <Monitor className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4 text-center">Desktop Portal</h2>
            <p className="text-slate-300 text-center mb-6">
              Access admin dashboard, dispatcher tools, and fleet management.
            </p>
            <Button
              onClick={() => {
                setDevicePreference('desktop');
                navigate('/login');
              }}
              className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white text-lg"
              data-testid="button-desktop-login"
            >
              Staff Login
            </Button>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-slate-400">
            Need help? Contact us at support@usaluxurylimo.com
          </p>
        </div>
      </div>
    </div>
  );
}
